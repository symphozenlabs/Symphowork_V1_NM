CREATE TYPE "public"."collaboration_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."conversation_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('direct', 'group');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'file', 'system', 'task_reference');--> statement-breakpoint
CREATE TYPE "public"."presence_status" AS ENUM('online', 'away', 'busy', 'offline');--> statement-breakpoint
CREATE TYPE "public"."project_member_role" AS ENUM('owner', 'manager', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'blocked', 'in_review', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('task', 'bug', 'feature', 'improvement', 'request', 'maintenance', 'other');--> statement-breakpoint
CREATE TABLE "collaboration_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"actor_employee_id" uuid,
	"activity_type" varchar(80) NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid,
	"comment_id" uuid,
	"message_id" uuid,
	"uploaded_by_employee_id" uuid NOT NULL,
	"file_name" varchar(240) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_conversation_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" "conversation_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"muted_at" timestamp with time zone,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" "conversation_type" NOT NULL,
	"name" varchar(180),
	"description" varchar(500),
	"visual_metadata" text,
	"created_by_employee_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"task_id" uuid,
	"comment_id" uuid,
	"message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"emoji" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_employee_id" uuid NOT NULL,
	"content" text,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"reply_to_message_id" uuid,
	"client_idempotency_key" varchar(180),
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_presence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "presence_status" DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" "project_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_number" varchar(40) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text,
	"owner_employee_id" uuid NOT NULL,
	"manager_employee_id" uuid,
	"team_id" uuid,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"priority" "collaboration_priority" DEFAULT 'medium' NOT NULL,
	"start_date" date,
	"target_end_date" date,
	"actual_end_date" date,
	"visibility" varchar(30) DEFAULT 'organization' NOT NULL,
	"visual_metadata" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"author_employee_id" uuid NOT NULL,
	"content" text NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"predecessor_task_id" uuid NOT NULL,
	"successor_task_id" uuid NOT NULL,
	"dependency_type" varchar(30) DEFAULT 'blocks' NOT NULL,
	"created_by_employee_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_task_label_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_task_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"color" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_task_watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"task_number" varchar(40) NOT NULL,
	"project_id" uuid,
	"parent_task_id" uuid,
	"title" varchar(240) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "collaboration_priority" DEFAULT 'medium' NOT NULL,
	"type" "task_type" DEFAULT 'task' NOT NULL,
	"created_by_employee_id" uuid NOT NULL,
	"reporter_employee_id" uuid,
	"assignee_employee_id" uuid,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"estimated_effort" real,
	"actual_effort" real,
	"effort_unit" varchar(20) DEFAULT 'hours' NOT NULL,
	"source_type" varchar(30) DEFAULT 'manual' NOT NULL,
	"source_conversation_id" uuid,
	"source_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collaboration_activity" ADD CONSTRAINT "collaboration_activity_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_activity" ADD CONSTRAINT "collaboration_activity_project_id_collaboration_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."collaboration_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_activity" ADD CONSTRAINT "collaboration_activity_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_activity" ADD CONSTRAINT "collaboration_activity_actor_employee_id_employees_id_fk" FOREIGN KEY ("actor_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_attachments" ADD CONSTRAINT "collaboration_attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_attachments" ADD CONSTRAINT "collaboration_attachments_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_attachments" ADD CONSTRAINT "collaboration_attachments_comment_id_collaboration_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."collaboration_task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_attachments" ADD CONSTRAINT "collaboration_attachments_message_id_collaboration_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."collaboration_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_attachments" ADD CONSTRAINT "collaboration_attachments_uploaded_by_employee_id_employees_id_fk" FOREIGN KEY ("uploaded_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_conversation_members" ADD CONSTRAINT "collaboration_conversation_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_conversation_members" ADD CONSTRAINT "collaboration_conversation_members_conversation_id_collaboration_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."collaboration_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_conversation_members" ADD CONSTRAINT "collaboration_conversation_members_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_conversations" ADD CONSTRAINT "collaboration_conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_conversations" ADD CONSTRAINT "collaboration_conversations_created_by_employee_id_employees_id_fk" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_mentions" ADD CONSTRAINT "collaboration_mentions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_mentions" ADD CONSTRAINT "collaboration_mentions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_mentions" ADD CONSTRAINT "collaboration_mentions_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_mentions" ADD CONSTRAINT "collaboration_mentions_comment_id_collaboration_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."collaboration_task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_mentions" ADD CONSTRAINT "collaboration_mentions_message_id_collaboration_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."collaboration_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_reactions" ADD CONSTRAINT "collaboration_message_reactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_reactions" ADD CONSTRAINT "collaboration_message_reactions_message_id_collaboration_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."collaboration_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_message_reactions" ADD CONSTRAINT "collaboration_message_reactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_conversation_id_collaboration_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."collaboration_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_sender_employee_id_employees_id_fk" FOREIGN KEY ("sender_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_presence" ADD CONSTRAINT "collaboration_presence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_presence" ADD CONSTRAINT "collaboration_presence_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_project_members" ADD CONSTRAINT "collaboration_project_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_project_members" ADD CONSTRAINT "collaboration_project_members_project_id_collaboration_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."collaboration_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_project_members" ADD CONSTRAINT "collaboration_project_members_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_projects" ADD CONSTRAINT "collaboration_projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_projects" ADD CONSTRAINT "collaboration_projects_owner_employee_id_employees_id_fk" FOREIGN KEY ("owner_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_projects" ADD CONSTRAINT "collaboration_projects_manager_employee_id_employees_id_fk" FOREIGN KEY ("manager_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_projects" ADD CONSTRAINT "collaboration_projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_projects" ADD CONSTRAINT "collaboration_projects_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_comments" ADD CONSTRAINT "collaboration_task_comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_comments" ADD CONSTRAINT "collaboration_task_comments_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_comments" ADD CONSTRAINT "collaboration_task_comments_author_employee_id_employees_id_fk" FOREIGN KEY ("author_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_dependencies" ADD CONSTRAINT "collaboration_task_dependencies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_dependencies" ADD CONSTRAINT "collaboration_task_dependencies_predecessor_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("predecessor_task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_dependencies" ADD CONSTRAINT "collaboration_task_dependencies_successor_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("successor_task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_dependencies" ADD CONSTRAINT "collaboration_task_dependencies_created_by_employee_id_employees_id_fk" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_label_links" ADD CONSTRAINT "collaboration_task_label_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_label_links" ADD CONSTRAINT "collaboration_task_label_links_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_label_links" ADD CONSTRAINT "collaboration_task_label_links_label_id_collaboration_task_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."collaboration_task_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_labels" ADD CONSTRAINT "collaboration_task_labels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_watchers" ADD CONSTRAINT "collaboration_task_watchers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_watchers" ADD CONSTRAINT "collaboration_task_watchers_task_id_collaboration_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."collaboration_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_task_watchers" ADD CONSTRAINT "collaboration_task_watchers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_project_id_collaboration_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."collaboration_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_created_by_employee_id_employees_id_fk" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_reporter_employee_id_employees_id_fk" FOREIGN KEY ("reporter_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_assignee_employee_id_employees_id_fk" FOREIGN KEY ("assignee_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_number_counters" ADD CONSTRAINT "project_number_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_number_counters" ADD CONSTRAINT "task_number_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collab_activity_project_idx" ON "collaboration_activity" USING btree ("organization_id","project_id","created_at");--> statement-breakpoint
CREATE INDEX "collab_activity_task_idx" ON "collaboration_activity" USING btree ("organization_id","task_id","created_at");--> statement-breakpoint
CREATE INDEX "collab_attachments_org_task_idx" ON "collaboration_attachments" USING btree ("organization_id","task_id");--> statement-breakpoint
CREATE INDEX "collab_attachments_org_message_idx" ON "collaboration_attachments" USING btree ("organization_id","message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_conversation_member_idx" ON "collaboration_conversation_members" USING btree ("conversation_id","employee_id");--> statement-breakpoint
CREATE INDEX "collab_conversation_members_employee_idx" ON "collaboration_conversation_members" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE INDEX "collab_conversations_org_updated_idx" ON "collaboration_conversations" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE INDEX "collab_mentions_employee_idx" ON "collaboration_mentions" USING btree ("organization_id","employee_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_message_reaction_idx" ON "collaboration_message_reactions" USING btree ("message_id","employee_id","emoji");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_message_idempotency_idx" ON "collaboration_messages" USING btree ("organization_id","sender_employee_id","client_idempotency_key");--> statement-breakpoint
CREATE INDEX "collab_messages_conversation_idx" ON "collaboration_messages" USING btree ("organization_id","conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_presence_org_employee_idx" ON "collaboration_presence" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_project_member_idx" ON "collaboration_project_members" USING btree ("project_id","employee_id");--> statement-breakpoint
CREATE INDEX "collab_project_members_org_employee_idx" ON "collaboration_project_members" USING btree ("organization_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_projects_org_number_idx" ON "collaboration_projects" USING btree ("organization_id","project_number");--> statement-breakpoint
CREATE INDEX "collab_projects_org_status_idx" ON "collaboration_projects" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "collab_projects_org_team_idx" ON "collaboration_projects" USING btree ("organization_id","team_id");--> statement-breakpoint
CREATE INDEX "collab_task_comments_idx" ON "collaboration_task_comments" USING btree ("organization_id","task_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_task_dependency_idx" ON "collaboration_task_dependencies" USING btree ("predecessor_task_id","successor_task_id");--> statement-breakpoint
CREATE INDEX "collab_task_dependency_successor_idx" ON "collaboration_task_dependencies" USING btree ("organization_id","successor_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_task_label_link_idx" ON "collaboration_task_label_links" USING btree ("task_id","label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_task_label_org_name_idx" ON "collaboration_task_labels" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_task_watcher_idx" ON "collaboration_task_watchers" USING btree ("task_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collab_tasks_org_number_idx" ON "collaboration_tasks" USING btree ("organization_id","task_number");--> statement-breakpoint
CREATE INDEX "collab_tasks_org_project_status_idx" ON "collaboration_tasks" USING btree ("organization_id","project_id","status");--> statement-breakpoint
CREATE INDEX "collab_tasks_org_assignee_status_idx" ON "collaboration_tasks" USING btree ("organization_id","assignee_employee_id","status");--> statement-breakpoint
CREATE INDEX "collab_tasks_org_due_idx" ON "collaboration_tasks" USING btree ("organization_id","due_date");--> statement-breakpoint
CREATE INDEX "collab_tasks_parent_idx" ON "collaboration_tasks" USING btree ("organization_id","parent_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_counter_org_idx" ON "project_number_counters" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_counter_org_idx" ON "task_number_counters" USING btree ("organization_id");
--> statement-breakpoint
ALTER TABLE "project_number_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_number_counters_tenant_isolation" ON "project_number_counters" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "task_number_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "task_number_counters_tenant_isolation" ON "task_number_counters" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_projects_tenant_isolation" ON "collaboration_projects" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_project_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_project_members_tenant_isolation" ON "collaboration_project_members" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_tasks_tenant_isolation" ON "collaboration_tasks" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_task_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_task_labels_tenant_isolation" ON "collaboration_task_labels" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_task_label_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_task_label_links_tenant_isolation" ON "collaboration_task_label_links" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_task_watchers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_task_watchers_tenant_isolation" ON "collaboration_task_watchers" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_task_dependencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_task_dependencies_tenant_isolation" ON "collaboration_task_dependencies" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_task_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_task_comments_tenant_isolation" ON "collaboration_task_comments" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_activity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_activity_tenant_isolation" ON "collaboration_activity" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_conversations_tenant_isolation" ON "collaboration_conversations" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_conversation_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_conversation_members_tenant_isolation" ON "collaboration_conversation_members" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_messages_tenant_isolation" ON "collaboration_messages" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_message_reactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_message_reactions_tenant_isolation" ON "collaboration_message_reactions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_mentions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_mentions_tenant_isolation" ON "collaboration_mentions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_attachments_tenant_isolation" ON "collaboration_attachments" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpointALTER TABLE "collaboration_presence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "collaboration_presence_tenant_isolation" ON "collaboration_presence" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint 
