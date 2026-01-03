
# Manual de Deploy - Sistema Access (Atualização Crítica)

Este guia descreve os passos necessários para implantar as correções recentes (Google Reviews Widget e Active Attendance) em produção.

## 1. Atualizar Código (Deploy)
Certifique-se de que o código local está commitado e envie para o seu repositório remoto (ex: GitHub/GitLab). Se você usa Vercel/Netlify com deploy automático, isso iniciará o processo.

```bash
# Conferir status
git status

# Enviar alterações (se já não tiver feito)
git push origin main
```

## 2. Atualização Obrigatória do Banco de Dados (Supabase)
**ATENÇÃO:** O novo botão de "Iniciar Atendimento" depende de uma estrutura nova no banco de dados. Você **PRECISA** executar o SQL abaixo no seu projeto de Produção do Supabase.

1.  Acesse o painel do [Supabase](https://supabase.com/dashboard).
2.  Vá em **SQL Editor**.
3.  Clique em **+ New Query**.
4.  Cole o código abaixo e clique em **Run**.

```sql
-- 1. Remove função obsoleta (se existir) para evitar conflitos
DROP FUNCTION IF EXISTS get_patient_active_appointment(uuid);

-- 2. Cria a View de Segurança para Atendimentos Ativos
-- Isso permite buscar agendamentos 'in_progress' de um paciente de forma segura e eficiente
CREATE OR REPLACE VIEW patient_active_appointments_view AS
SELECT 
    a.id,
    a.patient_id,
    a.status,
    a.start_time,
    a.created_at,
    p.name as patient_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE 
    a.status IN ('checked_in', 'in_progress', 'attended')
    AND a.start_time >= (now() - interval '24 hours');

-- 3. Permissões de Acesso
GRANT SELECT ON patient_active_appointments_view TO authenticated;
GRANT SELECT ON patient_active_appointments_view TO service_role;
```

## 3. Verificação de Variáveis de Ambiente
Como corrigimos o Widget do Google, verifique se a Variável de Ambiente `GOOGLE_PLACES_API_KEY` está configurada corretamente no seu ambiente de produção (Vercel/Netlify settings).

*   Se você **não mudou** a chave (apenas alterou as restrições no painel do Google), **não precisa fazer nada** aqui.
*   Se você gerou uma **nova chave**, lembre-se de atualizar na Vercel/Netlify e redeployar.

## 4. Teste Pós-Deploy
Após o deploy finalizar:
1.  Abra o sistema em produção.
2.  Verifique o **Widget Google Meu Negócio** (Deve carregar as estrelas).
3.  Vá em um Paciente e clique em **Iniciar Atendimento**. (Se o SQL do passo 2 não tiver sido rodado, isso pode falhar).
