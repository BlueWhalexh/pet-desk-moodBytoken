CREATE TYPE "public"."ad_event_kind" AS ENUM('hover', 'click', 'dismissed', 'time_in_view');--> statement-breakpoint
CREATE TABLE "ad_events" (
  "id" text PRIMARY KEY NOT NULL,
  "campaign_id" text NOT NULL,
  "kind" "ad_event_kind" NOT NULL,
  "user_id" text,
  "anonymous_id" text,
  "session_id" text NOT NULL,
  "request_id" text NOT NULL,
  "duration_ms" integer,
  "path" text NOT NULL,
  "locale" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "ad_events" ADD CONSTRAINT "ad_events_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_events_campaign_kind_idx" ON "ad_events" USING btree ("campaign_id","kind","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_events_dedupe_unique" ON "ad_events" USING btree ("campaign_id","kind","session_id","request_id");
