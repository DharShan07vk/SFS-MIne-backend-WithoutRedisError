ALTER TABLE "career_counselling" ALTER COLUMN "message" DROP NOT NULL;
ALTER TABLE "career_counselling" RENAME COLUMN "message" TO "service";--> statement-breakpoint
ALTER TABLE "career_counselling" ADD COLUMN "plan" "inst_plans";