ALTER TABLE "blog" ADD COLUMN "references" varchar[10];--> statement-breakpoint
ALTER TABLE "blog" DROP COLUMN IF EXISTS "reference_doi";