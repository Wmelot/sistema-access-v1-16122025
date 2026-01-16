
-- PASSO 2: INSERIR O USUÁRIO (O conserto funcionou!)
-- O erro anterior foi só no relatório final. A tabela já está corrigida.
-- Agora o banco VAI aceitar a inserção.

INSERT INTO public.profiles (
    id, 
    email, 
    organization_id, 
    role, 
    full_name
)
VALUES (
    '980eac8e-a581-438e-b35c-b95f51761c5d', 
    'wmelot@gmail.com', 
    '00000000-0000-0000-0000-000000000001', 
    'admin',
    'Warley Admin (Fixed)'
)
ON CONFLICT (id) DO UPDATE
SET 
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin';

-- Verificação final (simples)
SELECT email, role, organization_id FROM public.profiles WHERE id = '980eac8e-a581-438e-b35c-b95f51761c5d';
