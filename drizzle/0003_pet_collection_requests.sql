CREATE TABLE IF NOT EXISTS "pet_collection_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "collection_id" text NOT NULL,
  "pet_slug" text NOT NULL,
  "requested_by" text NOT NULL,
  "note" text,
  "status" "approval_status" NOT NULL DEFAULT 'pending',
  "decided_at" timestamp with time zone,
  "decided_by" text,
  "rejection_reason" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "pet_collection_requests_collection_id_fk"
    FOREIGN KEY ("collection_id") REFERENCES "public"."pet_collections"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_collection_requests_status_idx"
  ON "pet_collection_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pet_collection_requests_requester_idx"
  ON "pet_collection_requests" USING btree ("requested_by");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pet_collection_requests_pending_pair"
  ON "pet_collection_requests" USING btree ("collection_id", "pet_slug", "status");
