CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
DROP INDEX IF EXISTS "submitted_pets_embedding_idx";--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN IF NOT EXISTS "embedding" vector(3072);--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN IF NOT EXISTS "embedding_model" text;--> statement-breakpoint
ALTER TABLE "pet_requests" ADD COLUMN IF NOT EXISTS "embedding" vector(3072);--> statement-breakpoint
ALTER TABLE "pet_requests" ADD COLUMN IF NOT EXISTS "embedding_model" text;--> statement-breakpoint
UPDATE "submitted_pets"
SET "embedding" = NULL,
    "embedding_model" = NULL
WHERE "embedding_model" IS DISTINCT FROM 'google/gemini-embedding-2';--> statement-breakpoint
UPDATE "pet_requests"
SET "embedding" = NULL,
    "embedding_model" = NULL
WHERE "embedding_model" IS DISTINCT FROM 'google/gemini-embedding-2';--> statement-breakpoint
ALTER TABLE "submitted_pets" ALTER COLUMN "embedding" TYPE vector(3072) USING NULL::vector(3072);--> statement-breakpoint
ALTER TABLE "pet_requests" ALTER COLUMN "embedding" TYPE vector(3072) USING NULL::vector(3072);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submitted_pets_embedding_model_idx" ON "submitted_pets" USING btree ("embedding_model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_requests_embedding_model_idx" ON "pet_requests" USING btree ("embedding_model");
