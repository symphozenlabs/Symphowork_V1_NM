CREATE TYPE "public"."ats_embedding_status" AS ENUM('queued', 'processing', 'ready', 'failed', 'stale');--> statement-breakpoint
CREATE TYPE "public"."ats_match_alignment" AS ENUM('matched', 'partial', 'missing', 'unknown', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."ats_semantic_search_status" AS ENUM('interpreted', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "ats_embedding_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"source_type" varchar(40) NOT NULL,
	"source_id" uuid NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"embedding_version" varchar(40) NOT NULL,
	"status" "ats_embedding_status" DEFAULT 'queued' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"idempotency_key" varchar(180) NOT NULL,
	"failure_reason" varchar(1000),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid,
	"job_id" uuid,
	"source_type" varchar(40) NOT NULL,
	"source_id" uuid NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"embedding_version" varchar(40) NOT NULL,
	"provider" varchar(80) NOT NULL,
	"model" varchar(160) NOT NULL,
	"dimensions" integer,
	"embedding_payload" text,
	"normalized_content" text NOT NULL,
	"status" "ats_embedding_status" DEFAULT 'queued' NOT NULL,
	"failure_reason" varchar(1000),
	"ready_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_job_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"requisition_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"requirements" text NOT NULL,
	"source" varchar(40) DEFAULT 'deterministic' NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"authored_requirements_preserved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"application_id" uuid,
	"requirement_version" integer NOT NULL,
	"matching_version" varchar(40) NOT NULL,
	"configuration_snapshot" text NOT NULL,
	"candidate_snapshot" text NOT NULL,
	"status" varchar(40) NOT NULL,
	"dimensions" text NOT NULL,
	"strengths" text NOT NULL,
	"gaps" text NOT NULL,
	"uncertainties" text NOT NULL,
	"evidence" text NOT NULL,
	"confidence" varchar(20) NOT NULL,
	"semantic_used" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_semantic_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"semantic_search_enabled" boolean DEFAULT false NOT NULL,
	"external_processing_consent" boolean DEFAULT false NOT NULL,
	"provider" varchar(80),
	"model" varchar(160),
	"embedding_version" varchar(40) DEFAULT 'v1' NOT NULL,
	"dimensions" integer,
	"matching_version" varchar(40) DEFAULT 'v1' NOT NULL,
	"weights" text DEFAULT '{"requiredSkills":35,"relevantExperience":20,"preferredSkills":10,"roleSimilarity":10,"location":5,"noticePeriod":5,"education":5,"domain":10}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ats_semantic_configs_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "ats_semantic_search_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_user_id" uuid,
	"raw_query" text NOT NULL,
	"interpretation" text NOT NULL,
	"status" "ats_semantic_search_status" DEFAULT 'interpreted' NOT NULL,
	"result_count" integer,
	"semantic_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ats_embedding_jobs" ADD CONSTRAINT "ats_embedding_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_embeddings" ADD CONSTRAINT "ats_embeddings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_embeddings" ADD CONSTRAINT "ats_embeddings_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_embeddings" ADD CONSTRAINT "ats_embeddings_job_id_ats_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ats_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_job_requirements" ADD CONSTRAINT "ats_job_requirements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_job_requirements" ADD CONSTRAINT "ats_job_requirements_job_id_ats_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ats_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_job_requirements" ADD CONSTRAINT "ats_job_requirements_requisition_id_ats_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."ats_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_match_results" ADD CONSTRAINT "ats_match_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_match_results" ADD CONSTRAINT "ats_match_results_candidate_id_ats_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."ats_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_match_results" ADD CONSTRAINT "ats_match_results_job_id_ats_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ats_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_match_results" ADD CONSTRAINT "ats_match_results_application_id_ats_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."ats_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_semantic_configs" ADD CONSTRAINT "ats_semantic_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_semantic_search_queries" ADD CONSTRAINT "ats_semantic_search_queries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ats_semantic_search_queries" ADD CONSTRAINT "ats_semantic_search_queries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ats_embedding_jobs_idempotency_idx" ON "ats_embedding_jobs" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "ats_embedding_jobs_status_idx" ON "ats_embedding_jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_embeddings_source_version_hash_idx" ON "ats_embeddings" USING btree ("organization_id","source_type","source_id","embedding_version","content_hash");--> statement-breakpoint
CREATE INDEX "ats_embeddings_candidate_idx" ON "ats_embeddings" USING btree ("organization_id","candidate_id","status");--> statement-breakpoint
CREATE INDEX "ats_embeddings_job_idx" ON "ats_embeddings" USING btree ("organization_id","job_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ats_job_requirements_job_version_idx" ON "ats_job_requirements" USING btree ("job_id","version");--> statement-breakpoint
CREATE INDEX "ats_job_requirements_org_job_idx" ON "ats_job_requirements" USING btree ("organization_id","job_id");--> statement-breakpoint
CREATE INDEX "ats_match_results_org_job_idx" ON "ats_match_results" USING btree ("organization_id","job_id","generated_at");--> statement-breakpoint
CREATE INDEX "ats_match_results_org_candidate_idx" ON "ats_match_results" USING btree ("organization_id","candidate_id","generated_at");--> statement-breakpoint
CREATE INDEX "ats_semantic_queries_org_created_idx" ON "ats_semantic_search_queries" USING btree ("organization_id","created_at");
--> statement-breakpoint
ALTER TABLE "ats_embedding_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ats_embeddings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ats_job_requirements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ats_match_results" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ats_semantic_configs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ats_semantic_search_queries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "ats_embedding_jobs_tenant_isolation" ON "ats_embedding_jobs" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
CREATE POLICY "ats_embeddings_tenant_isolation" ON "ats_embeddings" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
CREATE POLICY "ats_job_requirements_tenant_isolation" ON "ats_job_requirements" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
CREATE POLICY "ats_match_results_tenant_isolation" ON "ats_match_results" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
CREATE POLICY "ats_semantic_configs_tenant_isolation" ON "ats_semantic_configs" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
--> statement-breakpoint
CREATE POLICY "ats_semantic_search_queries_tenant_isolation" ON "ats_semantic_search_queries" USING (organization_id::text = current_setting('app.current_organization_id', true) OR current_setting('app.is_platform_owner', true) = 'true');
