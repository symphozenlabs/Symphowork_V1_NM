# Organization setup

Prompt 3 extends the Prompt 2 organization record with profile/contact fields, date/fiscal configuration, and an atomic employee-ID counter. Tenant master data is stored in departments, designations, locations, teams, employment types, shifts, working days, and holidays. Each table carries `organization_id`, organization-scoped uniqueness, indexes, and RLS policies.

The `/app/settings` page is the setup landing surface. Master-data APIs are tenant-aware and use the existing permission registry.
