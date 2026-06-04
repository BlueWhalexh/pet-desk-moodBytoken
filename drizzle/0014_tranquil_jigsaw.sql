ALTER TYPE "public"."email_campaign" ADD VALUE 'desktop_launch';--> statement-breakpoint
CREATE TABLE "wechat_qr_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"uploaded_by" text NOT NULL,
	"blob_url" text NOT NULL,
	"history_key" text NOT NULL,
	"validation_result" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "gallery_position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "wechat_qr_uploads_status_idx" ON "wechat_qr_uploads" USING btree ("status","uploaded_at");