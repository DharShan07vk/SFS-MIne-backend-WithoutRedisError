CREATE TABLE IF NOT EXISTS "rating" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"training_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"feedback" text NOT NULL,
	"rated_on" timestamp with time zone,
	CONSTRAINT "rating_user_training" UNIQUE("user_id","training_id")
);
--> statement-breakpoint
ALTER TABLE "instructor" ADD COLUMN "gst" varchar(30);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rating" ADD CONSTRAINT "rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rating" ADD CONSTRAINT "rating_training_id_training_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "instructor" DROP COLUMN IF EXISTS "cin_or_gst";--> statement-breakpoint
ALTER TABLE "training_enrolment" DROP COLUMN IF EXISTS "feedback";