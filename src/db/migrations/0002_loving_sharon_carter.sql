ALTER TABLE "admin" DROP CONSTRAINT "admin_firstName_unique";--> statement-breakpoint
ALTER TABLE "instructor" DROP CONSTRAINT "instructor_firstName_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_firstName_unique";--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_first_name_unique" UNIQUE("first_name");--> statement-breakpoint
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_first_name_unique" UNIQUE("first_name");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_first_name_unique" UNIQUE("first_name");