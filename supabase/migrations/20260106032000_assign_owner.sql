UPDATE public.form_templates SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE title IN ('Palmilha Biomecânica 2.0', 'Avaliação Clínica PBE');
