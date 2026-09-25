CREATE TYPE "public"."payroll_adjustment_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payroll_adjustment_type" AS ENUM('arrears', 'bonus', 'incentive', 'reimbursement', 'recovery', 'advance_recovery', 'manual_earning', 'manual_deduction');--> statement-breakpoint
CREATE TYPE "public"."payroll_eligibility_status" AS ENUM('eligible', 'ineligible', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."payroll_line_type" AS ENUM('earning', 'deduction', 'employer_contribution');--> statement-breakpoint
CREATE TYPE "public"."payroll_period_status" AS ENUM('draft', 'open', 'processing', 'under_review', 'approved', 'finalized', 'locked');--> statement-breakpoint
CREATE TYPE "public"."payroll_proration_basis" AS ENUM('calendar_days', 'working_days');--> statement-breakpoint
CREATE TYPE "public"."payroll_run_status" AS ENUM('draft', 'processing', 'under_review', 'approved', 'rejected', 'finalized', 'locked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payroll_tax_regime" AS ENUM('old', 'new');--> statement-breakpoint
CREATE TYPE "public"."salary_calculation_method" AS ENUM('fixed', 'percentage', 'formula');--> statement-breakpoint
CREATE TYPE "public"."salary_component_type" AS ENUM('earning', 'deduction', 'employer_contribution');--> statement-breakpoint
CREATE TYPE "public"."salary_structure_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "employee_payroll_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "payroll_eligibility_status" DEFAULT 'eligible' NOT NULL,
	"effective_date" date NOT NULL,
	"pan_encrypted" text,
	"bank_metadata_encrypted" text,
	"uan" varchar(40),
	"pf_applicable" boolean DEFAULT false NOT NULL,
	"esi_applicable" boolean DEFAULT false NOT NULL,
	"esi_number" varchar(40),
	"professional_tax_applicable" boolean DEFAULT false NOT NULL,
	"tds_applicable" boolean DEFAULT true NOT NULL,
	"tax_regime" "payroll_tax_regime" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_payroll_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_salary_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"structure_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"revision_reason" varchar(500),
	"notes" varchar(1000),
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" "payroll_adjustment_type" NOT NULL,
	"amount" real NOT NULL,
	"reason" varchar(500) NOT NULL,
	"notes" varchar(1000),
	"status" "payroll_adjustment_status" DEFAULT 'pending' NOT NULL,
	"created_by_user_id" uuid,
	"approved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_calculation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"run_employee_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"calculation_version" varchar(30) NOT NULL,
	"input_snapshot" text NOT NULL,
	"result_snapshot" text NOT NULL,
	"payable_days" real NOT NULL,
	"lop_days" real DEFAULT 0 NOT NULL,
	"gross_earnings" real NOT NULL,
	"total_deductions" real NOT NULL,
	"net_salary" real NOT NULL,
	"employer_contributions" real DEFAULT 0 NOT NULL,
	"frozen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_calculation_snapshots_run_employee_id_unique" UNIQUE("run_employee_id")
);
--> statement-breakpoint
CREATE TABLE "payroll_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"component_id" uuid,
	"code" varchar(60) NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "payroll_line_type" NOT NULL,
	"amount" real NOT NULL,
	"taxable" boolean DEFAULT true NOT NULL,
	"statutory_configuration_snapshot" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"run_employee_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"payslip_number" varchar(60) NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_payslips_run_employee_id_unique" UNIQUE("run_employee_id")
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" "payroll_period_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_run_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" varchar(40) DEFAULT 'calculated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"run_number" varchar(50) NOT NULL,
	"workflow_instance_id" uuid,
	"status" "payroll_run_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid,
	"calculated_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"employee_count" integer DEFAULT 0 NOT NULL,
	"gross_total" real DEFAULT 0 NOT NULL,
	"deduction_total" real DEFAULT 0 NOT NULL,
	"net_total" real DEFAULT 0 NOT NULL,
	"employer_contribution_total" real DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_statutory_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(120) NOT NULL,
	"state_code" varchar(20),
	"effective_from" date NOT NULL,
	"effective_to" date,
	"configuration" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_tax_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"regime" "payroll_tax_regime" NOT NULL,
	"financial_year" varchar(20) NOT NULL,
	"configuration" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "salary_component_type" NOT NULL,
	"calculation_method" "salary_calculation_method" NOT NULL,
	"taxable" boolean DEFAULT true NOT NULL,
	"statutory" boolean DEFAULT false NOT NULL,
	"proratable" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structure_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"structure_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"fixed_amount" real,
	"percentage" real,
	"formula_reference" varchar(120),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" varchar(500),
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" "salary_structure_status" DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"frequency" varchar(30) DEFAULT 'monthly' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_payroll_profiles" ADD CONSTRAINT "employee_payroll_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_profiles" ADD CONSTRAINT "employee_payroll_profiles_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_structure_id_salary_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_period_id_payroll_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculation_snapshots" ADD CONSTRAINT "payroll_calculation_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculation_snapshots" ADD CONSTRAINT "payroll_calculation_snapshots_run_employee_id_payroll_run_employees_id_fk" FOREIGN KEY ("run_employee_id") REFERENCES "public"."payroll_run_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculation_snapshots" ADD CONSTRAINT "payroll_calculation_snapshots_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_line_items" ADD CONSTRAINT "payroll_line_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_line_items" ADD CONSTRAINT "payroll_line_items_snapshot_id_payroll_calculation_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."payroll_calculation_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_line_items" ADD CONSTRAINT "payroll_line_items_component_id_salary_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."salary_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_run_employee_id_payroll_run_employees_id_fk" FOREIGN KEY ("run_employee_id") REFERENCES "public"."payroll_run_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_snapshot_id_payroll_calculation_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."payroll_calculation_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_run_id_payroll_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_period_id_payroll_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_statutory_configurations" ADD CONSTRAINT "payroll_statutory_configurations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_tax_configurations" ADD CONSTRAINT "payroll_tax_configurations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_structure_id_salary_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_component_id_salary_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."salary_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_payroll_profiles_org_status_idx" ON "employee_payroll_profiles" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "salary_assignments_org_employee_effective_idx" ON "employee_salary_assignments" USING btree ("organization_id","employee_id","effective_from");--> statement-breakpoint
CREATE INDEX "payroll_adjustments_org_period_employee_idx" ON "payroll_adjustments" USING btree ("organization_id","period_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_snapshot_org_employee_idx" ON "payroll_calculation_snapshots" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_line_items_snapshot_idx" ON "payroll_line_items" USING btree ("organization_id","snapshot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_payslip_org_number_idx" ON "payroll_payslips" USING btree ("organization_id","payslip_number");--> statement-breakpoint
CREATE INDEX "payroll_payslip_employee_idx" ON "payroll_payslips" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_period_org_month_year_idx" ON "payroll_periods" USING btree ("organization_id","month","year");--> statement-breakpoint
CREATE INDEX "payroll_period_org_status_idx" ON "payroll_periods" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_run_employee_idx" ON "payroll_run_employees" USING btree ("run_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_run_employee_org_idx" ON "payroll_run_employees" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_org_period_number_idx" ON "payroll_runs" USING btree ("organization_id","period_id","run_number");--> statement-breakpoint
CREATE INDEX "payroll_runs_org_status_idx" ON "payroll_runs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "payroll_statutory_org_code_effective_idx" ON "payroll_statutory_configurations" USING btree ("organization_id","code","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_tax_org_regime_year_idx" ON "payroll_tax_configurations" USING btree ("organization_id","regime","financial_year");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_components_org_code_idx" ON "salary_components" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_structure_component_idx" ON "salary_structure_components" USING btree ("structure_id","component_id");--> statement-breakpoint
CREATE INDEX "salary_structures_org_effective_idx" ON "salary_structures" USING btree ("organization_id","effective_from");--> statement-breakpoint
ALTER TABLE "employee_payroll_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "salary_structures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "salary_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "salary_structure_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "employee_salary_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_calculation_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_statutory_configurations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_tax_configurations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payroll_payslips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "employee_payroll_profiles_tenant_isolation" ON "employee_payroll_profiles" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "salary_structures_tenant_isolation" ON "salary_structures" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "salary_components_tenant_isolation" ON "salary_components" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "salary_structure_components_tenant_isolation" ON "salary_structure_components" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "employee_salary_assignments_tenant_isolation" ON "employee_salary_assignments" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_periods_tenant_isolation" ON "payroll_periods" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_runs_tenant_isolation" ON "payroll_runs" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_run_employees_tenant_isolation" ON "payroll_run_employees" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_calculation_snapshots_tenant_isolation" ON "payroll_calculation_snapshots" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_line_items_tenant_isolation" ON "payroll_line_items" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_adjustments_tenant_isolation" ON "payroll_adjustments" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_statutory_configurations_tenant_isolation" ON "payroll_statutory_configurations" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_tax_configurations_tenant_isolation" ON "payroll_tax_configurations" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "payroll_payslips_tenant_isolation" ON "payroll_payslips" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
