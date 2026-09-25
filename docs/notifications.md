# Notifications

Notifications are organization-scoped, recipient-owned records with category preferences, read state, delivery records, and idempotency keys. `notification_outbox` is the durable event boundary; in-app delivery is recorded immediately, while email delivery remains pending until a provider worker is configured. Provider failure must not roll back the originating business transaction.

Duplicate events with the same organization and idempotency key do not create duplicate notifications. The current UI supports recent notifications, unread count, mark-read, and mark-all-read. Retention and background retry workers remain infrastructure follow-ups.
