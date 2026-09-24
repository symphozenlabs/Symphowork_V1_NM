# Testing

Vitest runs fast unit and domain tests with `pnpm test`. Playwright runs browser smoke tests with `pnpm test:e2e`; its configuration starts the local Next.js server automatically.

Tests should verify behavior at boundaries: validation, error serialization, provider contracts, database services, and accessible user flows. Avoid tests that only assert that code exists.
