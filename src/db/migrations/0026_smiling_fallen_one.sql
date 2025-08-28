CREATE TYPE "public"."training_type" AS ENUM('ONLINE', 'OFFLINE', 'HYBRID');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_lesson" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(300) NOT NULL,
	"video" text,
	"content" text,
	"location" varchar(400),
	"type" "training_type" NOT NULL,
	"training_id" uuid,
	"last_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "training_lesson_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_training_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid,
	"user_id" uuid,
	"completed_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "training" ADD COLUMN "type" "training_type";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_lesson" ADD CONSTRAINT "training_lesson_training_id_training_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_training_progress" ADD CONSTRAINT "user_training_progress_lesson_id_training_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."training_lesson"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_training_progress" ADD CONSTRAINT "user_training_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
