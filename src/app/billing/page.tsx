"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { Check } from "lucide-react";

const PLANS = [
  { key: "Free", price: "$0", credits: 10, features: ["10 AI credits/mo", "1 blog", "Basic AI polish", "Markdown editor"] },
  { key: "Pro", price: "$19/mo", credits: 50, features: ["50 AI credits/mo", "Unlimited blogs", "All AI features", "SEO optimization", "Translation", "Team up to 5"] },
  { key: "Unlimited", price: "$49/mo", credits: 999, features: ["Unlimited AI credits", "Unlimited blogs", "All AI features", "Priority support", "Unlimited team"] },
] as const;

export default function BillingPage() {
  const utils = trpc.useUtils();
  const { data: sub } = trpc.billing.getSubscription.useQuery();
  const { data: usage } = trpc.billing.getUsageHistory.useQuery();
  const { data: credits } = trpc.ai.getCredits.useQuery();
  const upgradePlan = trpc.billing.upgradePlan.useMutation({
    onSuccess: () => {
      utils.billing.getSubscription.invalidate();
      utils.ai.getCredits.invalidate();
    },
  });

  const currentPlan = sub?.plan ?? "Free";

  return (
    <main className="flex flex-1 flex-col p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Current plan: <span className="font-medium capitalize">{currentPlan}</span>
        {credits && ` · ${credits.remaining}/${credits.monthlyLimit} credits remaining`}
      </p>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-lg border p-4 space-y-3 ${
              currentPlan === plan.key ? "ring-2 ring-primary" : ""
            }`}
          >
            <div>
              <h3 className="font-semibold">{plan.key}</h3>
              <p className="text-2xl font-bold">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.credits} credits/mo</p>
            </div>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            {currentPlan !== plan.key && (
              <Button
                size="sm"
                className="w-full"
                variant={plan.key === "Free" ? "outline" : "default"}
                onClick={() => upgradePlan.mutate({ plan: plan.key })}
                disabled={upgradePlan.isPending}
              >
                {currentPlan === "Pro" && plan.key === "Free"
                  ? "Downgrade"
                  : plan.key === "Free"
                  ? "Switch to Free"
                  : "Upgrade"}
              </Button>
            )}
            {currentPlan === plan.key && (
              <Button size="sm" className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Usage history */}
      {usage?.transactions && usage.transactions.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold text-sm mb-3">Recent Usage</h2>
          <div className="space-y-1">
            {usage.transactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{tx.capability}</span>
                <span>-{tx.creditsUsed} credit{tx.creditsUsed > 1 ? "s" : ""}</span>
                <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
