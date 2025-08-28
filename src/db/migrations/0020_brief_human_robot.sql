ALTER TABLE "account" ADD COLUMN "rzpy_funding_acct_id" varchar(40);--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_rzpyFundingAcctId_unique" UNIQUE("rzpy_funding_acct_id");