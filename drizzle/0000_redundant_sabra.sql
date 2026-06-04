CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."pet_kind" AS ENUM('creature', 'object', 'character');--> statement-breakpoint
CREATE TABLE "pet_likes" (
	"user_id" text NOT NULL,
	"pet_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_likes_user_id_pet_slug_pk" PRIMARY KEY("user_id","pet_slug")
);
--> statement-breakpoint
CREATE TABLE "pet_metrics" (
	"pet_slug" text PRIMARY KEY NOT NULL,
	"install_count" integer DEFAULT 0 NOT NULL,
	"zip_download_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"last_installed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submitted_pets" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text NOT NULL,
	"spritesheet_url" text NOT NULL,
	"pet_json_url" text NOT NULL,
	"zip_url" text NOT NULL,
	"kind" "pet_kind" DEFAULT 'creature' NOT NULL,
	"vibes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"owner_id" text NOT NULL,
	"owner_email" text,
	"credit_name" text,
	"credit_url" text,
	"credit_image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE INDEX "pet_likes_slug_idx" ON "pet_likes" USING btree ("pet_slug");--> statement-breakpoint
CREATE INDEX "submitted_pets_status_idx" ON "submitted_pets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submitted_pets_owner_idx" ON "submitted_pets" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submitted_pets_slug_unique" ON "submitted_pets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "submitted_pets_status_featured_name_idx" ON "submitted_pets" USING btree ("status","featured","display_name");--> statement-breakpoint
CREATE INDEX "submitted_pets_status_kind_idx" ON "submitted_pets" USING btree ("status","kind");--> statement-breakpoint
CREATE INDEX "submitted_pets_vibes_gin_idx" ON "submitted_pets" USING gin ("vibes");--> statement-breakpoint
CREATE INDEX "submitted_pets_tags_gin_idx" ON "submitted_pets" USING gin ("tags");