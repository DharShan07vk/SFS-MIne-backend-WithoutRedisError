CREATE TYPE "public"."training_category" AS ENUM('Certificate Courses', 'Industrial Training', 'Academic Training', 'Instrumentation Hands-on', 'Seminars/Webinar');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institution_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_name" varchar(200) NOT NULL,
	"address_id" integer NOT NULL,
	"contact_name" varchar(200) NOT NULL,
	"contact_mobile" char(10) NOT NULL,
	"contact_email" varchar NOT NULL,
	"students_count" integer,
	CONSTRAINT "institution_plan_schoolName_unique" UNIQUE("school_name"),
	CONSTRAINT "institution_plan_contactMobile_unique" UNIQUE("contact_mobile"),
	CONSTRAINT "institution_plan_contactEmail_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "psychology_training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"city" varchar(200) NOT NULL,
	"state" varchar(200) NOT NULL,
	"id_card_url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instructor" ADD COLUMN "topics" varchar[10];--> statement-breakpoint
ALTER TABLE "training" ADD COLUMN "category" "training_category";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "institution_plan" ADD CONSTRAINT "institution_plan_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "instructor" DROP COLUMN IF EXISTS "training_topic";--> statement-breakpoint
ALTER TABLE "instructor" DROP COLUMN IF EXISTS "training_days";--> statement-breakpoint
ALTER TABLE "training" DROP COLUMN IF EXISTS "stream";