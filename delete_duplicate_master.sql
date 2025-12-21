-- Deletar usuário 'Usuário Master'
-- CUIDADO: Isso apaga o registro da tabela profiles. 
-- Se houver relacionamentos (agendamentos, etc), pode dar erro se não houver CASCADE.
-- Como é um usuário de teste, geralmente é seguro.

DELETE FROM public.profiles 
WHERE full_name ILIKE 'Usuário Master';
