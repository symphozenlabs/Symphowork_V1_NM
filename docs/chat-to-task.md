# Chat-to-Task automation

## Implemented

Messages can be converted to tasks through a tenant- and conversation-membership-validated API. The task stores `sourceType: chat`; `collaboration_message_task_links` provides a unique, bidirectional message/task reference. Conversion preserves message content as the default description, supports assignee, project, due date, priority, and duplicate protection. Assignment notifications and audit records are created through existing infrastructure.

Chat mentions now validate organization employees and create deduplicated in-app notifications. Task automation remains provider-neutral; no autonomous AI task creation is implemented.

## Status

- Unit tested: policy and source-boundary primitives.
- Integration tested: pending; no `DATABASE_URL` is configured.
- E2E tested: not run.
- Deferred: task-reference UI actions, complete task mention notifications, due-date worker, and broader automation rules.
