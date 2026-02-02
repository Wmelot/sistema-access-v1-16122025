-- Add document_logo_url to clinic_settings
ALTER TABLE "public"."clinic_settings" ADD COLUMN IF NOT EXISTS "document_logo_url" text;
