## Parent

PRD: [#1](https://github.com/ecomgogo/blogger-support/issues/1)

## What to build

Implement the freemium billing system. Free tier users get a monthly credit allowance; paid users get unlimited or higher limits. Integrate with Stripe for payment processing.

- Define plans: Free (e.g., 10 credits/month), Pro (e.g., $19/month, 50 credits), Unlimited (e.g., $49/month, unlimited credits). Store plan definitions in the database.
- Add Subscription record to Tenant, tracking plan, status, and billing period.
- Integrate Stripe Checkout for plan upgrades. Create Stripe products/prices for each plan.
- Billing page: shows current plan, credit usage this month, upgrade/downgrade buttons.
- Stripe webhook: handle subscription.created, subscription.updated, subscription.deleted events.
- Credit reset: on billing period start, reset credit counter for all tenants on that cycle.
- Usage tracking: record each credit deduction with timestamp for audit/history.
- Upgrade/downgrade flow: immediate plan change, prorated billing (optional for MVP — can do simple immediate switch).

## Acceptance criteria

- [ ] New tenant starts on Free plan with 10 credits.
- [ ] Credit counter in header shows "X / 10 credits remaining" for free users.
- [ ] User clicks "Upgrade" → Stripe Checkout opens → completes payment → plan changes to Pro.
- [ ] Pro user sees "X / 50 credits remaining" (or "Unlimited" for Unlimited plan).
- [ ] User on Pro can downgrade to Free; change takes effect at end of billing period (or immediately for MVP).
- [ ] Credits reset at the start of each billing month.
- [ ] When free user hits 0 credits, AI buttons are disabled with an upgrade prompt.
- [ ] Stripe webhook events are handled correctly (subscription lifecycle).
- [ ] Credit deduction history is recorded and visible on the billing page.

## Blocked by

- [#8](https://github.com/ecomgogo/blogger-support/issues/8) — AI Foundation + Polish (for the credit system foundation)
