CREATE TYPE "public"."file_scan_status" AS ENUM('pending', 'clean', 'infected', 'scan_failed');--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ALTER COLUMN "scan_status" SET DEFAULT 'pending'::"public"."file_scan_status";--> statement-breakpoint
ALTER TABLE "ats_candidate_documents" ALTER COLUMN "scan_status" SET DATA TYPE "public"."file_scan_status" USING (CASE WHEN "scan_status" = 'not_scanned' THEN 'pending' ELSE "scan_status" END)::"public"."file_scan_status";--> statement-breakpoint
ALTER TABLE "employee_documents" ADD COLUMN "scan_status" "file_scan_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_receipts" ADD COLUMN "scan_status" "file_scan_status" DEFAULT 'pending' NOT NULL;
