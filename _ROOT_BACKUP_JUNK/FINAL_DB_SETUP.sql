


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."create_consent_token_rpc"("p_patient_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
    t_created_at TIMESTAMPTZ;
BEGIN
    new_token := uuid_generate_v4()::text;
    
    INSERT INTO public.consent_tokens (patient_id, token)
    VALUES (p_patient_id, new_token)
    RETURNING id, created_at INTO new_id, t_created_at;

    RETURN jsonb_build_object(
        'success', true,
        'token', new_token,
        'id', new_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;


ALTER FUNCTION "public"."create_consent_token_rpc"("p_patient_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_consent_details"("token_input" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    token_record record;
    patient_name text;
BEGIN
    -- Find valid token
    SELECT * INTO token_record
    FROM public.consent_tokens
    WHERE token = token_input
      AND used_at IS NULL
      AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Link inválido ou expirado.');
    END IF;

    -- Get Patient Name
    SELECT name INTO patient_name
    FROM public.patients
    WHERE id = token_record.patient_id;

    RETURN jsonb_build_object(
        'valid', true, 
        'patient_name', patient_name,
        'patient_id', token_record.patient_id
    );
END;
$$;


ALTER FUNCTION "public"."get_consent_details"("token_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_profile_org"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF new.organization_id IS NULL THEN
    new.organization_id := uuid_generate_v4();
  END IF;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_profile_org"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_campaign_failed"("campaign_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE marketing_campaigns
  SET failed_count = failed_count + 1,
      updated_at = NOW()
  WHERE id = campaign_uuid;
END;
$$;


ALTER FUNCTION "public"."increment_campaign_failed"("campaign_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_campaign_sent"("campaign_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE marketing_campaigns
  SET sent_count = sent_count + 1,
      updated_at = NOW()
  WHERE id = campaign_uuid;
END;
$$;


ALTER FUNCTION "public"."increment_campaign_sent"("campaign_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_allowed_clinical"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'physio') 
    -- And match organization? Assuming strict tenancy is handled by the AND below
  );
$$;


ALTER FUNCTION "public"."is_allowed_clinical"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_clinical_update_after_24h"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Allow Admins to bypass? Maybe not even admins for legal reasons.
    -- But for valid corrections, maybe. Let's enforce strictly as requested.
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
            RAISE EXCEPTION 'Registro clínico bloqueado para edição após 24 horas (Lei do Prontuário). Faça um novo registro de correção.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_clinical_update_after_24h"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sign_consent"("token_input" "text", "ip_input" "text", "ua_input" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    token_record record;
BEGIN
    -- Verify again
    SELECT * INTO token_record
    FROM public.consent_tokens
    WHERE token = token_input
      AND used_at IS NULL
      AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Link inválido.');
    END IF;

    -- 1. Mark Token as Used
    UPDATE public.consent_tokens
    SET used_at = now(),
        ip_address = ip_input,
        user_agent = ua_input
    WHERE id = token_record.id;

    -- 2. Update Patient Consent
    UPDATE public.patients
    SET health_data_consent = TRUE
    WHERE id = token_record.patient_id;

    RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."sign_consent"("token_input" "text", "ip_input" "text", "ua_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_patient_status_rpc"("p_patient_id" "uuid", "p_status" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.patients
    SET status = p_status
    WHERE id = p_patient_id;

    IF NOT FOUND THEN
         RETURN jsonb_build_object('success', false, 'error', 'Patient not found');
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."toggle_patient_status_rpc"("p_patient_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_assessment_follow_ups_modtime"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_assessment_follow_ups_modtime"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_patient_assessments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_patient_assessments_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_integrations" (
    "provider" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."api_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "patient_id" "uuid",
    "professional_id" "uuid",
    "title" "text",
    "type" "text" DEFAULT 'appointment'::"text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text",
    "notes" "text",
    "price" numeric(10,2),
    "location_id" "uuid",
    "payment_method_id" "uuid",
    "invoice_id" "uuid",
    "service_id" "uuid",
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'completed'::"text", 'canceled'::"text"]))),
    CONSTRAINT "appointments_type_check" CHECK (("type" = ANY (ARRAY['appointment'::"text", 'block'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_follow_ups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "type" "text",
    "scheduled_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "delivery_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "response_data" "jsonb",
    "token" "text",
    "message_template_id" "uuid",
    "template_id" "uuid",
    CONSTRAINT "assessment_follow_ups_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'completed'::"text", 'cancelled'::"text", 'alert'::"text"]))),
    CONSTRAINT "assessment_follow_ups_type_check" CHECK (("type" = ANY (ARRAY['insoles_40d'::"text", 'insoles_1y'::"text"])))
);


ALTER TABLE "public"."assessment_follow_ups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "phone" "text" NOT NULL,
    "name" "text",
    "content" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "message_id" "text",
    CONSTRAINT "campaign_messages_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."campaign_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" DEFAULT 'Minha Clínica'::"text" NOT NULL,
    "cnpj" "text",
    "email" "text",
    "phone" "text",
    "website" "text",
    "primary_color" "text" DEFAULT '#84c8b9'::"text",
    "logo_url" "text",
    "document_logo_url" "text",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "pix_key" "text"
);


ALTER TABLE "public"."clinic_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinical_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "attachments" "jsonb"[]
);


ALTER TABLE "public"."clinical_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "used_at" timestamp with time zone,
    "ip_address" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."consent_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    CONSTRAINT "financial_categories_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."financial_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_commissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    "appointment_id" "uuid",
    "professional_id" "uuid",
    CONSTRAINT "financial_commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."financial_commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_payables" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "due_date" "date" NOT NULL,
    "description" "text",
    "linked_professional_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    CONSTRAINT "financial_payables_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."financial_payables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "description" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "user_id" "uuid"
);


ALTER TABLE "public"."form_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_method" "text",
    "payment_date" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "patient_id" "uuid",
    "appointment_id" "uuid",
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "capacity" integer DEFAULT 1 NOT NULL,
    "color" "text"
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_messages" integer DEFAULT 0,
    "sent_count" integer DEFAULT 0,
    "failed_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_for" timestamp with time zone,
    "template_content" "text",
    CONSTRAINT "marketing_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'sending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."marketing_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "template_id" "uuid",
    "phone" "text",
    "content" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "message_id" "text",
    "error_message" "text"
);


ALTER TABLE "public"."message_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trigger_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "delay_days" integer DEFAULT 0,
    "channel" "text",
    "title" "text",
    CONSTRAINT "message_templates_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['manual'::"text", 'appointment_confirmation'::"text", 'appointment_reminder'::"text", 'birthday'::"text", 'post_attendance'::"text", 'insole_delivery'::"text", 'insole_maintenance'::"text"])))
);


ALTER TABLE "public"."message_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_assessments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid",
    "type" "text" NOT NULL,
    "template_id" "text",
    "title" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scores" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "patient_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ai_summary" "text",
    "professional_id" "uuid",
    "appointment_id" "uuid"
);


ALTER TABLE "public"."patient_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "cpf" "text",
    "birthdate" "date",
    "email" "text",
    "phone" "text",
    "address_zip" "text",
    "address_street" "text",
    "notes" "text",
    "organization_id" "uuid",
    "health_data_consent" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "patients_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'deceased'::"text"])))
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."patients"."health_data_consent" IS 'Explicit consent for processing sensitive health data (Art. 11 LGPD)';



CREATE TABLE IF NOT EXISTS "public"."payment_method_fees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "method" "text" NOT NULL,
    "installments" integer DEFAULT 1,
    "fee_percent" numeric(5,2) DEFAULT 0
);


ALTER TABLE "public"."payment_method_fees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "module" "text" NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "stock_quantity" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "is_unlimited" boolean DEFAULT false
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_availability" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid",
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_break" boolean DEFAULT false,
    "location_id" "uuid"
);


ALTER TABLE "public"."professional_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_commission_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "professional_id" "uuid",
    "service_id" "uuid",
    "type" "text",
    "value" numeric(10,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "professional_commission_rules_type_check" CHECK (("type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"])))
);


ALTER TABLE "public"."professional_commission_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'physio'::"text",
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "organization_id" "uuid",
    "cpf" "text",
    "birthdate" "date",
    "gender" "text",
    "phone" "text",
    "council_type" "text",
    "council_number" "text",
    "specialty" "text",
    "color" "text" DEFAULT '#3b82f6'::"text",
    "photo_url" "text",
    "bio" "text",
    "address_zip" "text",
    "address_street" "text",
    "address_number" "text",
    "address_complement" "text",
    "address_neighborhood" "text",
    "address_city" "text",
    "address_state" "text",
    "slot_interval" integer DEFAULT 30,
    "allow_overbooking" boolean DEFAULT false,
    "role_id" "uuid",
    "terms_accepted_at" timestamp with time zone,
    "privacy_policy_version" "text" DEFAULT 'v1.0'::"text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'physio'::"text", 'receptionist'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."terms_accepted_at" IS 'Timestamp when the user accepted the Terms of Service';



CREATE TABLE IF NOT EXISTS "public"."report_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "profile_id" "uuid",
    "title" "text" NOT NULL,
    "type" "text" DEFAULT 'report'::"text" NOT NULL,
    "category" "text" DEFAULT 'Laudos'::"text",
    "content" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."report_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_system" boolean DEFAULT false
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_professionals" (
    "service_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL
);


ALTER TABLE "public"."service_professionals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "duration" integer DEFAULT 60 NOT NULL,
    "active" boolean DEFAULT true
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb"
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "type" "text",
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "category" "text",
    "patient_id" "uuid",
    "date" "date" DEFAULT CURRENT_DATE,
    "product_id" "uuid",
    "quantity" integer DEFAULT 1,
    "production_cost" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    "due_date" "date" DEFAULT CURRENT_DATE,
    "is_recurring" boolean DEFAULT false,
    "professional_id" "uuid",
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'canceled'::"text"]))),
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_template_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "is_favorite" boolean DEFAULT false,
    "is_allowed" boolean DEFAULT true
);


ALTER TABLE "public"."user_template_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb",
    "status" "text" NOT NULL,
    "details" "text"
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_integrations"
    ADD CONSTRAINT "api_integrations_pkey" PRIMARY KEY ("provider");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_follow_ups"
    ADD CONSTRAINT "assessment_follow_ups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_follow_ups"
    ADD CONSTRAINT "assessment_follow_ups_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."campaign_messages"
    ADD CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinic_settings"
    ADD CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_tokens"
    ADD CONSTRAINT "consent_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_tokens"
    ADD CONSTRAINT "consent_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."financial_categories"
    ADD CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_commissions"
    ADD CONSTRAINT "financial_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_payables"
    ADD CONSTRAINT "financial_payables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_campaigns"
    ADD CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_trigger_type_key" UNIQUE ("trigger_type");



ALTER TABLE ONLY "public"."patient_assessments"
    ADD CONSTRAINT "patient_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_records"
    ADD CONSTRAINT "patient_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_method_fees"
    ADD CONSTRAINT "payment_method_fees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_availability"
    ADD CONSTRAINT "professional_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_commission_rules"
    ADD CONSTRAINT "professional_commission_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_professionals"
    ADD CONSTRAINT "service_professionals_pkey" PRIMARY KEY ("service_id", "profile_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_template_preferences"
    ADD CONSTRAINT "user_template_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_template_preferences"
    ADD CONSTRAINT "user_template_preferences_user_id_template_id_key" UNIQUE ("user_id", "template_id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assessment_follow_ups_schedule_status" ON "public"."assessment_follow_ups" USING "btree" ("scheduled_date", "status");



CREATE INDEX "idx_campaign_messages_campaign_id" ON "public"."campaign_messages" USING "btree" ("campaign_id");



CREATE INDEX "idx_campaign_messages_status" ON "public"."campaign_messages" USING "btree" ("status");



CREATE INDEX "idx_patient_assessments_created_at" ON "public"."patient_assessments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patient_assessments_patient_id" ON "public"."patient_assessments" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_assessments_template_id" ON "public"."patient_assessments" USING "btree" ("template_id");



CREATE INDEX "idx_patients_status" ON "public"."patients" USING "btree" ("status");



CREATE INDEX "idx_profiles_role_id" ON "public"."profiles" USING "btree" ("role_id");



CREATE INDEX "idx_report_templates_category" ON "public"."report_templates" USING "btree" ("category");



CREATE INDEX "idx_report_templates_profile_id" ON "public"."report_templates" USING "btree" ("profile_id");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_provider" ON "public"."webhook_logs" USING "btree" ("provider");



CREATE INDEX "idx_webhook_logs_status" ON "public"."webhook_logs" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "ensure_profile_org" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_profile_org"();



CREATE OR REPLACE TRIGGER "trg_clinical_lock_24h" BEFORE DELETE OR UPDATE ON "public"."clinical_records" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_clinical_update_after_24h"();



CREATE OR REPLACE TRIGGER "update_assessment_follow_ups_modtime" BEFORE UPDATE ON "public"."assessment_follow_ups" FOR EACH ROW EXECUTE FUNCTION "public"."update_assessment_follow_ups_modtime"();



CREATE OR REPLACE TRIGGER "update_patient_assessments_updated_at" BEFORE UPDATE ON "public"."patient_assessments" FOR EACH ROW EXECUTE FUNCTION "public"."update_patient_assessments_updated_at"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."assessment_follow_ups"
    ADD CONSTRAINT "assessment_follow_ups_message_template_id_fkey" FOREIGN KEY ("message_template_id") REFERENCES "public"."message_templates"("id");



ALTER TABLE ONLY "public"."assessment_follow_ups"
    ADD CONSTRAINT "assessment_follow_ups_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_follow_ups"
    ADD CONSTRAINT "assessment_follow_ups_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id");



ALTER TABLE ONLY "public"."campaign_messages"
    ADD CONSTRAINT "campaign_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."consent_tokens"
    ADD CONSTRAINT "consent_tokens_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."consent_tokens"
    ADD CONSTRAINT "consent_tokens_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_commissions"
    ADD CONSTRAINT "financial_commissions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."financial_commissions"
    ADD CONSTRAINT "financial_commissions_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."financial_payables"
    ADD CONSTRAINT "financial_payables_linked_professional_id_fkey" FOREIGN KEY ("linked_professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id");



ALTER TABLE ONLY "public"."patient_assessments"
    ADD CONSTRAINT "patient_assessments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_assessments"
    ADD CONSTRAINT "patient_assessments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."patient_records"
    ADD CONSTRAINT "patient_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."patient_records"
    ADD CONSTRAINT "patient_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."patient_records"
    ADD CONSTRAINT "patient_records_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."patient_records"
    ADD CONSTRAINT "patient_records_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id");



ALTER TABLE ONLY "public"."professional_availability"
    ADD CONSTRAINT "professional_availability_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."professional_availability"
    ADD CONSTRAINT "professional_availability_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_commission_rules"
    ADD CONSTRAINT "professional_commission_rules_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."professional_commission_rules"
    ADD CONSTRAINT "professional_commission_rules_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_professionals"
    ADD CONSTRAINT "service_professionals_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_professionals"
    ADD CONSTRAINT "service_professionals_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_template_preferences"
    ADD CONSTRAINT "user_template_preferences_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id");



ALTER TABLE ONLY "public"."user_template_preferences"
    ADD CONSTRAINT "user_template_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin full access to api_integrations" ON "public"."api_integrations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view logs" ON "public"."system_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "All auth can manage service_prof" ON "public"."service_professionals" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "All auth can view availability" ON "public"."professional_availability" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "All auth can view service_prof" ON "public"."service_professionals" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users can manage locations" ON "public"."locations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users can manage products" ON "public"."products" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users can manage transactions" ON "public"."transactions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users can view locations" ON "public"."locations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access api_integrations" ON "public"."api_integrations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access clinic_settings" ON "public"."clinic_settings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access financial_categories" ON "public"."financial_categories" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access financial_commissions" ON "public"."financial_commissions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access financial_payables" ON "public"."financial_payables" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access invoices" ON "public"."invoices" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access message_logs" ON "public"."message_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access payment_method_fees" ON "public"."payment_method_fees" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access payment_methods" ON "public"."payment_methods" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users full access professional_commission_rules" ON "public"."professional_commission_rules" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create records" ON "public"."patient_records" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create templates" ON "public"."form_templates" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert logs" ON "public"."system_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert report templates" ON "public"."report_templates" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage preferences" ON "public"."user_template_preferences" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage role permissions" ON "public"."role_permissions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage roles" ON "public"."roles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage services" ON "public"."services" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update records" ON "public"."patient_records" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update templates" ON "public"."form_templates" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view logs" ON "public"."system_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view permissions" ON "public"."permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view records" ON "public"."patient_records" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view report templates" ON "public"."report_templates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view role permissions" ON "public"."role_permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view roles" ON "public"."roles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view services" ON "public"."services" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view templates" ON "public"."form_templates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view webhook logs" ON "public"."webhook_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all for users" ON "public"."assessment_follow_ups" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Manage own availability" ON "public"."professional_availability" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Physios can manage consent tokens" ON "public"."consent_tokens" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Tenant: Delete Patients" ON "public"."patients" FOR DELETE USING (("organization_id" = "public"."get_my_org_id"()));



CREATE POLICY "Tenant: Insert Patients" ON "public"."patients" FOR INSERT WITH CHECK (("organization_id" = "public"."get_my_org_id"()));



CREATE POLICY "Tenant: Manage Appointments" ON "public"."appointments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "appointments"."professional_id") AND ("p"."organization_id" = "public"."get_my_org_id"())))));



CREATE POLICY "Tenant: Modify Records (Strict)" ON "public"."clinical_records" USING (("public"."is_allowed_clinical"() AND (EXISTS ( SELECT 1
   FROM "public"."patients" "pat"
  WHERE (("pat"."id" = "clinical_records"."patient_id") AND ("pat"."organization_id" = ( SELECT "profiles"."organization_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))))));



CREATE POLICY "Tenant: Update Patients" ON "public"."patients" FOR UPDATE USING (("organization_id" = "public"."get_my_org_id"()));



CREATE POLICY "Tenant: View Appointments" ON "public"."appointments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "appointments"."professional_id") AND ("p"."organization_id" = "public"."get_my_org_id"())))));



CREATE POLICY "Tenant: View Patients" ON "public"."patients" FOR SELECT USING (("organization_id" = "public"."get_my_org_id"()));



CREATE POLICY "Tenant: View Records (Strict)" ON "public"."clinical_records" FOR SELECT USING (("public"."is_allowed_clinical"() AND (EXISTS ( SELECT 1
   FROM "public"."patients" "pat"
  WHERE (("pat"."id" = "clinical_records"."patient_id") AND ("pat"."organization_id" = ( SELECT "profiles"."organization_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))))));



CREATE POLICY "Users can create assessments for patients in their organization" ON "public"."patient_assessments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     JOIN "public"."profiles" "prof" ON (("prof"."organization_id" = "p"."organization_id")))
  WHERE (("p"."id" = "patient_assessments"."patient_id") AND ("prof"."id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own report templates" ON "public"."report_templates" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own assessments" ON "public"."patient_assessments" FOR DELETE USING (("professional_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own report templates" ON "public"."report_templates" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own assessments" ON "public"."patient_assessments" FOR UPDATE USING (("professional_id" = "auth"."uid"()));



CREATE POLICY "Users can view all preferences" ON "public"."user_template_preferences" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view assessments from their organization" ON "public"."patient_assessments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     JOIN "public"."profiles" "prof" ON (("prof"."organization_id" = "p"."organization_id")))
  WHERE (("p"."id" = "patient_assessments"."patient_id") AND ("prof"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view colleagues" ON "public"."profiles" FOR SELECT USING (("organization_id" = ( SELECT "profiles_1"."organization_id"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."api_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_follow_ups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinic_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinical_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_payables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_method_fees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_commission_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_professionals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_template_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_consent_token_rpc"("p_patient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_consent_token_rpc"("p_patient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_consent_token_rpc"("p_patient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_consent_details"("token_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_consent_details"("token_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_consent_details"("token_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_profile_org"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_profile_org"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_profile_org"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_campaign_failed"("campaign_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_campaign_failed"("campaign_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_campaign_failed"("campaign_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_campaign_sent"("campaign_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_campaign_sent"("campaign_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_campaign_sent"("campaign_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_allowed_clinical"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_allowed_clinical"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_allowed_clinical"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_clinical_update_after_24h"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_clinical_update_after_24h"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_clinical_update_after_24h"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sign_consent"("token_input" "text", "ip_input" "text", "ua_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sign_consent"("token_input" "text", "ip_input" "text", "ua_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sign_consent"("token_input" "text", "ip_input" "text", "ua_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_patient_status_rpc"("p_patient_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_patient_status_rpc"("p_patient_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_patient_status_rpc"("p_patient_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assessment_follow_ups_modtime"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assessment_follow_ups_modtime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assessment_follow_ups_modtime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_patient_assessments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_patient_assessments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_patient_assessments_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."api_integrations" TO "anon";
GRANT ALL ON TABLE "public"."api_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."api_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_follow_ups" TO "anon";
GRANT ALL ON TABLE "public"."assessment_follow_ups" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_follow_ups" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_messages" TO "anon";
GRANT ALL ON TABLE "public"."campaign_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_messages" TO "service_role";



GRANT ALL ON TABLE "public"."clinic_settings" TO "anon";
GRANT ALL ON TABLE "public"."clinic_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."clinic_settings" TO "service_role";



GRANT ALL ON TABLE "public"."clinical_records" TO "anon";
GRANT ALL ON TABLE "public"."clinical_records" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_records" TO "service_role";



GRANT ALL ON TABLE "public"."consent_tokens" TO "anon";
GRANT ALL ON TABLE "public"."consent_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."financial_categories" TO "anon";
GRANT ALL ON TABLE "public"."financial_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_categories" TO "service_role";



GRANT ALL ON TABLE "public"."financial_commissions" TO "anon";
GRANT ALL ON TABLE "public"."financial_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_commissions" TO "service_role";



GRANT ALL ON TABLE "public"."financial_payables" TO "anon";
GRANT ALL ON TABLE "public"."financial_payables" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_payables" TO "service_role";



GRANT ALL ON TABLE "public"."form_templates" TO "anon";
GRANT ALL ON TABLE "public"."form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."message_logs" TO "anon";
GRANT ALL ON TABLE "public"."message_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."message_logs" TO "service_role";



GRANT ALL ON TABLE "public"."message_templates" TO "anon";
GRANT ALL ON TABLE "public"."message_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."message_templates" TO "service_role";



GRANT ALL ON TABLE "public"."patient_assessments" TO "anon";
GRANT ALL ON TABLE "public"."patient_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."patient_records" TO "anon";
GRANT ALL ON TABLE "public"."patient_records" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_records" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."payment_method_fees" TO "anon";
GRANT ALL ON TABLE "public"."payment_method_fees" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_method_fees" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."professional_availability" TO "anon";
GRANT ALL ON TABLE "public"."professional_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_availability" TO "service_role";



GRANT ALL ON TABLE "public"."professional_commission_rules" TO "anon";
GRANT ALL ON TABLE "public"."professional_commission_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_commission_rules" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."report_templates" TO "anon";
GRANT ALL ON TABLE "public"."report_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."report_templates" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."service_professionals" TO "anon";
GRANT ALL ON TABLE "public"."service_professionals" TO "authenticated";
GRANT ALL ON TABLE "public"."service_professionals" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_template_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_template_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_template_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








-- SAAS TABLES DEFINITION

CREATE TABLE IF NOT EXISTS "public"."plan_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "max_professionals" integer DEFAULT 1,
    "max_locations" integer DEFAULT 1,
    "price_monthly" numeric(10,2),
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "slug" "text",
    "owner_id" "uuid",
    "plan_config_id" "uuid" REFERENCES public.plan_configs(id),
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add Foreign Key to Profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_organization_id_fkey') THEN
        ALTER TABLE "public"."profiles" 
        ADD CONSTRAINT "profiles_organization_id_fkey" 
        FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");
    END IF;
END $$;

-- Insert Default Plan and One Organization (for migration)
INSERT INTO public.plan_configs (id, name, max_professionals, price_monthly)
VALUES ('00000000-0000-0000-0000-000000000001', 'Pro', 10, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organizations (id, name, slug, plan_config_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Minha Clínica', 'minha-clinica', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
-- RESTORE FORM TEMPLATES 
