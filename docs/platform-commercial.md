# Product Owner commercial management

PO-3 provides platform-level commercial configuration under `/platform/*` and `/api/platform/*`.

## Plans and entitlements

Plans reuse the existing `plans` and `plan_features` tables. The supported plan identifiers remain `FREE`, `STARTER`, `PROFESSIONAL`, and `ENTERPRISE`. Pricing is configuration data in minor currency units; it does not charge customers. Feature values preserve the existing convention: `null` is unlimited, `0` is unavailable, and positive numbers are finite limits.

Organizations resolve entitlements through subscription → plan → plan features. `getEntitlement` and `checkOrganizationEntitlement` remain server-authoritative and accept active or trialing billing states. Active employee usage is counted from employees whose lifecycle status is `active`.

## Subscriptions and billing boundary

Product Owner users can inspect and administer supported subscription records. Status transitions are validated and audited. Provider customer/subscription identifiers are displayable as safe metadata, while credentials and payment operations remain outside this scope. `/api/platform/billing` only reports whether a provider boundary is configured.

## Authorization and audit

Commercial reads and mutations require platform permissions. Organization users do not receive platform commercial access. Subscription changes verify the target organization exists through the explicit platform target-organization boundary, and commercial mutations write safe audit metadata.

PostgreSQL integration/RLS verification remains pending until `DATABASE_URL` is configured.
