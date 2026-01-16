
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
