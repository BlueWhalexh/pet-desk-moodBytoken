-- Add `desktop_launch` to the email_campaign enum so the broadcast
-- pipeline can record sends for the desktop-launch announcement
-- alongside the existing `collections_drop` campaign.
ALTER TYPE "public"."email_campaign" ADD VALUE 'desktop_launch';
