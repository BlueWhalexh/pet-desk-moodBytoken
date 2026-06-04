CREATE INDEX IF NOT EXISTS "submitted_pets_review_dhash_idx"
  ON "submitted_pets" USING btree ("status", "created_at" DESC)
  WHERE "dhash" IS NOT NULL AND "status" IN ('approved', 'pending');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submitted_pets_status_created_at_idx"
  ON "submitted_pets" USING btree ("status", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_reviews_pet_created_at_idx"
  ON "submission_reviews" USING btree ("submitted_pet_id", "created_at" DESC);
