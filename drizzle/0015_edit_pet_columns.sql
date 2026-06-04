ALTER TABLE "submitted_pets" ADD COLUMN "pending_spritesheet_url" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_pet_json_url" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_zip_url" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_spritesheet_width" integer;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_spritesheet_height" integer;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_dhash" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_review_id" text;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "pending_auto_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "edit_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "submitted_pets" ADD COLUMN "last_edit_at" timestamp with time zone;
