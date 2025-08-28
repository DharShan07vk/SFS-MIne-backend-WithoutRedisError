CREATE TABLE IF NOT EXISTS "career_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "career_transaction" ADD CONSTRAINT "career_transaction_institution_id_career_counselling_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."career_counselling"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "career_transaction" ADD CONSTRAINT "career_transaction_transaction_id_enq_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."enq_transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
