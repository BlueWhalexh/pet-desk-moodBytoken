CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN IF NOT EXISTS "sprite_sha256" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN IF NOT EXISTS "pet_json_sha256" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN IF NOT EXISTS "zip_sha256" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submitted_pets_sprite_sha_idx" ON "submitted_pets" USING btree ("sprite_sha256");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submitted_pets_pet_json_sha_idx" ON "submitted_pets" USING btree ("pet_json_sha256");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submitted_pets_zip_sha_idx" ON "submitted_pets" USING btree ("zip_sha256");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submission_reviews" (
  "id" text PRIMARY KEY NOT NULL,
  "submitted_pet_id" text NOT NULL,
  "status" text NOT NULL,
  "decision" text NOT NULL,
  "reason_code" text,
  "summary" text,
  "confidence" integer,
  "checks" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "model" text,
  "dry_run" boolean NOT NULL DEFAULT true,
  "error" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "submission_reviews_submitted_pet_id_fk"
    FOREIGN KEY ("submitted_pet_id") REFERENCES "public"."submitted_pets"("id")
    ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_pet_idx" ON "submission_reviews" USING btree ("submitted_pet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_status_idx" ON "submission_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_decision_idx" ON "submission_reviews" USING btree ("decision");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_created_at_idx" ON "submission_reviews" USING btree ("created_at");
