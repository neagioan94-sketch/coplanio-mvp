# Native Mobile Feasibility Analysis

**CCR:** CCR-023 — Post-MVP Native Mobile Feasibility
**Source pack:** 42 Post-MVP Native Mobile Feasibility Pack
**Branch:** `post-mvp/native-mobile-feasibility`
**Type:** Documentation / architecture review only — **no implementation**
**Date:** 2026-07-01
**Status:** Draft for review

> This document is an analysis deliverable. It does **not** create a mobile app, a React Native/Expo project, a PWA conversion, push/offline infrastructure, new mobile API routes, or any schema/RLS/app change. Per the Feasibility Pack, native mobile is a future architecture decision that must not begin until a dedicated implementation CCR is separately approved.

---

## 1. Feasibility summary

**Does Coplanio need a native mobile app now? No — not yet.**

The current product is a web-first, already-responsive Next.js 16 (App Router) application on Supabase. The single highest-value mobile scenario — a coach marking attendance on the field — is reachable today through the responsive web UI, and can be made materially better with a **Progressive Web App (PWA)** step that requires **no authentication rework and no new API surface**. A true native app (React Native, Expo, or native iOS/Android) would force several large, independent workstreams before it could ship safely: a token-based authentication model, a dedicated mobile API layer, offline sync, and push infrastructure. Each is a separate future CCR with real cost and maintenance implications.

**Recommendation (detail in §8): continue responsive web now; make PWA the first incremental mobile step; defer native until there is demonstrated field need, a maintenance budget, and clear release ownership.**

The rest of this document compares the options, reviews the authentication / API / security implications against the **actual** codebase, lists the risks, and enumerates the future CCRs that would gate any real implementation.

---

## 2. Candidate users and high-value workflows

### 2.1 User groups (priority order)

| Priority | Group | Rationale |
|---|---|---|
| 1 | **Coaches** | On-the-field, time-of-use device is a phone. Primary mobile candidate. |
| 2 | **Head coaches** | Same field context; also some management. |
| 3 | **Organization admins** | Mostly desk/admin work — least mobile-first. |
| Deferred | Parents / guardians | Only if the Parent & Player Portal scope is approved for mobile (separate CCR). |
| Deferred | Players | Only if player access scope is approved (player login is out of scope in the MVP freeze). |

Feasibility should prioritize **coach field workflows** before any external parent/player mobile flow.

### 2.2 Workflows (highest value first)

| Rank | Workflow | Read/Write | Mobile value | Notes |
|---|---|---|---|---|
| 1 | **Mark attendance on the field** | Write | **Highest** | The canonical "phone in hand, pitch-side" task. Benefits most from offline tolerance. |
| 2 | View training schedule / today's session | Read | High | Simple, read-only; already works on responsive web. |
| 3 | View team roster / player list | Read | High | Read-only; low complexity. |
| 4 | View match schedule | Read | Medium | Read-only. |
| 5 | Record match notes / results | Write | Medium | Occasional write; tolerant of "do it after the match." |
| 6 | View reports | Read | Low–Medium | Already downloadable (PDF export exists); rarely needed field-side. |
| — | Receive notifications | Push | Deferred | Depends on notification infrastructure, which is itself deferred (see §6). |

**Principle:** mobile should **not** try to replicate every desktop/admin workflow. The value is concentrated in a handful of read views plus attendance capture.

---

## 3. Architecture option comparison

Scored **Low / Medium / High** where higher can be good or bad depending on the column (see header).

| Option | Build effort (lower better) | Fits current cookie/SSR auth | Reuses existing web app | Offline capability | Push capability | App-store overhead (lower better) | Maintenance burden (lower better) |
|---|---|---|---|---|---|---|---|
| **Responsive web (today)** | None (done) | ✅ native fit | ✅ 100% | ❌ none | ❌ none | None | Lowest (one codebase) |
| **PWA** (installable web) | Low | ✅ native fit (same cookies) | ✅ ~100% | ⚠️ Basic (service worker cache, read shell) | ⚠️ Web Push (limited on iOS) | None (no store) | Low (still one codebase) |
| **React Native** | High | ❌ needs token auth rework | ⚠️ logic only, not UI | ✅ Strong (with sync layer) | ✅ Strong (FCM/APNs) | High | High (2nd codebase + stores) |
| **Expo** (managed RN) | Medium–High | ❌ needs token auth rework | ⚠️ logic only, not UI | ✅ Strong | ✅ Strong (Expo push) | Medium–High | High (2nd codebase, faster tooling) |
| **Native iOS + Android** | Very High | ❌ needs token auth rework | ❌ minimal | ✅ Strong | ✅ Strong | High | Highest (two more codebases) |
| **Hybrid wrapper** (web app in a WebView shell) | Low–Medium | ✅ mostly (cookie caveats in WebView) | ✅ ~100% | ❌ inherits web (none) | ⚠️ shell-provided | Medium (store submission) | Medium (shell + web) |

**Reading of the table:** the two options that reuse the existing app and its authentication with the least new surface are **PWA** and **hybrid wrapper**. Of those, **PWA is the cleaner first step** — no store submission, no WebView cookie edge cases, standard tooling, and a genuine (if limited) offline story via a service worker. The three "true native" options (RN / Expo / native) all share the same blocking prerequisite: they cannot use the current cookie/SSR session and therefore require a token-based auth model plus a dedicated API layer (see §4, §5).

---

## 4. Authentication and authorization implications

### 4.1 What exists today (verified in the codebase)

- **Sessions are cookie-based via `@supabase/ssr`.** `lib/db/supabase-server.ts` builds a `createServerClient` bound to Next's request cookies. Auth state lives in httpOnly Supabase auth cookies read on the server. This is a **browser-oriented** model.
- **Organization context is resolved server-side.** `getActiveOrganization` / `requireActiveOrganization` (`lib/organizations/get-organization.ts`) combine an `active_organization_id` httpOnly cookie with a membership lookup — the client never supplies `organization_id`.
- **Role checks are server-side.** `requireRole(...)`, `isOrganizationAdmin(...)`, and the `canManageX(...)` helpers all query `memberships` server-side.
- **Row-level security enforces org scoping at the database.** RLS policies use `has_org_role(...)` / `is_org_member(...)`, so even a mis-scoped query cannot cross organizations.
- **The service-role key is server-only.** `createAdminClient()` (`lib/db/supabase-admin.ts`) is used exclusively in server code (invited-member lookups, portal reads) and is never sent to a browser.

### 4.2 Implications per option

- **PWA:** inherits the exact same cookie/SSR auth as the web app. **No auth change required.** This is the single biggest reason PWA is the low-risk first step.
- **Native (RN / Expo / native):** a native client cannot rely on Next's server-rendered cookie session. It would need **token-based auth** using `@supabase/supabase-js` directly (access + refresh tokens), with:
  - **Secure device storage** for tokens — iOS Keychain / Android Keystore (e.g. `expo-secure-store`), never plain `AsyncStorage`.
  - **Refresh handling** and sign-out/token-revocation flows.
  - **Server-side re-enforcement** of org scoping and roles on every mobile API call — the mobile client is untrusted; `organization_id` must continue to be resolved/validated server-side, never trusted from the device.
  - **RLS must remain the backstop** so a compromised or buggy mobile client still cannot read another org's data.
  - **No service-role key on the device** under any circumstance.

### 4.3 Non-negotiable security invariants for any future mobile work

1. Organization scoping resolved and validated **server-side**.
2. Role-based access control enforced **server-side** (mirror `requireRole` / `canManageX`).
3. RLS remains the database-level backstop (cross-organization isolation).
4. Service-role key never shipped to or reachable from a device.
5. Tokens stored in platform secure storage; short-lived access tokens + refresh rotation.
6. Auditability preserved — important mobile writes (attendance, match results) must still write `audit_events` via the same `createAuditEvent` path.

---

## 5. API / data-access architecture implications

### 5.1 The core constraint

The app is **server-action-first**. Almost every mutation is a Next.js server action (`"use server"` + `useActionState`); there is only **one** route handler in the entire app (`app/(dashboard)/reports/[reportId]/pdf/route.ts`, a GET returning a binary), and `app/api` is otherwise empty. **Server actions are Next-internal RPC (form-encoded, action-id-based) and are not a stable, consumable API for a native client.**

### 5.2 Implications per option

- **PWA:** consumes the existing app exactly as the browser does — **no new API surface, no new attack surface.** Server actions and pages work unchanged.
- **Native:** requires a **dedicated API route-handler layer** (`app/api/...` or equivalent) exposing the needed operations as HTTP endpoints. To avoid business-rule divergence, that layer must **reuse the existing Zod schemas** (`schemas/`) for validation and the existing `requireRole`/org-resolution/RLS checks for authorization. This is a substantial new surface that must be designed, secured, versioned, tested, and maintained in lockstep with the web app.

### 5.3 Data scope

Any mobile access uses the **existing organization-scoped tables** — `organizations, memberships, profiles, teams, players, training_sessions, attendance_records, matches, assessment_types/assessment_results, reports, audit_events`. No new core domain data is implied by mobile itself; the risk is **duplication of access logic**, not new data.

---

## 6. Offline and push notification implications

### 6.1 Offline

- The only workflow with a real offline case is **field attendance capture** (patchy connectivity pitch-side). A read-only "today's session + roster" shell is a nice-to-have.
- **PWA** can cache the read shell via a service worker and queue a small number of writes — a *basic* offline story, adequate for "view schedule/roster offline."
- **Full offline attendance with sync** (write while offline, reconcile later) introduces **conflict resolution** (two devices editing the same session's attendance) and a sync/queue model. This is a genuine engineering workstream, **not** part of feasibility, and should be its own CCR. The existing attendance upsert (`onConflict: "session_id,player_id"`, last-write-wins) is a starting point but not a full offline-sync design.

### 6.2 Push

- Push notifications depend on notification **infrastructure that is itself deferred**: the Notifications & Calendar workstream (CCR-021) shipped only calendar view + `.ics` export and explicitly deferred the `notifications` / `notification_preferences` / `notification_deliveries` tables pending a schema-review CCR.
- Therefore push is **doubly gated**: it needs both the notification data model *and* a delivery integration (Web Push for PWA — limited on iOS; FCM/APNs for native). Treat push as optional and out of scope until those prerequisites are approved.

---

## 7. Risks and constraints

| Risk | Applies most to | Mitigation direction |
|---|---|---|
| **Duplication of web functionality** | Native | Prefer PWA (reuses web); if native, share schemas + a thin API, not re-implemented rules. |
| **Web/mobile business-rule divergence** | Native | Single source of truth for validation (`schemas/`) and authorization (server-side). |
| **Authentication complexity** | Native | Token model + secure storage + refresh; PWA avoids this entirely. |
| **Mobile API attack surface** | Native | New route layer must re-apply org scoping, `requireRole`, RLS; rate-limit; never trust client `organization_id`. |
| **Offline conflict resolution** | Native / advanced PWA | Deferred; design a sync/merge model in its own CCR before building. |
| **Push infrastructure complexity** | Native / PWA push | Deferred; depends on notification tables + provider. |
| **App-store review & maintenance overhead** | Native | Two more release pipelines, store policies, review latency; PWA has none. |
| **Increased testing burden** | Native | A second codebase multiplies device/OS test matrix; PWA stays within the existing web test scope. |

---

## 8. Recommended first mobile path

**Phase 1 — now: continue with responsive web.** The app is already responsive (mobile top bar + overlay sidebar in `components/layout/app-sidebar.tsx`). Keep investing in responsive polish for the priority coach workflows (attendance, schedule, roster) — this is zero-risk and immediately useful.

**Phase 2 — first incremental mobile step: PWA exploration.** A PWA is the best-value next step because it:
- reuses the existing app, auth (cookie/SSR), and API surface with **no rework**;
- adds **installability** (home-screen icon, standalone display) and a **basic offline read shell** via a service worker;
- introduces **no app-store overhead** and **no second codebase**.
It should be scoped as its own CCR (manifest + service worker + offline read shell for schedule/roster), explicitly **not** attempting full offline write-sync or push in the first pass.

**Phase 3 — defer native (React Native / Expo / native iOS+Android)** until there is:
- demonstrated field need that PWA cannot meet (e.g. hard offline-write requirements, native push, deep device integration);
- a committed **maintenance budget and release owner** for a second codebase and app-store pipelines;
- the prerequisite workstreams approved (token auth, mobile API layer, offline sync, push infra).

If native is eventually chosen, **Expo** is the pragmatic default over bare React Native or fully native (faster tooling, managed builds, `expo-secure-store` for tokens, Expo push), while accepting the same auth/API prerequisites.

---

## 9. Required future CCRs before any implementation

None of the below may start from this feasibility CCR. Each is a separate, gated workstream:

| # | Future CCR | Depends on / notes |
|---|---|---|
| A | **Token-based mobile authentication model** | Prerequisite for any native option; secure device token storage + refresh + revocation. |
| B | **Mobile API route layer + shared validation** | Dedicated `app/api` route handlers reusing `schemas/` + server-side role/RLS checks. Prerequisite for native. |
| C | **PWA conversion** (recommended first) | Manifest + service worker + offline read shell. Low risk; no auth/API rework. |
| D | **Offline sync model for attendance** | Conflict-resolution/merge design; only after a real offline-write requirement is confirmed. |
| E | **Push notification infrastructure** | Depends on the deferred notification tables (CCR-021 follow-up) + a delivery provider (Web Push / FCM / APNs). |
| F | **Native project scaffold + app-store setup** | Expo/RN project, CI, Apple/Google accounts, review pipelines. Only after A + B. |
| G | **Parent/player mobile access** | Depends on the Parent & Player Portal scope (CCR-020) being approved for mobile. |

Each of A–G additionally requires the schema/RLS review process where it touches the database, and must preserve every security invariant in §4.3.

---

## 10. Traceability report (20B)

### Verdict: **Pass** — feasibility analysis only; no implementation, schema, RLS, mobile project, or API routes created.

### Traceability matrix

| Requirement (source) | Addressed in | Status | Notes |
|---|---|---|---|
| Compare responsive / PWA / RN / Expo / native / hybrid (Pack §5; Prompt Scope 1) | §3 | Pass | Six-option comparison table. |
| Candidate mobile users (Pack §3) | §2.1 | Pass | Coaches prioritized; parent/player deferred. |
| High-value mobile workflows (Pack §4; Prompt Scope 2) | §2.2 | Pass | Attendance capture identified as #1. |
| Authentication & authorization implications (Pack §6/§8; Prompt Scope 3) | §4 | Pass | Cookie/SSR vs token model; secure storage; server-side authz. |
| API architecture implications (Pack §6; Prompt Scope 4) | §5 | Pass | Server-action-first constraint; native needs new API layer. |
| Offline & push implications (Pack §9; Prompt Scope 5) | §6 | Pass | Offline attendance + push both gated/deferred. |
| Cost / maintenance / testing risks (Pack §9; Prompt Scope 6) | §7 | Pass | Risk table. |
| Recommendation for next step (Pack §11; Prompt Scope 7) | §8 | Pass | Responsive → PWA → defer native. |
| Required future CCRs (Prompt Deliverable 5) | §9 | Pass | A–G enumerated and gated. |
| Security guardrails: org scoping, RBAC, secure auth, token storage, no service role, cross-org isolation, auditability (Pack §8; Prompt Security 1–8) | §4.1–§4.3, §5.2, §7 | Pass | Mapped to real code (`get-organization.ts`, RLS, `supabase-admin.ts`, `createAuditEvent`). |

### Out-of-scope / negative checks

| Check (CCR-023 Verification) | Result |
|---|---|
| No implementation code created | Pass — only `docs/native-mobile-feasibility.md` added. |
| No schema changes | Pass — `supabase/` untouched. |
| No RLS changes | Pass — no policy files touched. |
| No mobile app project created | Pass — no RN/Expo/PWA project. |
| No new API routes | Pass — `app/api` unchanged (empty). |
| Findings traceable to source documents | Pass — matrix above. |

### Source documents used

42 Post-MVP Native Mobile Feasibility Pack; 36 Post-MVP Roadmap & Scope Control Pack; 18 Global MVP Scope Freeze & Implementation Decisions; 14 MVP Technical Implementation Specification; 16 MVP Screen Map & User Flows; plus direct inspection of the current codebase (auth, org-scoping, RLS, server actions, responsive layout).

---

## 11. Final recommendation (one line)

**Stay on responsive web, pursue a PWA as the first mobile increment, and defer any native app until a concrete field need, a maintenance budget, and the prerequisite auth/API/offline/push CCRs are in place.**
