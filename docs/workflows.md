# Configurable workflows

Workflow definitions are versioned and organization-scoped. Each version contains ordered sequential or parallel-capable steps. Supported actor resolution includes reporting manager, organization role, specific user, HR administrator, and department head as the extensibility point.

The default leave and attendance-regularization workflows use the employee's reporting manager. A requester cannot approve their own task. New workflow versions should be activated explicitly through the workflow management API.
