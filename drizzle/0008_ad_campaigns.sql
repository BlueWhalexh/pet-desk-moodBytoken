CREATE TYPE "public"."ad_campaign_status" AS ENUM('pending_payment', 'active', 'exhausted', 'paused', 'deleted');--> statement-breakpoint
CREATE TABLE "ad_campaigns" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "company_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "image_url" text NOT NULL,
  "destination_url" text NOT NULL,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_term" text,
  "utm_content" text,
  "package_views" integer NOT NULL,
  "price_cents" integer NOT NULL,
  "views_served" integer DEFAULT 0 NOT NULL,
  "status" "ad_campaign_status" DEFAULT 'pending_payment' NOT NULL,
  "stripe_checkout_session_id" text,
  "stripe_payment_intent_id" text,
  "accepted_terms_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "paid_at" timestamp with time zone,
  "activated_at" timestamp with time zone,
  "paused_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "removal_reason" text
);--> statement-breakpoint
CREATE TABLE "ad_impressions" (
  "id" text PRIMARY KEY NOT NULL,
  "campaign_id" text NOT NULL,
  "user_id" text,
  "anonymous_id" text,
  "session_id" text NOT NULL,
  "request_id" text NOT NULL,
  "visible_ms" integer NOT NULL,
  "path" text NOT NULL,
  "locale" text NOT NULL,
  "user_agent_hash" text,
  "ip_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_campaigns_user_idx" ON "ad_campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ad_campaigns_active_idx" ON "ad_campaigns" USING btree ("status","views_served","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_campaigns_stripe_session_unique" ON "ad_campaigns" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "ad_impressions_campaign_idx" ON "ad_impressions" USING btree ("campaign_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_impressions_dedupe_unique" ON "ad_impressions" USING btree ("campaign_id","session_id","request_id");
