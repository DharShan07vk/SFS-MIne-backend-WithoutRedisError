ALTER TABLE "training_enrolment" ADD COLUMN "paid_on" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training" ADD COLUMN "stream" varchar(100);