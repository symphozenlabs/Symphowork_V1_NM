# Provisioning

Platform Owner organization creation is transactional: it creates a pending organization and exactly one provisioning job. Approval moves the organization to active. Provisioning initializes organization roles, permission links, the FREE plan subscription, and a primary-admin invitation.

The job is uniquely keyed by organization and checks completed state, existing roles, subscription, and pending invitation before creating records. Re-running it is safe. Invitation tokens are returned only to the caller responsible for secure delivery and are stored only as hashes.
