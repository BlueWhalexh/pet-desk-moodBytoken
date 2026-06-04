ALTER TABLE "submitted_pets" ADD COLUMN "gallery_position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "submitted_pets_owner_gallery_idx" ON "submitted_pets" USING btree ("owner_id","gallery_position","created_at" DESC NULLS LAST) WHERE "submitted_pets"."status" = 'approved';
