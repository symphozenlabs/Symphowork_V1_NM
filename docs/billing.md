# Billing and entitlements

## Implemented

The existing plans and subscriptions are extended with provider-neutral billing cycle/status metadata, renewal/provider identifiers, usage counters, centralized entitlement lookup, capacity checks, plan changes, billing overview API, and an explicit `BillingProvider` interface. FREE remains usable without payment credentials. Provider-not-configured state is surfaced instead of faking checkout.

`EntitlementService` behavior is centralized in `src/modules/billing/service.ts`; plan features and numeric limits come from existing `plan_features` records. `null` means unlimited and `0` is a real zero limit.

## Status

- Unit tested: limit and feature policy.
- Integration tested: pending; no `DATABASE_URL` is configured.
- E2E tested: not run.
- Payment provider required: real checkout, invoices, webhooks, and payment lifecycle.
- Deferred: full platform billing administration UI and provider adapter.
