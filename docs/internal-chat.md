# Internal chat

## Implemented

Prompt 10 adds organization-scoped direct/group conversations, membership roles, soft-deletable/editable messages, replies, message types including `task_reference`, reactions, client idempotency keys, read timestamps, muted membership fields, stable message pagination, and a future task-reference boundary.

Conversation membership is checked server-side before reading or sending. All message queries are tenant-scoped and member-scoped. Direct-conversation uniqueness and full group administration are database/service follow-ups.

## Realtime boundary

No WebSocket or realtime provider is configured. HTTP APIs remain functional and do not claim live delivery, presence, typing indicators, or live task updates. A future `RealtimeProvider` should own those capabilities without changing the message model.

## Verification status

- Implemented: conversation/message schema, membership authorization, replies, soft deletion fields, reactions, idempotent message creation, read-state updates, and paginated message API.
- Unit tested: policy layer only.
- Integration tested: pending; no `DATABASE_URL` is configured.
- E2E tested: not run.
- Deferred to Prompt 11+: Chat-to-task automation, realtime transport, notifications fan-out, attachment endpoints/UI, search UI, presence, typing indicators, and advanced analytics.
