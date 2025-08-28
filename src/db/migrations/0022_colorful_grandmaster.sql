CREATE TYPE "public"."ca_edu_type" AS ENUM('UG', 'PG', 'PhD');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ca_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"edu_type" "ca_edu_type" NOT NULL,
	"department" varchar(100) NOT NULL,
	"college_name" varchar(200) NOT NULL,
	"year_in_college" smallint,
	"city" varchar(200) NOT NULL,
	"date_of_birth" date,
	"linkedin" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "our_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"logo" text NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "our_partners_logo_unique" UNIQUE("logo")
);
--> statement-breakpoint
ALTER TABLE "training" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "psychology_training" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "psychology_training" ADD COLUMN "updated_at" timestamp with time zone;