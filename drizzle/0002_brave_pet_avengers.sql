CREATE TYPE "public"."document_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('invited', 'onboarding', 'active', 'probation', 'confirmed', 'notice_period', 'inactive', 'resigned', 'terminated', 'exited');--> statement-breakpoint
CREATE TYPE "public"."master_data_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."onboarding_item_status" AS ENUM('pending', 'completed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'invited', 'in_progress', 'completed', 'blocked');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" varchar(500),
	"head_employee_id" uuid,
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" varchar(500),
	"level" integer,
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"document_type" varchar(80) NOT NULL,
	"file_name" varchar(240) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"uploaded_by_user_id" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" date
);
--> statement-breakpoint
CREATE TABLE "employee_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"previous_value" text,
	"new_value" text,
	"reason" varchar(500),
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"employee_id" varchar(40) NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"middle_name" varchar(80),
	"last_name" varchar(80) NOT NULL,
	"display_name" varchar(180) NOT NULL,
	"profile_photo_key" varchar(500),
	"date_of_birth" date,
	"gender" varchar(40),
	"marital_status" varchar(40),
	"nationality" varchar(80),
	"personal_email" varchar(320),
	"work_email" varchar(320),
	"phone" varchar(40),
	"alternate_phone" varchar(40),
	"address_line_1" varchar(240),
	"address_line_2" varchar(240),
	"city" varchar(120),
	"state" varchar(120),
	"country" varchar(120),
	"postal_code" varchar(20),
	"joining_date" date,
	"employment_type_id" uuid,
	"department_id" uuid,
	"designation_id" uuid,
	"reporting_manager_id" uuid,
	"team_id" uuid,
	"location_id" uuid,
	"shift_id" uuid,
	"status" "employee_status" DEFAULT 'invited' NOT NULL,
	"probation_start" date,
	"probation_end" date,
	"confirmation_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "employment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"code" varchar(40) NOT NULL,
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"holiday_date" date NOT NULL,
	"category" varchar(60) DEFAULT 'public' NOT NULL,
	"description" varchar(500),
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(40) NOT NULL,
	"address_line_1" varchar(240),
	"address_line_2" varchar(240),
	"city" varchar(120),
	"state" varchar(120),
	"country" varchar(120),
	"postal_code" varchar(20),
	"timezone" varchar(80) DEFAULT 'UTC' NOT NULL,
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "onboarding_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "onboarding_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"status" "onboarding_item_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_user_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(40) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"grace_minutes" integer DEFAULT 0 NOT NULL,
	"overnight" boolean DEFAULT false NOT NULL,
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid,
	"name" varchar(120) NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" varchar(500),
	"team_lead_employee_id" uuid,
	"status" "master_data_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "working_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_working_day" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "employee_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "invitation_type" varchar(40) DEFAULT 'organization_admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "website" varchar(240);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "contact_email" varchar(320);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "contact_phone" varchar(40);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_1" varchar(240);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_2" varchar(240);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city" varchar(120);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "state" varchar(120);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "country" varchar(120);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "date_format" varchar(40) DEFAULT 'dd/MM/yyyy' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "fiscal_year_start_month" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "employee_id_prefix" varchar(20) DEFAULT 'EMP' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "employee_id_next" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "employee_id_padding" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designations" ADD CONSTRAINT "designations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employment_type_id_employment_types_id_fk" FOREIGN KEY ("employment_type_id") REFERENCES "public"."employment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_types" ADD CONSTRAINT "employment_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklist_items" ADD CONSTRAINT "onboarding_checklist_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklist_items" ADD CONSTRAINT "onboarding_checklist_items_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_checklist_items" ADD CONSTRAINT "onboarding_checklist_items_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_days" ADD CONSTRAINT "working_days_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_org_code_idx" ON "departments" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "departments_org_status_idx" ON "departments" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "designations_org_code_idx" ON "designations" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "designations_org_status_idx" ON "designations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "employee_documents_idx" ON "employee_documents" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE INDEX "employee_history_idx" ON "employee_history" USING btree ("organization_id","employee_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_org_employee_id_idx" ON "employees" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE INDEX "employees_org_status_idx" ON "employees" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "employees_org_department_idx" ON "employees" USING btree ("organization_id","department_id");--> statement-breakpoint
CREATE INDEX "employees_org_designation_idx" ON "employees" USING btree ("organization_id","designation_id");--> statement-breakpoint
CREATE INDEX "employees_org_manager_idx" ON "employees" USING btree ("organization_id","reporting_manager_id");--> statement-breakpoint
CREATE INDEX "employees_org_team_idx" ON "employees" USING btree ("organization_id","team_id");--> statement-breakpoint
CREATE INDEX "employees_org_location_idx" ON "employees" USING btree ("organization_id","location_id");--> statement-breakpoint
CREATE INDEX "employees_joining_date_idx" ON "employees" USING btree ("organization_id","joining_date");--> statement-breakpoint
CREATE UNIQUE INDEX "employment_types_org_code_idx" ON "employment_types" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "holidays_org_date_name_idx" ON "holidays" USING btree ("organization_id","holiday_date","name");--> statement-breakpoint
CREATE INDEX "holidays_org_date_idx" ON "holidays" USING btree ("organization_id","holiday_date");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_org_code_idx" ON "locations" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "locations_org_status_idx" ON "locations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "onboarding_org_status_idx" ON "onboarding" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "onboarding_items_idx" ON "onboarding_checklist_items" USING btree ("organization_id","onboarding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_org_code_idx" ON "shifts" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_org_code_idx" ON "teams" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "teams_org_department_idx" ON "teams" USING btree ("organization_id","department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "working_days_org_day_idx" ON "working_days" USING btree ("organization_id","day_of_week");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_employee_idx" ON "invitations" USING btree ("employee_id");
--> statement-breakpoint
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "designations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employment_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "working_days" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "holidays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_checklist_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_tenant_isolation" ON "departments" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "designations_tenant_isolation" ON "designations" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "locations_tenant_isolation" ON "locations" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "teams_tenant_isolation" ON "teams" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "employment_types_tenant_isolation" ON "employment_types" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "shifts_tenant_isolation" ON "shifts" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "working_days_tenant_isolation" ON "working_days" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "holidays_tenant_isolation" ON "holidays" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "employees_tenant_isolation" ON "employees" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "employee_history_tenant_isolation" ON "employee_history" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "employee_documents_tenant_isolation" ON "employee_documents" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "onboarding_tenant_isolation" ON "onboarding" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
CREATE POLICY "onboarding_items_tenant_isolation" ON "onboarding_checklist_items" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
