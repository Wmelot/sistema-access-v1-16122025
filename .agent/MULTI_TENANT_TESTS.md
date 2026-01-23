# 🧪 Guia de Testes Multi-Tenant

## Objetivo
Validar que o sistema está 100% pronto para multi-tenant, garantindo isolamento total de dados entre organizações.

---

## ✅ PRÉ-REQUISITOS

Antes de começar os testes, certifique-se de que:

- [x] Migration SQL executada (`.agent/multi-tenant-migration.sql`)
- [x] Relatório de integridade mostra 0 registros sem `organization_id`
- [ ] RLS habilitado (`.agent/enable-rls-policies.sql`) - **EXECUTAR AGORA**
- [ ] Segunda organização criada para testes

---

## 📝 TESTE 1: Retomar Atendimento (Erro Original)

### Objetivo
Verificar se o erro original foi resolvido.

### Passos
1. Acesse o dashboard
2. Vá para a página de pacientes
3. Clique em "Retomar Atendimento" no paciente "Test Final"
4. **Resultado Esperado**: Página de atendimento carrega sem erros

### ✅ Critério de Sucesso
- Nenhum erro no console
- Página carrega completamente
- Dados do paciente aparecem corretamente

### Status: ⏳ PENDENTE

---

## 📝 TESTE 2: Criar Segunda Organização

### Objetivo
Ter uma segunda organização para testar isolamento de dados.

### Passos (SQL)
```sql
-- Criar segunda organização
INSERT INTO organizations (name, slug, settings)
VALUES (
    'Clínica Teste',
    'clinica-teste',
    '{}'::jsonb
)
RETURNING id, name, slug;

-- Anotar o ID retornado: _________________
```

### Passos (Criar Usuário)
```sql
-- Criar usuário de teste (substitua o email)
-- Primeiro, crie o usuário no Supabase Auth Dashboard
-- Depois, crie o perfil:

INSERT INTO profiles (
    id, -- UUID do usuário criado no Auth
    organization_id, -- ID da Clínica Teste
    email,
    full_name,
    role
) VALUES (
    'UUID_DO_USUARIO', -- Substituir
    'ID_DA_CLINICA_TESTE', -- Substituir
    'teste@clinica.com',
    'Usuário Teste',
    'admin'
);
```

### Status: ⏳ PENDENTE

---

## 📝 TESTE 3: Isolamento de Pacientes

### Objetivo
Verificar que usuários de organizações diferentes não veem pacientes uns dos outros.

### Passos
1. **Como usuário da Access Fisioterapia**:
   - Acesse `/dashboard/access-fisioterapia/patients`
   - Anote quantos pacientes aparecem: _______
   - Anote o nome de 1 paciente: _______

2. **Como usuário da Clínica Teste**:
   - Acesse `/dashboard/clinica-teste/patients`
   - Verifique que a lista está vazia OU só mostra pacientes da Clínica Teste
   - **NÃO deve aparecer** o paciente da Access Fisioterapia

3. **Criar paciente na Clínica Teste**:
   - Crie um novo paciente
   - Verifique que ele aparece na lista da Clínica Teste
   - Volte para Access Fisioterapia
   - Verifique que o novo paciente **NÃO aparece**

### ✅ Critério de Sucesso
- Pacientes da Access não aparecem na Clínica Teste
- Pacientes da Clínica Teste não aparecem na Access
- Cada organização vê apenas seus próprios pacientes

### Status: ⏳ PENDENTE

---

## 📝 TESTE 4: Isolamento de Appointments

### Objetivo
Verificar que appointments são isolados por organização.

### Passos
1. **Como usuário da Access Fisioterapia**:
   - Acesse a agenda
   - Anote quantos appointments aparecem: _______

2. **Como usuário da Clínica Teste**:
   - Acesse a agenda
   - Verifique que está vazia OU só mostra appointments da Clínica Teste
   - **NÃO deve aparecer** appointments da Access

3. **Criar appointment na Clínica Teste**:
   - Crie um novo appointment
   - Verifique que aparece na agenda da Clínica Teste
   - Volte para Access Fisioterapia
   - Verifique que o novo appointment **NÃO aparece**

### ✅ Critério de Sucesso
- Appointments são completamente isolados
- Nenhum vazamento de dados entre organizações

### Status: ⏳ PENDENTE

---

## 📝 TESTE 5: Isolamento de Avaliações

### Objetivo
Verificar que avaliações são isoladas por organização.

### Passos
1. **Na Clínica Teste**:
   - Crie um paciente
   - Crie uma avaliação para esse paciente
   - Verifique que a avaliação aparece

2. **Na Access Fisioterapia**:
   - Acesse a lista de avaliações
   - Verifique que a avaliação da Clínica Teste **NÃO aparece**

3. **Verificar no Banco**:
```sql
-- Verificar organization_id da avaliação
SELECT id, patient_id, organization_id, type, created_at
FROM patient_assessments
ORDER BY created_at DESC
LIMIT 5;
```

### ✅ Critério de Sucesso
- Avaliação tem `organization_id` correto
- Avaliação não aparece em outra organização

### Status: ⏳ PENDENTE

---

## 📝 TESTE 6: Isolamento de Produtos

### Objetivo
Verificar que produtos são isolados por organização.

### Passos
1. **Na Access Fisioterapia**:
   - Crie um produto "Produto Access"
   - Verifique que aparece na lista

2. **Na Clínica Teste**:
   - Acesse a lista de produtos
   - Verifique que "Produto Access" **NÃO aparece**
   - Crie um produto "Produto Teste"

3. **Voltar para Access**:
   - Verifique que "Produto Teste" **NÃO aparece**

### ✅ Critério de Sucesso
- Produtos são completamente isolados
- Cada organização vê apenas seus produtos

### Status: ⏳ PENDENTE

---

## 📝 TESTE 7: Isolamento de Serviços

### Objetivo
Verificar que serviços são isolados por organização.

### Passos
1. **Na Access Fisioterapia**:
   - Anote quantos serviços existem: _______

2. **Na Clínica Teste**:
   - Verifique que a lista está vazia OU só mostra serviços da Clínica Teste
   - Crie um serviço "Consulta Teste"

3. **Voltar para Access**:
   - Verifique que "Consulta Teste" **NÃO aparece**

### ✅ Critério de Sucesso
- Serviços são isolados por organização

### Status: ⏳ PENDENTE

---

## 📝 TESTE 8: Impersonação de Master Admin

### Objetivo
Verificar que Master Admin pode acessar diferentes organizações.

### Passos
1. **Como Master Admin**:
   - Acesse `/dashboard/access-fisioterapia`
   - Verifique que a barra de impersonação aparece
   - Verifique que é **AZUL** (organização principal)

2. **Acessar Clínica Teste**:
   - Acesse `/dashboard/clinica-teste`
   - Verifique que a barra de impersonação aparece
   - Verifique que é **AMARELA PULSANTE** (outra organização)
   - Verifique que mostra "ATENÇÃO: Navegando em Outra Clínica"

3. **Voltar ao Master**:
   - Clique em "Voltar ao Painel Master"
   - Verifique que retorna para `/master`

### ✅ Critério de Sucesso
- Barra de impersonação funciona corretamente
- Cores diferentes para organizações diferentes
- Botão de voltar funciona

### Status: ⏳ PENDENTE

---

## 📝 TESTE 9: Tentativa de Acesso Direto (Segurança)

### Objetivo
Verificar que usuários não podem acessar dados de outras organizações via URL direta.

### Passos
1. **Como usuário da Clínica Teste**:
   - Anote o ID de um paciente da Access: _______
   - Tente acessar: `/dashboard/clinica-teste/patients/[ID_DO_PACIENTE_ACCESS]`
   - **Resultado Esperado**: Erro 404 ou "Paciente não encontrado"

2. **Tentar acessar via slug errado**:
   - Tente acessar: `/dashboard/access-fisioterapia/patients`
   - **Resultado Esperado**: Redirecionamento ou erro de permissão

### ✅ Critério de Sucesso
- Usuários não conseguem acessar dados de outras organizações
- RLS bloqueia acesso mesmo com URL direta

### Status: ⏳ PENDENTE

---

## 📝 TESTE 10: Performance com Múltiplas Organizações

### Objetivo
Verificar que o sistema mantém boa performance com múltiplas organizações.

### Passos
1. **Medir tempo de carregamento**:
   - Access Fisioterapia - Lista de pacientes: _______ ms
   - Clínica Teste - Lista de pacientes: _______ ms

2. **Verificar queries no console**:
   - Abrir DevTools → Network
   - Verificar que queries incluem filtro por `organization_id`

3. **Verificar índices no banco**:
```sql
-- Verificar índices existentes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE '%org%'
ORDER BY tablename, indexname;
```

### ✅ Critério de Sucesso
- Tempo de carregamento < 1 segundo
- Queries otimizadas com índices
- Sem queries full-table scan

### Status: ⏳ PENDENTE

---

## 📊 RESUMO DOS TESTES

| # | Teste | Status | Notas |
|---|-------|--------|-------|
| 1 | Retomar Atendimento | ⏳ | |
| 2 | Criar Segunda Org | ⏳ | |
| 3 | Isolamento Pacientes | ⏳ | |
| 4 | Isolamento Appointments | ⏳ | |
| 5 | Isolamento Avaliações | ⏳ | |
| 6 | Isolamento Produtos | ⏳ | |
| 7 | Isolamento Serviços | ⏳ | |
| 8 | Impersonação Master | ⏳ | |
| 9 | Segurança URL Direta | ⏳ | |
| 10 | Performance | ⏳ | |

---

## ✅ CRITÉRIOS PARA APROVAÇÃO FINAL

Para considerar o sistema **PRONTO PARA VENDA**, todos os testes devem:

- ✅ Passar sem erros
- ✅ Demonstrar isolamento 100% de dados
- ✅ Manter performance aceitável
- ✅ Bloquear acessos não autorizados

---

## 🚨 SE ALGUM TESTE FALHAR

1. Anote o teste que falhou
2. Anote o comportamento observado
3. Tire screenshot se possível
4. Reporte para correção imediata

---

## 📝 CHECKLIST FINAL

Antes de marcar como "PRONTO PARA VENDA":

- [ ] Todos os 10 testes passaram
- [ ] RLS habilitado e testado
- [ ] Performance aceitável
- [ ] Documentação atualizada
- [ ] Backup do banco realizado
- [ ] Plano de rollback preparado

---

## 🎯 PRÓXIMO PASSO

**AGORA**: Teste o erro original (Teste 1)
- Atualize a página
- Tente retomar o atendimento
- Verifique se funciona sem erros

Se funcionar, podemos prosseguir com os outros testes! 🚀
