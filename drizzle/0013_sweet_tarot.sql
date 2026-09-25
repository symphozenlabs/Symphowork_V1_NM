ALTER TABLE "plans" ADD COLUMN "monthly_price_cents" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "annual_price_cents" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "currency" varchar(3) DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "trial_days" integer DEFAULT 0 NOT NULL;