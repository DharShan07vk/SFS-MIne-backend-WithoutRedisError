CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'success', 'cancelled', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txn_no" char(21),
	"amount" varchar(10) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending',
	"enrolment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction" ADD CONSTRAINT "transaction_enrolment_id_training_enrolment_id_fk" FOREIGN KEY ("enrolment_id") REFERENCES "public"."training_enrolment"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
