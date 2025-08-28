CREATE TYPE "public"."inst_plans" AS ENUM('Basics', 'Premium');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enq_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txn_no" char(21),
	"payment_id" varchar(500),
	"order_id" varchar(500) NOT NULL,
	"signature" varchar(500),
	"idempotency_id" varchar(500),
	"amount" varchar(10) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institution_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"plan" "inst_plans" NOT NULL,
	"transaction_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "psychology_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psych_req_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "institution_transaction" ADD CONSTRAINT "institution_transaction_institution_id_institution_plan_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution_plan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "institution_transaction" ADD CONSTRAINT "institution_transaction_transaction_id_enq_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."enq_transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychology_transaction" ADD CONSTRAINT "psychology_transaction_psych_req_id_psychology_training_id_fk" FOREIGN KEY ("psych_req_id") REFERENCES "public"."psychology_training"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychology_transaction" ADD CONSTRAINT "psychology_transaction_transaction_id_enq_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."enq_transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
