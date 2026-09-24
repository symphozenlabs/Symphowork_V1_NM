# Leave

Leave types and policies are organization-owned. Working-day configuration and active holidays are used to calculate requested duration. Balances use real-valued amounts so half-day requests are represented as `0.5`.

Submission reserves balance and writes a reservation transaction. Approval converts the reservation to consumption; rejection or cancellation releases it. Date overlap, minimum/maximum duration, and available balance are validated before submission.
