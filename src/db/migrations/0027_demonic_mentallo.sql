ALTER TABLE "public"."training" ALTER COLUMN "category" SET DATA TYPE text;
DROP TYPE "public"."training_category";--> statement-breakpoint
CREATE TYPE "public"."training_category" AS ENUM('Seminars/Webinar/Mentorship', 'Certificate Program', 'Corporate Training Program', 'Instrumentation Hands-on');--> statement-breakpoint
ALTER TABLE "public"."training" ALTER COLUMN "category" SET DATA TYPE "public"."training_category" USING "category"::"public"."training_category";