CREATE TYPE "public"."approval_action" AS ENUM('approve', 'reject', 'cancel', 'request_changes');--> statement-breakpoint
CREATE TYPE "public"."approval_task_status" AS ENUM('pending', 'approved', 'rejected', 'skipped', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('scheduled', 'present', 'absent', 'half_day', 'late', 'early_departure', 'late_and_early', 'holiday', 'weekend', 'leave', 'work_from_home', 'regularization_pending', 'regularized', 'missing_punch');--> statement-breakpoint
CREATE TYPE "public"."leave_application_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."leave_transaction_type" AS ENUM('opening', 'accrual', 'consumption', 'reservation', 'reservation_release', 'cancellation_reversal', 'adjustment', 'carry_forward', 'expiry');--> statement-breakpoint
CREATE TYPE "public"."punch_type" AS ENUM('clock_in', 'clock_out', 'break_start', 'break_end');--> statement-breakpoint
CREATE TYPE "public"."regularization_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."workflow_actor_type" AS ENUM('reporting_manager', 'organization_role', 'specific_user', 'department_head', 'hr_admin');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."workflow_step_mode" AS ENUM('sequential', 'parallel');--> statement-breakpoint
CREATE TABLE "approval_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"workflow_step_id" uuid,
	"task_id" uuid,
	"actor_user_id" uuid NOT NULL,
	"action" "approval_action" NOT NULL,
	"comment" varchar(1000),
	"previous_status" "workflow_status" NOT NULL,
	"new_status" "workflow_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"workflow_step_id" uuid NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"approver_employee_id" uuid,
	"status" "approval_task_status" DEFAULT 'pending' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acted_at" timestamp with time zone,
	"comments" varchar(1000),
	"due_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attendance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"grace_period_minutes" integer DEFAULT 0 NOT NULL,
	"late_threshold_minutes" integer DEFAULT 0 NOT NULL,
	"early_departure_threshold_minutes" integer DEFAULT 0 NOT NULL,
	"minimum_work_minutes" integer DEFAULT 0 NOT NULL,
	"allow_regularization" boolean DEFAULT true NOT NULL,
	"regularization_approval_required" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_punches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_id" uuid NOT NULL,
	"punch_type" "punch_type" NOT NULL,
	"punched_at" timestamp with time zone NOT NULL,
	"source" varchar(40) DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"shift_id" uuid,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"actual_first_in" timestamp with time zone,
	"actual_last_out" timestamp with time zone,
	"total_work_minutes" integer DEFAULT 0 NOT NULL,
	"total_break_minutes" integer DEFAULT 0 NOT NULL,
	"net_work_minutes" integer DEFAULT 0 NOT NULL,
	"late_minutes" integer DEFAULT 0 NOT NULL,
	"early_departure_minutes" integer DEFAULT 0 NOT NULL,
	"status" "attendance_status" DEFAULT 'scheduled' NOT NULL,
	"source" varchar(40) DEFAULT 'web' NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_regularization_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_id" uuid NOT NULL,
	"requested_in" timestamp with time zone,
	"requested_out" timestamp with time zone,
	"reason" varchar(1000) NOT NULL,
	"status" "regularization_status" DEFAULT 'pending' NOT NULL,
	"workflow_instance_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"workflow_instance_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"requested_days" integer NOT NULL,
	"half_day" boolean DEFAULT false NOT NULL,
	"reason" varchar(1000) NOT NULL,
	"status" "leave_application_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"leave_year" integer NOT NULL,
	"opening_balance" integer DEFAULT 0 NOT NULL,
	"accrued" integer DEFAULT 0 NOT NULL,
	"consumed" integer DEFAULT 0 NOT NULL,
	"pending" integer DEFAULT 0 NOT NULL,
	"adjusted" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"annual_entitlement" integer DEFAULT 0 NOT NULL,
	"accrual_enabled" boolean DEFAULT false NOT NULL,
	"carry_forward_enabled" boolean DEFAULT false NOT NULL,
	"maximum_carry_forward" integer,
	"probation_eligible" boolean DEFAULT false NOT NULL,
	"negative_balance_allowed" boolean DEFAULT false NOT NULL,
	"approval_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"leave_balance_id" uuid NOT NULL,
	"transaction_type" "leave_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"reference_id" uuid,
	"reason" varchar(500),
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" varchar(500),
	"paid" boolean DEFAULT true NOT NULL,
	"color" varchar(20),
	"minimum_days" integer DEFAULT 1 NOT NULL,
	"maximum_days" integer,
	"half_day_allowed" boolean DEFAULT true NOT NULL,
	"cancellation_allowed" boolean DEFAULT true NOT NULL,
	"notice_period_days" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"code" varchar(80) NOT NULL,
	"workflow_type" varchar(80) NOT NULL,
	"description" varchar(500),
	"active" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_version_id" uuid NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid NOT NULL,
	"subject_employee_id" uuid NOT NULL,
	"status" "workflow_status" DEFAULT 'pending' NOT NULL,
	"current_step_order" integer DEFAULT 1 NOT NULL,
	"submitted_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"actor_type" "workflow_actor_type" NOT NULL,
	"actor_role_key" varchar(80),
	"actor_user_id" uuid,
	"mode" "workflow_step_mode" DEFAULT 'sequential' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"definition_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_workflow_step_id_workflow_steps_id_fk" FOREIGN KEY ("workflow_step_id") REFERENCES "public"."workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_task_id_approval_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."approval_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_workflow_step_id_workflow_steps_id_fk" FOREIGN KEY ("workflow_step_id") REFERENCES "public"."workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approver_employee_id_employees_id_fk" FOREIGN KEY ("approver_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_regularization_requests" ADD CONSTRAINT "attendance_regularization_requests_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_leave_balance_id_leave_balances_id_fk" FOREIGN KEY ("leave_balance_id") REFERENCES "public"."leave_balances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_version_id_workflow_versions_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "public"."workflow_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_subject_employee_id_employees_id_fk" FOREIGN KEY ("subject_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_version_id_workflow_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."workflow_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_definition_id_workflow_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_history_instance_idx" ON "approval_history" USING btree ("organization_id","workflow_instance_id","created_at");--> statement-breakpoint
CREATE INDEX "approval_tasks_user_status_idx" ON "approval_tasks" USING btree ("organization_id","approver_user_id","status");--> statement-breakpoint
CREATE INDEX "approval_tasks_instance_idx" ON "approval_tasks" USING btree ("organization_id","workflow_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_policies_org_name_idx" ON "attendance_policies" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "attendance_punches_record_idx" ON "attendance_punches" USING btree ("organization_id","attendance_id","punched_at");--> statement-breakpoint
CREATE INDEX "attendance_punches_employee_idx" ON "attendance_punches" USING btree ("organization_id","employee_id","punched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_org_employee_date_idx" ON "attendance_records" USING btree ("organization_id","employee_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_org_date_idx" ON "attendance_records" USING btree ("organization_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_org_status_idx" ON "attendance_records" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "regularization_active_idx" ON "attendance_regularization_requests" USING btree ("organization_id","attendance_id","status");--> statement-breakpoint
CREATE INDEX "regularization_org_status_idx" ON "attendance_regularization_requests" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "leave_apps_org_employee_idx" ON "leave_applications" USING btree ("organization_id","employee_id","start_date");--> statement-breakpoint
CREATE INDEX "leave_apps_org_status_idx" ON "leave_applications" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_balances_employee_type_year_idx" ON "leave_balances" USING btree ("organization_id","employee_id","leave_type_id","leave_year");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_policies_org_type_idx" ON "leave_policies" USING btree ("organization_id","leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_transactions_balance_idx" ON "leave_transactions" USING btree ("organization_id","leave_balance_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_org_code_idx" ON "leave_types" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_defs_org_code_idx" ON "workflow_definitions" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "workflow_instances_entity_idx" ON "workflow_instances" USING btree ("organization_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_steps_version_order_idx" ON "workflow_steps" USING btree ("version_id","step_order");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_versions_definition_version_idx" ON "workflow_versions" USING btree ("definition_id","version");
+--> statement-breakpoint
ALTER TABLE "approval_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "approval_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_punches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_regularization_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_history_tenant_isolation" ON "approval_history" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "approval_tasks_tenant_isolation" ON "approval_tasks" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "attendance_policies_tenant_isolation" ON "attendance_policies" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "attendance_punches_tenant_isolation" ON "attendance_punches" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "attendance_records_tenant_isolation" ON "attendance_records" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "attendance_regularization_requests_tenant_isolation" ON "attendance_regularization_requests" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "leave_applications_tenant_isolation" ON "leave_applications" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "leave_balances_tenant_isolation" ON "leave_balances" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "leave_policies_tenant_isolation" ON "leave_policies" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "leave_transactions_tenant_isolation" ON "leave_transactions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "leave_types_tenant_isolation" ON "leave_types" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "workflow_definitions_tenant_isolation" ON "workflow_definitions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "workflow_instances_tenant_isolation" ON "workflow_instances" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "workflow_steps_tenant_isolation" ON "workflow_steps" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "workflow_versions_tenant_isolation" ON "workflow_versions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
