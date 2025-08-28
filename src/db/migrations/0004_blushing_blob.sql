CREATE TYPE "public"."duration_type" AS ENUM('Weeks', 'Days', 'Hours', 'Months');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer,
	"point" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(30) NOT NULL,
	"description" varchar(200),
	"cost" varchar(10),
	CONSTRAINT "pricing_plan_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_enrolment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"training_id" uuid,
	"completed_on" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"cover_img" varchar(2000),
	"link" varchar(2000),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"duration_value" integer,
	"duration_type" "duration_type",
	"location" varchar(200),
	"cost" varchar(10),
	"created_by" uuid,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "training_title_unique" UNIQUE("title")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_points" ADD CONSTRAINT "plan_points_plan_id_pricing_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_enrolment" ADD CONSTRAINT "training_enrolment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_enrolment" ADD CONSTRAINT "training_enrolment_training_id_training_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training" ADD CONSTRAINT "training_created_by_instructor_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."instructor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training" ADD CONSTRAINT "training_approved_by_admin_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
