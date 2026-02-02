ALTER TABLE "training" ADD COLUMN "who_is_it_for" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "training" ADD COLUMN "what_you_will_learn" text[] DEFAULT '{}' NOT NULL;