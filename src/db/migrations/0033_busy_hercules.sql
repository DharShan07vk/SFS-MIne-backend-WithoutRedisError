CREATE TABLE IF NOT EXISTS "userotp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(200) NOT NULL,
	"otp" integer NOT NULL,
	"created_at" integer NOT NULL,
	"expires_at" integer NOT NULL,
	CONSTRAINT "userotp_email_unique" UNIQUE("email")
);
