CREATE TYPE "public"."document_lifecycle_status" AS ENUM('active', 'expiring', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."expense_claim_status" AS ENUM('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."expense_receipt_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('attendance', 'leave', 'expense', 'documents', 'onboarding', 'approvals', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('pending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_status" AS ENUM('not_eligible', 'pending', 'processing', 'reimbursed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "document_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(80) NOT NULL,
	"previous_status" "document_status",
	"new_status" "document_status",
	"comment" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(60) NOT NULL,
	"description" varchar(500),
	"category" varchar(60) DEFAULT 'other' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"expiry_applicable" boolean DEFAULT false NOT NULL,
	"verification_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(60) NOT NULL,
	"description" varchar(500),
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"claim_number" varchar(40) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" varchar(1000),
	"total_amount" real DEFAULT 0 NOT NULL,
	"currency" varchar(3) NOT NULL,
	"expense_date" date NOT NULL,
	"status" "expense_claim_status" DEFAULT 'draft' NOT NULL,
	"reimbursement_status" "reimbursement_status" DEFAULT 'pending' NOT NULL,
	"workflow_instance_id" uuid,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(80) NOT NULL,
	"previous_status" "expense_claim_status",
	"new_status" "expense_claim_status",
	"previous_reimbursement_status" "reimbursement_status",
	"new_reimbursement_status" "reimbursement_status",
	"comment" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"expense_date" date NOT NULL,
	"description" varchar(500) NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(3) NOT NULL,
	"merchant" varchar(180),
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"claim_year" integer NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"maximum_amount" real,
	"daily_limit" real,
	"monthly_limit" real,
	"receipt_required" boolean DEFAULT false NOT NULL,
	"approval_required" boolean DEFAULT true NOT NULL,
	"submission_deadline_days" integer,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"eligible_employee_types" text,
	"department_id" uuid,
	"location_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"file_name" varchar(240) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"mime_type" varchar(120),
	"file_size" integer,
	"uploaded_by_user_id" uuid,
	"verification_status" "expense_receipt_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"attempted_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"next_retry_at" timestamp with time zone,
	"error_category" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"idempotency_key" varchar(180) NOT NULL,
	"payload" text NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "notification_category" NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"subject" varchar(180) NOT NULL,
	"body_template" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"recipient_employee_id" uuid,
	"category" "notification_category" NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(180) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"entity_type" varchar(80),
	"entity_id" uuid,
	"action_url" varchar(240),
	"idempotency_key" varchar(180) NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "document_type_id" uuid;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "category" varchar(60) DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "mime_type" varchar(120);--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "lifecycle_status" "document_lifecycle_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "verification_comment" varchar(1000);--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "replaced_document_id" uuid;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_document_id_employee_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."employee_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_claim_id_expense_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."expense_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_claim_id_expense_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."expense_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_number_counters" ADD CONSTRAINT "expense_number_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_policies" ADD CONSTRAINT "expense_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_policies" ADD CONSTRAINT "expense_policies_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_policies" ADD CONSTRAINT "expense_policies_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_policies" ADD CONSTRAINT "expense_policies_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_item_id_expense_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."expense_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_employee_id_employees_id_fk" FOREIGN KEY ("recipient_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_history_idx" ON "document_history" USING btree ("organization_id","document_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_types_org_code_idx" ON "document_types" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_org_code_idx" ON "expense_categories" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_claims_org_number_idx" ON "expense_claims" USING btree ("organization_id","claim_number");--> statement-breakpoint
CREATE INDEX "expense_claims_org_employee_idx" ON "expense_claims" USING btree ("organization_id","employee_id","expense_date");--> statement-breakpoint
CREATE INDEX "expense_claims_org_status_idx" ON "expense_claims" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "expense_claims_org_reimbursement_idx" ON "expense_claims" USING btree ("organization_id","reimbursement_status");--> statement-breakpoint
CREATE INDEX "expense_history_claim_idx" ON "expense_history" USING btree ("organization_id","claim_id","created_at");--> statement-breakpoint
CREATE INDEX "expense_items_claim_idx" ON "expense_items" USING btree ("organization_id","claim_id");--> statement-breakpoint
CREATE INDEX "expense_items_category_idx" ON "expense_items" USING btree ("organization_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_counter_org_year_idx" ON "expense_number_counters" USING btree ("organization_id","claim_year");--> statement-breakpoint
CREATE INDEX "expense_policies_org_category_idx" ON "expense_policies" USING btree ("organization_id","category_id");--> statement-breakpoint
CREATE INDEX "expense_receipts_item_idx" ON "expense_receipts" USING btree ("organization_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_channel_idx" ON "notification_deliveries" USING btree ("notification_id","channel");--> statement-breakpoint
CREATE INDEX "notification_delivery_retry_idx" ON "notification_deliveries" USING btree ("organization_id","status","next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_outbox_idempotency_idx" ON "notification_outbox" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "notification_outbox_status_idx" ON "notification_outbox" USING btree ("organization_id","status","next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_prefs_user_category_idx" ON "notification_preferences" USING btree ("organization_id","user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_templates_org_type_idx" ON "notification_templates" USING btree ("organization_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_org_idempotency_idx" ON "notifications" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("organization_id","recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("organization_id","recipient_user_id","read_at");--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_documents_type_idx" ON "employee_documents" USING btree ("organization_id","document_type_id");--> statement-breakpoint
CREATE INDEX "employee_documents_expiry_idx" ON "employee_documents" USING btree ("organization_id","expires_at");
--> statement-breakpoint
ALTER TABLE "document_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_number_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_outbox" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_types_tenant_isolation" ON "document_types" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "document_history_tenant_isolation" ON "document_history" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_number_counters_tenant_isolation" ON "expense_number_counters" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_categories_tenant_isolation" ON "expense_categories" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_policies_tenant_isolation" ON "expense_policies" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_claims_tenant_isolation" ON "expense_claims" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_items_tenant_isolation" ON "expense_items" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_receipts_tenant_isolation" ON "expense_receipts" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "expense_history_tenant_isolation" ON "expense_history" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "notifications_tenant_isolation" ON "notifications" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "notification_preferences_tenant_isolation" ON "notification_preferences" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "notification_deliveries_tenant_isolation" ON "notification_deliveries" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "notification_templates_tenant_isolation" ON "notification_templates" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "notification_outbox_tenant_isolation" ON "notification_outbox" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
