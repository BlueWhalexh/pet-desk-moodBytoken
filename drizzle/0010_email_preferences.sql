CREATE TYPE "public"."email_campaign" AS ENUM('collections_drop');--> statement-breakpoint
CREATE TYPE "public"."email_send_status" AS ENUM('queued', 'sent', 'delivered', 'opened', 'bounced', 'complained', 'failed');--> statement-breakpoint
CREATE TABLE "email_preferences" (
  "user_id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "unsubscribed_marketing" boolean DEFAULT false NOT NULL,
  "unsubscribed_at" timestamp with time zone,
  "unsubscribe_token" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "email_sends" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "email" text NOT NULL,
  "campaign" "email_campaign" NOT NULL,
  "batch_key" text NOT NULL,
  "resend_id" text,
  "status" "email_send_status" DEFAULT 'queued' NOT NULL,
  "error" text,
  "sent_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "opened_at" timestamp with time zone,
  "bounced_at" timestamp with time zone,
  "complained_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "email_preferences_email_idx" ON "email_preferences" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "email_preferences_token_unique" ON "email_preferences" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "email_preferences_opted_in_idx" ON "email_preferences" USING btree ("unsubscribed_marketing");--> statement-breakpoint
CREATE INDEX "email_sends_user_idx" ON "email_sends" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_sends_batch_idx" ON "email_sends" USING btree ("batch_key");--> statement-breakpoint
CREATE INDEX "email_sends_campaign_idx" ON "email_sends" USING btree ("campaign","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_sends_status_idx" ON "email_sends" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "email_sends_resend_unique" ON "email_sends" USING btree ("resend_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_sends_user_batch_unique" ON "email_sends" USING btree ("user_id","batch_key");
