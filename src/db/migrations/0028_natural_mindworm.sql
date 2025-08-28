CREATE TABLE IF NOT EXISTS "career_counselling" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"message" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint