CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."billing_subscription_status" AS ENUM('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "billing_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"metric" varchar(100) NOT NULL,
	"usage_value" integer DEFAULT 0 NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_message_task_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"created_by_employee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collaboration_message_task_links_message_id_unique" UNIQUE("message_id"),
	CONSTRAINT "collaboration_message_task_links_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_status" "billing_subscription_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "renewal_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "provider_customer_id" varchar(180);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "provider_subscription_id" varchar(180);--> statement-breakpoint
ALTER TABLE "billing_usage" ADD CONSTRAINT "billing_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_task_links" ADD CONSTRAINT "collaboration_message_task_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_task_links" ADD CONSTRAINT "collaboration_message_task_links_message_id_collaboration_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."collaboration_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_task_links" ADD CONSTRAINT "collaboration_message_task_links_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_task_links" ADD CONSTRAINT "collaboration_message_task_links_created_by_employee_id_employees_id_fk" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_usage_org_metric_period_idx" ON "billing_usage" USING btree ("organization_id","metric","period_start","period_end");--> statement-breakpoint
CREATE INDEX "billing_usage_org_idx" ON "billing_usage" USING btree ("organization_id","metric");--> statement-breakpoint
CREATE INDEX "collab_message_task_link_org_idx" ON "collaboration_message_task_links" USING btree ("organization_id","message_id","task_id");
--> statement-breakpoint
ALTER TABLE "billing_usage" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "billing_usage_tenant_isolation" ON "billing_usage" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
ALTER TABLE "collaboration_message_task_links" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "collaboration_message_task_links_tenant_isolation" ON "collaboration_message_task_links" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
