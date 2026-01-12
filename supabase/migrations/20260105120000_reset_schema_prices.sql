-- 1. RESET DA COLUNA DE ENDEREÇO (Para destravar o Cache)
-- Removemos e recriamos para garantir que o Supabase "perceba" a mudança
ALTER TABLE public.patients DROP COLUMN IF EXISTS address;
ALTER TABLE public.patients ADD COLUMN address jsonb DEFAULT '{}'::jsonb;

-- 2. RESET TOTAL DAS TABELAS DE PREÇO
-- Removemos o vinculo dos pacientes atuais (para não dar erro)
UPDATE public.patients SET price_table_id = NULL;

-- Limpamos TUDO de preços (Itens e Tabelas)
DELETE FROM public.price_table_items;
DELETE FROM public.price_tables;

-- Criamos UMA ÚNICA tabela oficial
INSERT INTO public.price_tables (name, active) 
VALUES ('Particular (Padrão)', true);

-- Re-vinculamos os pacientes existentes a essa nova tabela
DO $$
DECLARE
    new_price_id UUID;
BEGIN
    SELECT id INTO new_price_id FROM public.price_tables LIMIT 1;
    UPDATE public.patients SET price_table_id = new_price_id;
END $$;

-- 3. FORÇAR RECARREGAMENTO (Grito final)
NOTIFY pgrst, 'reload config';