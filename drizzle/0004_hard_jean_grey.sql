ALTER TABLE "leave_applications" ALTER COLUMN "requested_days" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "opening_balance" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "accrued" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "consumed" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "pending" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "adjusted" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "leave_transactions" ALTER COLUMN "amount" SET DATA TYPE real;