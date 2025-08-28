CREATE TABLE IF NOT EXISTS "blog_author" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"email" varchar(200) NOT NULL,
	"mobile" char(10) NOT NULL,
	"linkedin" varchar,
	"designation" varchar(50),
	CONSTRAINT "blog_author_email_unique" UNIQUE("email"),
	CONSTRAINT "blog_author_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(221) NOT NULL,
	"content" text NOT NULL,
	"cover_image" varchar,
	"reference_doi" varchar,
	"approved_by" uuid,
	"blog_author" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "blog_title_unique" UNIQUE("title"),
	CONSTRAINT "blog_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "admin" DROP CONSTRAINT "admin_first_name_unique";--> statement-breakpoint
ALTER TABLE "instructor" DROP CONSTRAINT "instructor_first_name_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_first_name_unique";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog" ADD CONSTRAINT "blog_approved_by_admin_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog" ADD CONSTRAINT "blog_blog_author_blog_author_id_fk" FOREIGN KEY ("blog_author") REFERENCES "public"."blog_author"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
