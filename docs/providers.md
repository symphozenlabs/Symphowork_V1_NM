# Provider readiness

| Provider | Current state | Production requirement |
| --- | --- | --- |
| EmailProvider | abstraction/config flag only | Configure verified delivery for verification, reset, invitations, and notifications |
| StorageProvider | abstraction and local/dev configuration | Private object storage, signed URLs, lifecycle, malware scanning |
| AIProvider | provider-neutral interface | Required only for external AI resume/relevance features |
| Embeddings/vector | persisted boundary only | Required for real semantic retrieval |
| BillingProvider | abstraction only | Required for paid self-service subscriptions |
| RealtimeProvider | not configured | Required for live chat, presence, and typing indicators |
| Job/Queue | foundation/deferred operations | Required for reliable scheduled notifications, reminders, resume/embedding processing |
| Error monitoring | lightweight safe logging boundary | Configure production error aggregation and alerting |

The FREE plan and deterministic flows must remain usable without payment or AI providers.
