CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"hash" varchar NOT NULL,
	"salt" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_firstName_unique" UNIQUE("first_name"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_mobile_unique" UNIQUE("mobile")
);
