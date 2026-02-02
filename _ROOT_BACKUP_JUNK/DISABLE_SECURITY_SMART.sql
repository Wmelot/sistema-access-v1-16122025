
-- DISABLE SECURITY SMART (Modo Nuclear Inteligente)
-- O script anterior falhou porque tentei adivinhar nomes de tabelas.
-- Este script é mais esperto: Ele olha o que existe e destranca.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Para cada tabela que existe no esquema 'public'...
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- ... Execute o comando de destrancar.
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Liberar permissões gerais
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Verificação final
SELECT count(*) as tabelas_destrancadas FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
