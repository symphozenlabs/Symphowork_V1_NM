CREATE TYPE "public"."ats_extraction_review_status" AS ENUM('unreviewed', 'reviewed', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."ats_resume_processing_status" AS ENUM('uploaded', 'queued', 'text_extracting', 'parsing', 'normalizing', 'skill_extracting', 'experience_analyzing', 'enriching', 'completed', 'text_extraction_failed', 'parsing_failed', 'skill_extraction_failed', 'experience_analysis_failed', 'processing_failed');--> statement-breakpoint
CREATE TABLE "ats_candidate_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"issuer" varchar(160),
	"issue_date" date,
	"expiry_date" date,
	"credential_id" varchar(120),
	"credential_url" varchar(500),
	"evidence" text,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_field_provenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"field_path" varchar(160) NOT NULL,
	"source" varchar(30) NOT NULL,
	"confidence" real,
	"confirmed_by_user_id" uuid,
	"confirmed_at" timestamp with time zone,
	"extraction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"language" varchar(80) NOT NULL,
	"proficiency" varchar(40),
	"evidence" text,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"url" varchar(500) NOT NULL,
	"extraction_id" uuid,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_candidate_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text,
	"technologies" text,
	"role" varchar(160),
	"duration" varchar(80),
	"evidence" text,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_resume_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"extraction_id" uuid NOT NULL,
	"field_path" varchar(160) NOT NULL,
	"existing_value" text NOT NULL,
	"extracted_value" text NOT NULL,
	"resolution" varchar(30) DEFAULT 'pending' NOT NULL,
	"resolved_by_user_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_resume_extraction_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"extraction_id" uuid NOT NULL,
	"field_path" varchar(160) NOT NULL,
	"value" text NOT NULL,
	"confidence" real,
	"confidence_source" varchar(30) NOT NULL,
	"page_number" integer,
	"text_start" integer,
	"text_end" integer,
	"evidence" text,
	"review_status" "ats_extraction_review_status" DEFAULT 'unreviewed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_resume_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"extracted_text" text,
	"normalized_resume" text NOT NULL,
	"extraction_schema_version" varchar(30) NOT NULL,
	"processing_version" varchar(30) NOT NULL,
	"provider" varchar(80) NOT NULL,
	"provider_version" varchar(80),
	"review_status" "ats_extraction_review_status" DEFAULT 'unreviewed' NOT NULL,
	"warnings" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_resume_processing_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"stage" varchar(60) NOT NULL,
	"status" varchar(30) NOT NULL,
	"provider" varchar(80),
	"provider_version" varchar(80),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"error_message" varchar(1000),
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "ats_resume_processing_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ai_resume_processing_enabled" boolean DEFAULT false NOT NULL,
	"provider" varchar(80) DEFAULT 'deterministic' NOT NULL,
	"processing_strategy" varchar(40) DEFAULT 'deterministic_first' NOT NULL,
	"max_file_size" integer DEFAULT 10485760 NOT NULL,
	"allowed_file_types" text DEFAULT 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' NOT NULL,
	"retry_limit" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ats_resume_processing_configs_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "ats_resume_processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"status" "ats_resume_processing_status" DEFAULT 'queued' NOT NULL,
	"requested_operation" varchar(40) DEFAULT 'process' NOT NULL,
	"provider" varchar(80) DEFAULT 'deterministic' NOT NULL,
	"provider_version" varchar(80),
	"processing_version" varchar(30) NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"idempotency_key" varchar(180) NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failure_reason" varchar(1000),
	"retry_after" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_skill_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"skill_id" uuid NOT NULL,
	"alias" varchar(120) NOT NULL,
	"normalized_alias" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_skill_taxonomy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"canonical_name" varchar(120) NOT NULL,
	"normalized_name" varchar(120) NOT NULL,
	"category" varchar(80),
	"parent_skill_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD COLUMN "content_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD COLUMN "source" varchar(40) DEFAULT 'recruiter' NOT NULL;--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD COLUMN "processing_version" varchar(30);--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ADD COLUMN "scan_status" varchar(30) DEFAULT 'not_scanned' NOT NULL;--> statement-breakpoint
ALTER TABLE "ats_candidate_certifications" ADD CONSTRAINT "ats_candidate_certifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_certifications" ADD CONSTRAINT "ats_candidate_certifications_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_field_provenance" ADD CONSTRAINT "ats_candidate_field_provenance_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_field_provenance" ADD CONSTRAINT "ats_candidate_field_provenance_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_field_provenance" ADD CONSTRAINT "ats_candidate_field_provenance_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_field_provenance" ADD CONSTRAINT "ats_candidate_field_provenance_extraction_id_ats_resume_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."ats_resume_extractions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_languages" ADD CONSTRAINT "ats_candidate_languages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_languages" ADD CONSTRAINT "ats_candidate_languages_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_links" ADD CONSTRAINT "ats_candidate_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_links" ADD CONSTRAINT "ats_candidate_links_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_links" ADD CONSTRAINT "ats_candidate_links_extraction_id_ats_resume_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."ats_resume_extractions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_projects" ADD CONSTRAINT "ats_candidate_projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_candidate_projects" ADD CONSTRAINT "ats_candidate_projects_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_conflicts" ADD CONSTRAINT "ats_resume_conflicts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_conflicts" ADD CONSTRAINT "ats_resume_conflicts_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_conflicts" ADD CONSTRAINT "ats_resume_conflicts_extraction_id_ats_resume_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."ats_resume_extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_conflicts" ADD CONSTRAINT "ats_resume_conflicts_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_extraction_fields" ADD CONSTRAINT "ats_resume_extraction_fields_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_extraction_fields" ADD CONSTRAINT "ats_resume_extraction_fields_extraction_id_ats_resume_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."ats_resume_extractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_extractions" ADD CONSTRAINT "ats_resume_extractions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_extractions" ADD CONSTRAINT "ats_resume_extractions_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_extractions" ADD CONSTRAINT "ats_resume_extractions_document_id_ats_candidate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."ats_candidate_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_extractions" ADD CONSTRAINT "ats_resume_extractions_job_id_ats_resume_processing_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ats_resume_processing_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_attempts" ADD CONSTRAINT "ats_resume_processing_attempts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_attempts" ADD CONSTRAINT "ats_resume_processing_attempts_job_id_ats_resume_processing_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ats_resume_processing_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_configs" ADD CONSTRAINT "ats_resume_processing_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_jobs" ADD CONSTRAINT "ats_resume_processing_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_jobs" ADD CONSTRAINT "ats_resume_processing_jobs_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_jobs" ADD CONSTRAINT "ats_resume_processing_jobs_document_id_ats_candidate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."ats_candidate_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_skill_aliases" ADD CONSTRAINT "ats_skill_aliases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_skill_aliases" ADD CONSTRAINT "ats_skill_aliases_skill_id_ats_skill_taxonomy_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."ats_skill_taxonomy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_skill_taxonomy" ADD CONSTRAINT "ats_skill_taxonomy_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ats_candidate_certifications_idx" ON "ats_candidate_certifications" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_candidate_provenance_idx" ON "ats_candidate_field_provenance" USING btree ("candidate_id","field_path");--> statement-breakpoint
CREATE INDEX "ats_candidate_languages_idx" ON "ats_candidate_languages" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_candidate_link_idx" ON "ats_candidate_links" USING btree ("candidate_id","kind","url");--> statement-breakpoint
CREATE INDEX "ats_candidate_projects_idx" ON "ats_candidate_projects" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE INDEX "ats_resume_conflicts_idx" ON "ats_resume_conflicts" USING btree ("organization_id","candidate_id","resolution");--> statement-breakpoint
CREATE INDEX "ats_resume_fields_idx" ON "ats_resume_extraction_fields" USING btree ("organization_id","extraction_id","field_path");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_resume_extraction_job_idx" ON "ats_resume_extractions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "ats_resume_extraction_candidate_idx" ON "ats_resume_extractions" USING btree ("organization_id","candidate_id");--> statement-breakpoint
CREATE INDEX "ats_resume_attempts_idx" ON "ats_resume_processing_attempts" USING btree ("organization_id","job_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_resume_job_idempotency_idx" ON "ats_resume_processing_jobs" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "ats_resume_job_status_idx" ON "ats_resume_processing_jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "ats_resume_job_document_idx" ON "ats_resume_processing_jobs" USING btree ("organization_id","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_skill_alias_scope_idx" ON "ats_skill_aliases" USING btree ("organization_id","normalized_alias");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_skill_taxonomy_scope_name_idx" ON "ats_skill_taxonomy" USING btree ("organization_id","normalized_name");--> statement-breakpoint
CREATE INDEX "ats_candidate_documents_hash_idx" ON "ats_candidate_documents" USING btree ("organization_id","content_hash");--> statement-breakpoint
ALTER TABLE "ats_resume_processing_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_resume_extractions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_resume_extraction_fields" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_resume_conflicts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_field_provenance" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_skill_taxonomy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_skill_aliases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_certifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_languages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_candidate_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ats_resume_processing_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ats_resume_processing_jobs_tenant_isolation" ON "ats_resume_processing_jobs" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_resume_processing_attempts_tenant_isolation" ON "ats_resume_processing_attempts" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_resume_extractions_tenant_isolation" ON "ats_resume_extractions" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_resume_extraction_fields_tenant_isolation" ON "ats_resume_extraction_fields" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_resume_conflicts_tenant_isolation" ON "ats_resume_conflicts" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_field_provenance_tenant_isolation" ON "ats_candidate_field_provenance" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_skill_taxonomy_tenant_isolation" ON "ats_skill_taxonomy" USING (organization_id IS NULL OR organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_skill_aliases_tenant_isolation" ON "ats_skill_aliases" USING (organization_id IS NULL OR organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_certifications_tenant_isolation" ON "ats_candidate_certifications" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_projects_tenant_isolation" ON "ats_candidate_projects" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_languages_tenant_isolation" ON "ats_candidate_languages" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_candidate_links_tenant_isolation" ON "ats_candidate_links" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
CREATE POLICY "ats_resume_processing_configs_tenant_isolation" ON "ats_resume_processing_configs" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');--> statement-breakpoint
