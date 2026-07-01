// Provider-neutral, price-free catalog of candidate plan concepts (Readiness
// Pack 41 §3). This is a static informational catalog only — NOT a database
// table and NOT a committed pricing structure. Pricing, plan finalization, and
// any real subscription state are deferred pending commercial/legal/provider
// approval and a dedicated schema-review CCR.

export type BillingPlan = {
  key: string;
  name: string;
  summary: string;
  features: string[];
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    key: "pilot",
    name: "Pilot",
    summary: "Full access for early clubs while billing is being finalized.",
    features: [
      "All modules enabled",
      "Manual, invitation-based onboarding",
      "No payment required during the pilot",
    ],
  },
  {
    key: "free",
    name: "Free",
    summary: "A limited plan for small clubs getting started.",
    features: [
      "Core team and player management",
      "Basic limits on teams and players",
    ],
  },
  {
    key: "monthly",
    name: "Monthly",
    summary: "A paid monthly plan for growing clubs.",
    features: [
      "Higher team and player limits",
      "Full training, matches and reports",
      "Billed monthly",
    ],
  },
  {
    key: "yearly",
    name: "Yearly",
    summary: "A paid yearly plan with the best value.",
    features: [
      "Everything in Monthly",
      "Discounted annual commitment",
      "Billed yearly",
    ],
  },
];
