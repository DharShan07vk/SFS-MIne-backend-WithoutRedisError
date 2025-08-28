CREATE TABLE IF NOT EXISTS "admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"hash" varchar NOT NULL,
	"salt" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "admin_firstName_unique" UNIQUE("first_name"),
	CONSTRAINT "admin_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"hash" varchar NOT NULL,
	"salt" varchar NOT NULL,
	"training_topic" varchar(50),
	"training_days" integer,
	"institution_name" varchar(100),
	"city" varchar(100),
	"state" varchar(100),
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "instructor_firstName_unique" UNIQUE("first_name"),
	CONSTRAINT "instructor_email_unique" UNIQUE("email"),
	CONSTRAINT "instructor_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructor" ADD CONSTRAINT "instructor_approved_by_admin_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
