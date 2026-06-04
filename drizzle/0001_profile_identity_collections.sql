ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "display_name" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "handle" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_handle_unique" ON "user_profiles" USING btree ("handle");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pet_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"owner_id" text,
	"external_url" text,
	"cover_pet_slug" text,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pet_collections_slug_unique" ON "pet_collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_collections_featured_idx" ON "pet_collections" USING btree ("featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_collections_owner_idx" ON "pet_collections" USING btree ("owner_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pet_collection_items" (
	"collection_id" text NOT NULL,
	"pet_slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_collection_items_collection_id_pet_slug_pk" PRIMARY KEY("collection_id","pet_slug"),
	CONSTRAINT "pet_collection_items_collection_id_pet_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."pet_collections"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_collection_items_slug_idx" ON "pet_collection_items" USING btree ("pet_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_collection_items_position_idx" ON "pet_collection_items" USING btree ("collection_id","position");--> statement-breakpoint
INSERT INTO "user_profiles" ("user_id", "display_name", "handle", "featured_pet_slugs", "updated_at")
SELECT sp."owner_id", 'Kevin Wu', 'kevwuzy', '[]'::jsonb, now()
FROM "submitted_pets" sp
WHERE lower(coalesce(sp."owner_email", '')) = 'kevinwu@gray.inc'
LIMIT 1
ON CONFLICT ("user_id") DO UPDATE SET
	"display_name" = coalesce("user_profiles"."display_name", excluded."display_name"),
	"handle" = coalesce("user_profiles"."handle", excluded."handle"),
	"updated_at" = now();
--> statement-breakpoint
INSERT INTO "pet_collections" ("id", "slug", "title", "description", "owner_id", "external_url", "cover_pet_slug", "featured", "updated_at")
SELECT
	'graycraft',
	'graycraft',
	'GRAYCRAFT',
	'Original mech companions by Kevin Wu, grouped as a collectible Petdex set.',
	sp."owner_id",
	'https://graycraft.com',
	'graycraft7',
	true,
	now()
FROM "submitted_pets" sp
WHERE lower(coalesce(sp."owner_email", '')) = 'kevinwu@gray.inc'
LIMIT 1
ON CONFLICT ("slug") DO UPDATE SET
	"title" = excluded."title",
	"description" = excluded."description",
	"owner_id" = coalesce("pet_collections"."owner_id", excluded."owner_id"),
	"external_url" = excluded."external_url",
	"cover_pet_slug" = excluded."cover_pet_slug",
	"featured" = true,
	"updated_at" = now();
--> statement-breakpoint
INSERT INTO "pet_collection_items" ("collection_id", "pet_slug", "position")
SELECT 'graycraft', sp."slug", v."position"
FROM (VALUES
	('graycraft6', 1),
	('graycraft4', 2),
	('graycraft5', 3),
	('graycraft7', 4),
	('ding-ding', 5)
) AS v("slug", "position")
INNER JOIN "submitted_pets" sp ON sp."slug" = v."slug" AND sp."status" = 'approved'
ON CONFLICT ("collection_id", "pet_slug") DO UPDATE SET
	"position" = excluded."position";
