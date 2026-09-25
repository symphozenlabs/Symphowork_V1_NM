CREATE TYPE "public"."ats_application_status" AS ENUM('new', 'screening', 'shortlisted', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."ats_assessment_status" AS ENUM('assigned', 'in_progress', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ats_candidate_status" AS ENUM('active', 'hired', 'rejected', 'withdrawn', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ats_interview_status" AS ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."ats_job_status" AS ENUM('draft', 'scheduled', 'published', 'paused', 'expired', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ats_note_visibility" AS ENUM('private', 'organization');--> statement-breakpoint
CREATE TYPE "public"."ats_requisition_status" AS ENUM('draft', 'pending_approval', 'approved', 'open', 'on_hold', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ats_resume_parsing_status" AS ENUM('uploaded', 'queued', 'processing', 'processed', 'failed', 'not_processed');--> statement-breakpoint
CREATE TABLE "ats_application_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"from_stage_id" uuid,
	"to_stage_id" uuid NOT NULL,
	"moved_by_user_id" uuid,
	"reason" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"requisition_id" uuid NOT NULL,
	"source_id" uuid,
	"recruiter_employee_id" uuid,
	"pipeline_id" uuid NOT NULL,
	"current_stage_id" uuid NOT NULL,
	"status" "ats_application_status" DEFAULT 'new' NOT NULL,
	"cover_note" text,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rejection_reason" varchar(500),
	"hired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_assessment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(60) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"assessment_type_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone,
	"status" "ats_assessment_status" DEFAULT 'assigned' NOT NULL,
	"score" real,
	"result" varchar(80),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"application_id" uuid,
	"activity_type" varchar(80) NOT NULL,
	"metadata" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"application_id" uuid,
	"file_name" varchar(240) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"document_type" varchar(60) DEFAULT 'resume' NOT NULL,
	"uploaded_by_user_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"parsing_status" "ats_resume_parsing_status" DEFAULT 'not_processed' NOT NULL,
	"provider_metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"institution" varchar(180) NOT NULL,
	"degree" varchar(160),
	"specialization" varchar(160),
	"education_level" varchar(80),
	"start_year" integer,
	"end_year" integer,
	"grade" varchar(60),
	"location" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company" varchar(180) NOT NULL,
	"designation" varchar(160) NOT NULL,
	"employment_type" varchar(80),
	"start_date" date NOT NULL,
	"end_date" date,
	"current_role" boolean DEFAULT false NOT NULL,
	"location" varchar(160),
	"description" text,
	"skills_used" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"application_id" uuid,
	"note" text NOT NULL,
	"visibility" "ats_note_visibility" DEFAULT 'private' NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ats_candidate_number_counters_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"skill_name" varchar(120) NOT NULL,
	"normalized_skill_name" varchar(120) NOT NULL,
	"category" varchar(80),
	"proficiency" varchar(40),
	"years_experience" real,
	"source" varchar(40) DEFAULT 'manual' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_tag_links" (
	"candidate_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"color" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_number" varchar(50) NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"last_name" varchar(80) NOT NULL,
	"full_name" varchar(180) NOT NULL,
	"email" varchar(320) NOT NULL,
	"normalized_email" varchar(320) NOT NULL,
	"phone" varchar(40),
	"normalized_phone" varchar(40),
	"location" varchar(160),
	"current_company" varchar(180),
	"current_designation" varchar(160),
	"total_experience" real,
	"relevant_experience" real,
	"highest_education" varchar(160),
	"current_salary" real,
	"expected_salary" real,
	"notice_period_days" integer,
	"preferred_locations" text,
	"work_mode_preference" varchar(40),
	"source_id" uuid,
	"source_detail" varchar(240),
	"availability" varchar(80),
	"status" "ats_candidate_status" DEFAULT 'active' NOT NULL,
	"recruiter_employee_id" uuid,
	"portfolio_url" varchar(500),
	"linkedin_url" varchar(500),
	"website_url" varchar(500),
	"consent_status" varchar(40),
	"consent_at" timestamp with time zone,
	"retention_expiry" date,
	"deletion_status" varchar(40) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"application_id" uuid,
	"communication_type" varchar(40) NOT NULL,
	"direction" varchar(20) NOT NULL,
	"subject" varchar(240),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_interview_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"interview_id" uuid NOT NULL,
	"interviewer_employee_id" uuid NOT NULL,
	"recommendation" varchar(30) NOT NULL,
	"rating" real,
	"strengths" text,
	"concerns" text,
	"technical_assessment" text,
	"communication_assessment" text,
	"overall_comments" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_interviewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"interview_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"interview_type" varchar(80) NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"timezone" varchar(80) NOT NULL,
	"mode" varchar(40) NOT NULL,
	"meeting_link" varchar(500),
	"location" varchar(240),
	"status" "ats_interview_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requisition_id" uuid NOT NULL,
	"job_number" varchar(50) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"public_title" varchar(180) NOT NULL,
	"public_description" text NOT NULL,
	"responsibilities" text,
	"qualifications" text,
	"skills" text,
	"location" varchar(160),
	"work_mode" varchar(40),
	"employment_type" varchar(80),
	"experience" varchar(120),
	"salary_display" varchar(160),
	"application_deadline" date,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"status" "ats_job_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ats_jobs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ats_pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(60) NOT NULL,
	"stage_order" integer NOT NULL,
	"category" varchar(60) DEFAULT 'active' NOT NULL,
	"terminal" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(500),
	"active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_requisition_number_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"next_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requisition_number" varchar(50) NOT NULL,
	"title" varchar(180) NOT NULL,
	"department_id" uuid,
	"designation_id" uuid,
	"hiring_manager_employee_id" uuid,
	"recruiter_employee_id" uuid,
	"employment_type_id" uuid,
	"location_id" uuid,
	"work_mode" varchar(40) DEFAULT 'onsite' NOT NULL,
	"openings" integer DEFAULT 1 NOT NULL,
	"experience_min" real,
	"experience_max" real,
	"salary_min" real,
	"salary_max" real,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"required_skills" text,
	"preferred_skills" text,
	"education_requirements" text,
	"job_description" text NOT NULL,
	"responsibilities" text,
	"qualifications" text,
	"benefits" text,
	"priority" varchar(30) DEFAULT 'normal' NOT NULL,
	"target_joining_date" date,
	"hiring_reason" varchar(80),
	"status" "ats_requisition_status" DEFAULT 'draft' NOT NULL,
	"workflow_instance_id" uuid,
	"created_by_user_id" uuid,
	"approved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"filters" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_talent_pool_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pool_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"added_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_talent_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(500),
	"owner_employee_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ats_application_stage_history" ADD CONSTRAINT "ats_application_stage_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_application_stage_history" ADD CONSTRAINT "ats_application_stage_history_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_application_stage_history" ADD CONSTRAINT "ats_application_stage_history_from_stage_id_ats_pipeline_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."ats_pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_application_stage_history" ADD CONSTRAINT "ats_application_stage_history_to_stage_id_ats_pipeline_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."ats_pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_application_stage_history" ADD CONSTRAINT "ats_application_stage_history_moved_by_user_id_users_id_fk" FOREIGN KEY ("moved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_job_id_ats_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ats_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_requisition_id_ats_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."ats_requisitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_source_id_ats_candidate_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."ats_candidate_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_recruiter_employee_id_employees_id_fk" FOREIGN KEY ("recruiter_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_pipeline_id_ats_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."ats_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_applications" ADD CONSTRAINT "ats_applications_current_stage_id_ats_pipeline_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."ats_pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_assessment_types" ADD CONSTRAINT "ats_assessment_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_assessments" ADD CONSTRAINT "ats_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_assessments" ADD CONSTRAINT "ats_assessments_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_assessments" ADD CONSTRAINT "ats_assessments_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_assessments" ADD CONSTRAINT "ats_assessments_assessment_type_id_ats_assessment_types_id_fk" FOREIGN KEY ("assessment_type_id") REFERENCES "public"."ats_assessment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_assessments" ADD CONSTRAINT "ats_assessments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_activities" ADD CONSTRAINT "ats_candidate_activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_activities" ADD CONSTRAINT "ats_candidate_activities_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_activities" ADD CONSTRAINT "ats_candidate_activities_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_activities" ADD CONSTRAINT "ats_candidate_activities_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD CONSTRAINT "ats_candidate_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD CONSTRAINT "ats_candidate_documents_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD CONSTRAINT "ats_candidate_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_education" ADD CONSTRAINT "ats_candidate_education_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_education" ADD CONSTRAINT "ats_candidate_education_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_experience" ADD CONSTRAINT "ats_candidate_experience_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_experience" ADD CONSTRAINT "ats_candidate_experience_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_notes" ADD CONSTRAINT "ats_candidate_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_notes" ADD CONSTRAINT "ats_candidate_notes_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_notes" ADD CONSTRAINT "ats_candidate_notes_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_notes" ADD CONSTRAINT "ats_candidate_notes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_number_counters" ADD CONSTRAINT "ats_candidate_number_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_skills" ADD CONSTRAINT "ats_candidate_skills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_skills" ADD CONSTRAINT "ats_candidate_skills_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_sources" ADD CONSTRAINT "ats_candidate_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_tag_links" ADD CONSTRAINT "ats_candidate_tag_links_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_tag_links" ADD CONSTRAINT "ats_candidate_tag_links_tag_id_ats_candidate_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."ats_candidate_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_tag_links" ADD CONSTRAINT "ats_candidate_tag_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_tags" ADD CONSTRAINT "ats_candidate_tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidates" ADD CONSTRAINT "ats_candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidates" ADD CONSTRAINT "ats_candidates_source_id_ats_candidate_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."ats_candidate_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidates" ADD CONSTRAINT "ats_candidates_recruiter_employee_id_employees_id_fk" FOREIGN KEY ("recruiter_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_communications" ADD CONSTRAINT "ats_communications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_communications" ADD CONSTRAINT "ats_communications_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_communications" ADD CONSTRAINT "ats_communications_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_communications" ADD CONSTRAINT "ats_communications_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interview_feedback" ADD CONSTRAINT "ats_interview_feedback_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interview_feedback" ADD CONSTRAINT "ats_interview_feedback_interview_id_ats_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."ats_interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interview_feedback" ADD CONSTRAINT "ats_interview_feedback_interviewer_employee_id_employees_id_fk" FOREIGN KEY ("interviewer_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interviewers" ADD CONSTRAINT "ats_interviewers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interviewers" ADD CONSTRAINT "ats_interviewers_interview_id_ats_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."ats_interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interviewers" ADD CONSTRAINT "ats_interviewers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interviews" ADD CONSTRAINT "ats_interviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interviews" ADD CONSTRAINT "ats_interviews_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_interviews" ADD CONSTRAINT "ats_interviews_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_jobs" ADD CONSTRAINT "ats_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_jobs" ADD CONSTRAINT "ats_jobs_requisition_id_ats_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."ats_requisitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_pipeline_stages" ADD CONSTRAINT "ats_pipeline_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_pipeline_stages" ADD CONSTRAINT "ats_pipeline_stages_pipeline_id_ats_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."ats_pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_pipelines" ADD CONSTRAINT "ats_pipelines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisition_number_counters" ADD CONSTRAINT "ats_requisition_number_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_hiring_manager_employee_id_employees_id_fk" FOREIGN KEY ("hiring_manager_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_recruiter_employee_id_employees_id_fk" FOREIGN KEY ("recruiter_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_employment_type_id_employment_types_id_fk" FOREIGN KEY ("employment_type_id") REFERENCES "public"."employment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ADD CONSTRAINT "ats_requisitions_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_saved_searches" ADD CONSTRAINT "ats_saved_searches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_saved_searches" ADD CONSTRAINT "ats_saved_searches_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_talent_pool_members" ADD CONSTRAINT "ats_talent_pool_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_talent_pool_members" ADD CONSTRAINT "ats_talent_pool_members_pool_id_ats_talent_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."ats_talent_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_talent_pool_members" ADD CONSTRAINT "ats_talent_pool_members_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_talent_pool_members" ADD CONSTRAINT "ats_talent_pool_members_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_talent_pools" ADD CONSTRAINT "ats_talent_pools_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_talent_pools" ADD CONSTRAINT "ats_talent_pools_owner_employee_id_employees_id_fk" FOREIGN KEY ("owner_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ats_stage_history_idx" ON "ats_application_stage_history" USING btree ("organization_id","application_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_application_candidate_job_idx" ON "ats_applications" USING btree ("candidate_id","job_id");--> statement-breakpoint
CREATE INDEX "ats_application_org_stage_idx" ON "ats_applications" USING btree ("organization_id","current_stage_id");--> statement-breakpoint
CREATE INDEX "ats_application_org_status_idx" ON "ats_applications" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_assessment_type_idx" ON "ats_assessment_types" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "ats_assessments_org_status_idx" ON "ats_assessments" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "ats_candidate_activities_idx" ON "ats_candidate_activities" USING btree ("organization_id","candidate_id","created_at");--> statement-breakpoint
CREATE INDEX "ats_candidate_documents_idx" ON "ats_candidate_documents" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE INDEX "ats_candidate_education_idx" ON "ats_candidate_education" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE INDEX "ats_candidate_experience_idx" ON "ats_candidate_experience" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE INDEX "ats_candidate_notes_idx" ON "ats_candidate_notes" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_candidate_skill_idx" ON "ats_candidate_skills" USING btree ("candidate_id","normalized_skill_name");--> statement-breakpoint
CREATE INDEX "ats_candidate_skill_search_idx" ON "ats_candidate_skills" USING btree ("organization_id","normalized_skill_name");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_source_org_name_idx" ON "ats_candidate_sources" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_candidate_tag_link_idx" ON "ats_candidate_tag_links" USING btree ("candidate_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_tag_org_name_idx" ON "ats_candidate_tags" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_candidates_org_number_idx" ON "ats_candidates" USING btree ("organization_id","candidate_number");--> statement-breakpoint
CREATE INDEX "ats_candidates_org_email_idx" ON "ats_candidates" USING btree ("organization_id","normalized_email");--> statement-breakpoint
CREATE INDEX "ats_candidates_org_phone_idx" ON "ats_candidates" USING btree ("organization_id","normalized_phone");--> statement-breakpoint
CREATE INDEX "ats_candidates_org_status_idx" ON "ats_candidates" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "ats_communications_idx" ON "ats_communications" USING btree ("organization_id","candidate_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_interview_feedback_idx" ON "ats_interview_feedback" USING btree ("interview_id","interviewer_employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_interviewer_idx" ON "ats_interviewers" USING btree ("interview_id","employee_id");--> statement-breakpoint
CREATE INDEX "ats_interviews_org_date_idx" ON "ats_interviews" USING btree ("organization_id","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_jobs_org_number_idx" ON "ats_jobs" USING btree ("organization_id","job_number");--> statement-breakpoint
CREATE INDEX "ats_jobs_org_status_idx" ON "ats_jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_pipeline_stage_code_idx" ON "ats_pipeline_stages" USING btree ("pipeline_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_pipeline_org_name_idx" ON "ats_pipelines" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_requisition_counter_org_year_idx" ON "ats_requisition_number_counters" USING btree ("organization_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_requisitions_org_number_idx" ON "ats_requisitions" USING btree ("organization_id","requisition_number");--> statement-breakpoint
CREATE INDEX "ats_requisitions_org_status_idx" ON "ats_requisitions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "ats_requisitions_org_recruiter_idx" ON "ats_requisitions" USING btree ("organization_id","recruiter_employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_saved_search_org_name_idx" ON "ats_saved_searches" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_pool_member_idx" ON "ats_talent_pool_members" USING btree ("pool_id","candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_talent_pool_idx" ON "ats_talent_pools" USING btree ("organization_id","name");--> statement-breakpoint
ALTER TABLE "ats_requisition_number_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_number_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_requisitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_experience" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_education" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_pipelines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_pipeline_stages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_application_stage_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_tag_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_interviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_interviewers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_interview_feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_assessment_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_assessments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_talent_pools" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_talent_pool_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_communications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_saved_searches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ats_requisition_number_counters_tenant_isolation" ON "ats_requisition_number_counters" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_number_counters_tenant_isolation" ON "ats_candidate_number_counters" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_sources_tenant_isolation" ON "ats_candidate_sources" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_requisitions_tenant_isolation" ON "ats_requisitions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_jobs_tenant_isolation" ON "ats_jobs" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidates_tenant_isolation" ON "ats_candidates" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_experience_tenant_isolation" ON "ats_candidate_experience" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_education_tenant_isolation" ON "ats_candidate_education" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_skills_tenant_isolation" ON "ats_candidate_skills" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_documents_tenant_isolation" ON "ats_candidate_documents" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_pipelines_tenant_isolation" ON "ats_pipelines" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_pipeline_stages_tenant_isolation" ON "ats_pipeline_stages" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_applications_tenant_isolation" ON "ats_applications" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_application_stage_history_tenant_isolation" ON "ats_application_stage_history" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_tags_tenant_isolation" ON "ats_candidate_tags" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_tag_links_tenant_isolation" ON "ats_candidate_tag_links" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_notes_tenant_isolation" ON "ats_candidate_notes" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_activities_tenant_isolation" ON "ats_candidate_activities" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_interviews_tenant_isolation" ON "ats_interviews" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_interviewers_tenant_isolation" ON "ats_interviewers" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_interview_feedback_tenant_isolation" ON "ats_interview_feedback" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_assessment_types_tenant_isolation" ON "ats_assessment_types" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_assessments_tenant_isolation" ON "ats_assessments" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_talent_pools_tenant_isolation" ON "ats_talent_pools" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_talent_pool_members_tenant_isolation" ON "ats_talent_pool_members" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_communications_tenant_isolation" ON "ats_communications" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_saved_searches_tenant_isolation" ON "ats_saved_searches" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
