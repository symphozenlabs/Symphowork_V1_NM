# Approval engine

`approval_tasks` is the actionable inbox and `approval_history` is the append-only decision trail. A task can only be acted on by its assigned user while pending. The action and next-step transition are performed inside a database transaction. Domain completion updates leave balances or attendance regularization state after the workflow transition.

Notification delivery is intentionally provider-neutral. `emitNotificationEvent` records a structured event boundary; email, push, or in-app delivery providers can subscribe without changing domain services.
