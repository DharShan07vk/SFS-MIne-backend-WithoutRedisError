CREATE TYPE "public"."payout_status" AS ENUM('pending', 'queued', 'scheduled', 'processing', 'processed', 'reversed', 'cancelled', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"rzpy_contact_id" varchar(40),
	"rzpy_bank_acct_id" varchar(40),
	"rzpy_vpa_id" varchar(40),
	"rzpy_card_id" varchar(40),
	"bank_acc_verified_on" timestamp with time zone,
	"vpa_verified_on" timestamp with time zone,
	"card_verified_on" timestamp with time zone,
	CONSTRAINT "account_partner_id_unique" UNIQUE("partner_id"),
	CONSTRAINT "account_rzpyContactId_unique" UNIQUE("rzpy_contact_id"),
	CONSTRAINT "account_rzpyBankAcctId_unique" UNIQUE("rzpy_bank_acct_id"),
	CONSTRAINT "account_rzpy_vpa_id_unique" UNIQUE("rzpy_vpa_id"),
	CONSTRAINT "account_rzpyCardId_unique" UNIQUE("rzpy_card_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"reference_no" varchar(30) NOT NULL,
	"rzpy_payout_id" varchar(40),
	"createdAt" timestamp with time zone DEFAULT now(),
	"completedOn" timestamp with time zone,
	"status" "payout_status" DEFAULT 'pending',
	"reason" text,
	"training_id" uuid,
	"amount" varchar(10)
);
--> statement-breakpoint
ALTER TABLE "instructor" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "training" ADD COLUMN "cut" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_partner_id_instructor_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."instructor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout" ADD CONSTRAINT "payout_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout" ADD CONSTRAINT "payout_training_id_training_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."training"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_profileImageURL_unique" UNIQUE("profile_image_url");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_profileImageURL_unique" UNIQUE("profile_image_url");