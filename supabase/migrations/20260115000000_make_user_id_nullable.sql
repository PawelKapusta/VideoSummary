-- Make user_id nullable in bulk_generation_status table to allow system-triggered generations
ALTER TABLE "public"."bulk_generation_status" ALTER COLUMN "user_id" DROP NOT NULL;
