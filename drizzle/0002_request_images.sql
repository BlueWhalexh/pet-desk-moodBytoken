ALTER TABLE "pet_requests" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "pet_requests" ADD COLUMN IF NOT EXISTS "image_review_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_requests" ADD COLUMN IF NOT EXISTS "image_rejection_reason" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_requests_image_review_idx" ON "pet_requests" USING btree ("image_review_status");
