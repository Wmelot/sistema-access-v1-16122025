
-- PASSO 1: APENAS CONSERTAR A TABELA
-- Vamos separar o conserto da inserção.
-- Se der erro depois, esse conserto AQUI fica salvo.

BEGIN;

-- 1. Arranca a regra velha (que aponta para 'users' fake)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Cria a regra nova (que aponta para 'auth.users' real)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

COMMIT;

-- 3. Confere se agora aponta para o schema 'auth'
SELECT 
    constraint_name, 
    table_name, 
    foreign_table_schema, 
    foreign_table_name 
FROM information_schema.constraint_column_usage 
WHERE constraint_name = 'profiles_id_fkey';
