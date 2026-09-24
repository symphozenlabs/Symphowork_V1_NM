import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const userStatus = pgEnum("user_status", ["active", "disabled"]);
export const platformRole = pgEnum("platform_role", ["NONE", "PLATFORM_OWNER"]);
export const organizationStatus = pgEnum("organization_status", ["pending", "active", "suspended", "rejected", "archived"]);
export const membershipStatus = pgEnum("membership_status", ["invited", "active", "suspended", "removed"]);
export const invitationStatus = pgEnum("invitation_status", ["pending", "accepted", "expired", "revoked"]);
export const subscriptionStatus = pgEnum("subscription_status", ["pending", "active", "suspended", "cancelled", "expired"]);
export const provisioningStatus = pgEnum("provisioning_status", ["pending", "running", "completed", "failed", "retrying"]);
export const planCode = pgEnum("plan_code", ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), email: varchar("email", { length: 320 }).notNull().unique(), fullName: varchar("full_name", { length: 160 }).notNull(), passwordHash: text("password_hash").notNull(), status: userStatus("status").default("active").notNull(), platformRole: platformRole("platform_role").default("NONE").notNull(), emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }), ...timestamps,
}, (table) => [index("users_email_idx").on(table.email)]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(), name: varchar("name", { length: 160 }).notNull(), legalName: varchar("legal_name", { length: 240 }).notNull(), slug: varchar("slug", { length: 80 }).notNull().unique(), status: organizationStatus("status").default("pending").notNull(), timezone: varchar("timezone", { length: 80 }).notNull().default("UTC"), currency: varchar("currency", { length: 3 }).notNull().default("INR"), ...timestamps,
}, (table) => [index("organizations_status_idx").on(table.status)]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(), organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }), name: varchar("name", { length: 80 }).notNull(), key: varchar("key", { length: 80 }).notNull(), description: varchar("description", { length: 240 }), isSystem: boolean("is_system").default(false).notNull(), ...timestamps,
}, (table) => [uniqueIndex("roles_org_key_idx").on(table.organizationId, table.key)]);

export const permissions = pgTable("permissions", { id: uuid("id").defaultRandom().primaryKey(), key: varchar("key", { length: 120 }).notNull().unique(), description: varchar("description", { length: 240 }) });
export const rolePermissions = pgTable("role_permissions", { roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }), permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }) }, (table) => [uniqueIndex("role_permissions_pk").on(table.roleId, table.permissionId)]);

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), roleId: uuid("role_id").notNull().references(() => roles.id), status: membershipStatus("status").default("invited").notNull(), ...timestamps,
}, (table) => [index("memberships_org_idx").on(table.organizationId), index("memberships_user_status_idx").on(table.userId, table.status)]);

export const sessions = pgTable("sessions", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() }, (table) => [index("sessions_user_idx").on(table.userId), index("sessions_expiry_idx").on(table.expiresAt)]);
export const emailVerificationTokens = pgTable("email_verification_tokens", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), usedAt: timestamp("used_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() });
export const passwordResetTokens = pgTable("password_reset_tokens", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), usedAt: timestamp("used_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() });

export const plans = pgTable("plans", { id: uuid("id").defaultRandom().primaryKey(), code: planCode("code").notNull().unique(), name: varchar("name", { length: 80 }).notNull(), description: varchar("description", { length: 240 }), maxUsers: integer("max_users"), maxStorageBytes: integer("max_storage_bytes"), billingInterval: varchar("billing_interval", { length: 20 }).notNull().default("monthly"), active: boolean("active").default(true).notNull(), ...timestamps });
export const planFeatures = pgTable("plan_features", { id: uuid("id").defaultRandom().primaryKey(), planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }), featureKey: varchar("feature_key", { length: 120 }).notNull(), enabled: boolean("enabled").default(true).notNull(), limitValue: integer("limit_value") }, (table) => [uniqueIndex("plan_features_key_idx").on(table.planId, table.featureKey)]);
export const subscriptions = pgTable("subscriptions", { id: uuid("id").defaultRandom().primaryKey(), organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }), planId: uuid("plan_id").notNull().references(() => plans.id), status: subscriptionStatus("status").default("pending").notNull(), startsAt: timestamp("starts_at", { withTimezone: true }), endsAt: timestamp("ends_at", { withTimezone: true }), ...timestamps });

export const invitations = pgTable("invitations", { id: uuid("id").defaultRandom().primaryKey(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), invitedEmail: varchar("invited_email", { length: 320 }).notNull(), intendedRole: varchar("intended_role", { length: 80 }).notNull(), tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), status: invitationStatus("status").default("pending").notNull(), acceptedAt: timestamp("accepted_at", { withTimezone: true }), ...timestamps }, (table) => [index("invitations_email_idx").on(table.invitedEmail), index("invitations_org_status_idx").on(table.organizationId, table.status)]);
export const provisioningJobs = pgTable("provisioning_jobs", { id: uuid("id").defaultRandom().primaryKey(), organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }), jobType: varchar("job_type", { length: 80 }).notNull().default("organization.provision"), status: provisioningStatus("status").default("pending").notNull(), currentStep: varchar("current_step", { length: 80 }).notNull().default("created"), attempts: integer("attempts").default(0).notNull(), startedAt: timestamp("started_at", { withTimezone: true }), completedAt: timestamp("completed_at", { withTimezone: true }), failureMessage: varchar("failure_message", { length: 1000 }), ...timestamps }, (table) => [index("provisioning_status_idx").on(table.status)]);
export const auditLogs = pgTable("audit_logs", { id: uuid("id").defaultRandom().primaryKey(), actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }), organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }), action: varchar("action", { length: 120 }).notNull(), resource: varchar("resource", { length: 120 }).notNull(), resourceId: uuid("resource_id"), requestId: varchar("request_id", { length: 80 }), metadata: text("metadata"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() }, (table) => [index("audit_org_created_idx").on(table.organizationId, table.createdAt), index("audit_actor_created_idx").on(table.actorUserId, table.createdAt)]);
export const systemConfig = pgTable("system_config", { key: varchar("key", { length: 120 }).primaryKey(), value: varchar("value", { length: 2000 }).notNull(), ...timestamps });
