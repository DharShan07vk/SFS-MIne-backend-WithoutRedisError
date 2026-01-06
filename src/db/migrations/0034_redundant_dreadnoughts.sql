CREATE TYPE "public"."ind-int-type" AS ENUM('individual', 'institution');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "individual_institution_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"individual_institution_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "individual_institution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"email" varchar(200) NOT NULL,
	"type" "ind-int-type" NOT NULL,
	"designation" varchar(100),
	"organization_name" varchar(200),
	"requirements" text,
	"concerns" text,
	"service_interest" varchar(200),
	"selectedDate" varchar(20),
	"selectedTime" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "individual_institution_mobile_unique" UNIQUE("mobile"),
	CONSTRAINT "individual_institution_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "individual_institution_transaction" ADD CONSTRAINT "individual_institution_transaction_individual_institution_id_individual_institution_id_fk" FOREIGN KEY ("individual_institution_id") REFERENCES "public"."individual_institution"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "individual_institution_transaction" ADD CONSTRAINT "individual_institution_transaction_transaction_id_enq_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."enq_transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
