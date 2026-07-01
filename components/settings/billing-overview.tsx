import type { BillingPlan } from "@/lib/billing/plans";

interface BillingOverviewProps {
  orgName: string;
  plans: BillingPlan[];
}

export default function BillingOverview({ orgName, plans }: BillingOverviewProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Subscription status — placeholder pilot state (no billing table exists yet) */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Subscription status
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Pilot
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {orgName} is part of the pilot program. Billing is not yet enabled — all features
            remain available at no cost.
          </p>
        </div>
      </section>

      {/* Plans preview — informational only, no prices, no checkout */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Plans</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Preview — pricing to be announced.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{plan.summary}</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Coming-soon note */}
      <p className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Payment and subscription management will be available once billing is enabled for your club.
      </p>
    </div>
  );
}
