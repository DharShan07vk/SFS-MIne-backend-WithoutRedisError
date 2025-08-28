CREATE TABLE IF NOT EXISTS "address" (
	"id" serial PRIMARY KEY NOT NULL,
	"address_line_1" varchar NOT NULL,
	"address_line_2" varchar,
	"city" varchar(200) NOT NULL,
	"district" varchar(200),
	"state" varchar(200) NOT NULL,
	"pincode" char(6) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instructor" ADD COLUMN "address_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructor" ADD CONSTRAINT "instructor_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "instructor" DROP COLUMN IF EXISTS "city";--> statement-breakpoint
ALTER TABLE "instructor" DROP COLUMN IF EXISTS "state";