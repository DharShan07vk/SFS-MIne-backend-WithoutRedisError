ALTER TABLE "transaction" ADD COLUMN "payment_id" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "order_id" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "signature" varchar(500) NOT NULL;