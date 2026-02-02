require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('ERRO: Variáveis de ambiente faltando.');
    console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetUser() {
    const email = 'wmelot@gmail.com';
    console.log(`Tentando resetar usuário: ${email}...`);

    // 1. Encontrar Usuário pelo Email
    // Nota: Admin API lista usuários sem RLS
    const { data: { users }, error: findError } = await supabase.auth.admin.listUsers();

    if (findError) {
        console.error('Erro ao listar usuários:', findError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('ERRO CRÍTICO: Usuário wmelot@gmail.com NÃO ENCONTRADO no Auth!');
        console.log('Criando usuário agora...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'Axiom@2026',
            email_confirm: true,
            user_metadata: { full_name: 'Warley Melo' }
        });

        if (createError) {
            console.error('Falha ao criar usuário:', createError);
        } else {
            console.log('SUCESSO: Usuário criado com senha Axiom@2026');
        }
        return;
    }

    console.log(`Usuário encontrado: ${user.id}`);

    // 2. Forçar atualização de senha e confirmação
    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
            password: 'Axiom@2026',
            email_confirm: true,
            user_metadata: { full_name: 'Warley Melo' } // Atualiza metadados para garantir
        }
    );

    if (error) {
        console.error('ERRO ao atualizar senha:', error);
    } else {
        console.log('---------------------------------------------------');
        console.log('SUCESSO ABSOLUTO!');
        console.log('Senha definida para: Axiom@2026');
        console.log('E-mail confirmado automaticamente via API de Admin.');
        console.log('Pode logar agora.');
        console.log('---------------------------------------------------');
    }
}

resetUser();
