-- 1. UNIFICAR PREÇOS (O Grande Reset)
DO $$
DECLARE
    target_id UUID;
BEGIN
    -- Vamos garantir que "Particular (Padrão)" seja a tabela oficial
    -- Se ela não existir, criamos. Se existir, pegamos o ID.
    INSERT INTO public.price_tables (name, active)
    VALUES ('Particular (Padrão)', true)
    ON CONFLICT (name) DO UPDATE SET active = true
    RETURNING id INTO target_id;

    -- Mover TODOS os pacientes do sistema para essa tabela oficial
    UPDATE public.patients SET price_table_id = target_id;

    -- Mover TODOS os itens de preço para essa tabela oficial (se houver)
    UPDATE public.price_table_items SET price_table_id = target_id;

    -- AGORA SIM: Apagar qualquer outra tabela que NÃO seja a oficial
    DELETE FROM public.price_tables WHERE id != target_id;
END $$;

-- 2. ACORDAR O SUPABASE (Cache de Endereço)
-- Forçar uma alteração inofensiva na coluna address para o sistema "ver" que ela existe
COMMENT ON COLUMN public.patients.address IS 'Address Fix Reloaded';
NOTIFY pgrst, 'reload config';