# 📋 LISTA DE TAREFAS FUTURAS - SISTEMA AXIOM

**Data de Criação**: 20/01/2026  
**Prioridade**: Alta  
**Status**: Planejamento

---

## 🔐 SEGURANÇA E AUTENTICAÇÃO

### 1. **OAuth / Social Login** 🔴 ALTA PRIORIDADE

**Objetivo**: Permitir login com Google, Apple, etc.

**Benefícios**:
- ✅ Validação automática de email
- ✅ Melhor experiência do usuário
- ✅ Reduz emails falsos/inventados
- ✅ Aumenta taxa de conversão

**Implementação**:
```typescript
// Providers a adicionar:
- Google OAuth
- Apple Sign In
- Microsoft Azure AD (opcional para empresas)
```

**Passos**:
1. [ ] Configurar Google OAuth no Supabase
2. [ ] Configurar Apple Sign In no Supabase
3. [ ] Atualizar página de signup com botões sociais
4. [ ] Atualizar página de login com botões sociais
5. [ ] Testar fluxo completo de OAuth
6. [ ] Documentar processo

**Referências**:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-apple

---

### 2. **Validação de Email** 🟡 MÉDIA PRIORIDADE

**Objetivo**: Confirmar que o email é válido antes de ativar a conta

**Implementação Atual**:
- ❌ Não há validação de email
- ❌ Usuário pode inventar qualquer email

**Solução**:
1. [ ] Ativar email confirmation no Supabase Auth
2. [ ] Criar template de email de confirmação
3. [ ] Criar página de "Confirme seu email"
4. [ ] Bloquear acesso ao dashboard até confirmação
5. [ ] Adicionar botão "Reenviar email de confirmação"

**Configuração Supabase**:
```sql
-- No Supabase Dashboard > Authentication > Email Templates
-- Ativar: "Confirm signup"
```

---

## 🏢 GESTÃO DE ORGANIZAÇÕES E PLANOS

### 3. **Sistema de Planos e Limites** 🔴 ALTA PRIORIDADE

**Objetivo**: Controlar recursos disponíveis por plano

**Planos Propostos**:

| Plano | Preço | Pacientes | Profissionais | Storage | Recursos |
|-------|-------|-----------|---------------|---------|----------|
| **Free** | R$ 0 | 10 | 1 | 100MB | Básico |
| **Starter** | R$ 99/mês | 100 | 3 | 1GB | + Relatórios |
| **Professional** | R$ 299/mês | 500 | 10 | 5GB | + IA + Integrações |
| **Enterprise** | R$ 799/mês | Ilimitado | Ilimitado | 50GB | Tudo + Suporte |

**Implementação**:
1. [ ] Criar tabela `plan_limits` com limites por plano
2. [ ] Criar middleware para checar limites
3. [ ] Bloquear ações quando limite atingido
4. [ ] Criar página de upgrade de plano
5. [ ] Integrar com gateway de pagamento (Stripe/Asaas)
6. [ ] Criar dashboard de uso para o usuário

**Exemplo de Limite**:
```typescript
// Antes de criar paciente:
const { count } = await supabase
  .from('patients')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', orgId)

const limit = await getPlanLimit(orgId, 'max_patients')
if (count >= limit) {
  throw new Error('Limite de pacientes atingido. Faça upgrade!')
}
```

---

### 4. **Painel Master de Controle** 🟡 MÉDIA PRIORIDADE

**Objetivo**: Você (Warley) poder gerenciar TODAS as organizações

**Funcionalidades**:
- [ ] Ver lista de todas as organizações
- [ ] Ver plano de cada organização
- [ ] Alterar plano de qualquer organização
- [ ] Ativar/Desativar organizações
- [ ] Ver estatísticas de uso
- [ ] Acessar qualquer organização (como admin)
- [ ] Enviar mensagens para organizações

**Rota**: `/master/organizations`

**Permissão**: Apenas usuários com `role = 'master'`

---

## 🔒 SEGURANÇA E ISOLAMENTO DE DADOS

### 5. **Auditoria de RLS (Row Level Security)** 🔴 ALTA PRIORIDADE

**Objetivo**: Garantir que NENHUM usuário vê dados de outra organização

**Checklist**:
- [ ] Verificar RLS em TODAS as tabelas
- [ ] Testar com usuário de teste
- [ ] Criar testes automatizados de isolamento
- [ ] Documentar políticas RLS

**Script de Teste**:
```sql
-- Ver arquivo: VERIFY_RLS_POLICIES.sql
```

---

### 6. **Logs de Auditoria** 🟢 BAIXA PRIORIDADE

**Objetivo**: Rastrear todas as ações importantes

**Eventos a Logar**:
- [ ] Login/Logout
- [ ] Criação de usuário
- [ ] Alteração de plano
- [ ] Acesso a dados sensíveis
- [ ] Exclusão de dados

---

## 📱 MELHORIAS DE UX

### 7. **Onboarding Guiado** 🟡 MÉDIA PRIORIDADE

**Objetivo**: Guiar novo usuário pelos primeiros passos

**Passos do Onboarding**:
1. [ ] Bem-vindo! Configure seu perfil
2. [ ] Adicione seu primeiro profissional
3. [ ] Crie seu primeiro serviço
4. [ ] Configure sua agenda
5. [ ] Cadastre seu primeiro paciente

**Ferramenta**: Usar biblioteca como `react-joyride`

---

### 8. **Tour Interativo** 🟢 BAIXA PRIORIDADE

**Objetivo**: Mostrar recursos do sistema

- [ ] Tour do dashboard
- [ ] Tour da agenda
- [ ] Tour de avaliações
- [ ] Tour de relatórios

---

## 💳 PAGAMENTOS E FATURAMENTO

### 9. **Integração com Gateway de Pagamento** 🟡 MÉDIA PRIORIDADE

**Opções**:
- **Stripe** (Internacional)
- **Asaas** (Brasil) - Já tem credenciais no .env
- **Mercado Pago** (Brasil)

**Funcionalidades**:
- [ ] Checkout de planos
- [ ] Assinatura recorrente
- [ ] Cancelamento de assinatura
- [ ] Upgrade/Downgrade de plano
- [ ] Histórico de pagamentos
- [ ] Emissão de notas fiscais

---

## 📊 ANALYTICS E MÉTRICAS

### 10. **Dashboard de Métricas** 🟢 BAIXA PRIORIDADE

**Métricas para Você (Master)**:
- Total de organizações
- Total de usuários
- Receita mensal recorrente (MRR)
- Taxa de conversão Free → Paid
- Taxa de churn
- Organizações mais ativas

**Métricas para Clientes**:
- Pacientes atendidos
- Receita mensal
- Taxa de ocupação da agenda
- Pacientes novos vs recorrentes

---

## 🚀 PERFORMANCE

### 11. **Otimizações** 🟢 BAIXA PRIORIDADE

- [ ] Implementar cache com Redis
- [ ] Otimizar queries pesadas
- [ ] Lazy loading de componentes
- [ ] CDN para assets estáticos
- [ ] Compressão de imagens

---

## 📝 DOCUMENTAÇÃO

### 12. **Documentação Completa** 🟡 MÉDIA PRIORIDADE

- [ ] Documentação de API
- [ ] Guia do usuário
- [ ] Vídeos tutoriais
- [ ] FAQ
- [ ] Base de conhecimento

---

## 🔔 NOTIFICAÇÕES

### 13. **Sistema de Notificações** 🟡 MÉDIA PRIORIDADE

- [ ] Notificações in-app
- [ ] Notificações por email
- [ ] Notificações por WhatsApp (já tem integração)
- [ ] Notificações push (mobile)

---

## 📱 MOBILE

### 14. **App Mobile** 🟢 BAIXA PRIORIDADE (FUTURO)

- [ ] React Native app
- [ ] Ou Progressive Web App (PWA)
- [ ] Publicar na App Store
- [ ] Publicar na Play Store

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Esta Semana**:
1. ✅ Implementar signup seguro com isolamento (FEITO)
2. [ ] Testar signup com usuário real
3. [ ] Verificar RLS em todas as tabelas
4. [ ] Criar script de teste de isolamento

### **Próxima Semana**:
1. [ ] Implementar OAuth (Google)
2. [ ] Ativar validação de email
3. [ ] Criar sistema de limites por plano

### **Este Mês**:
1. [ ] Painel Master de controle
2. [ ] Integração com pagamento
3. [ ] Sistema de upgrade de planos

---

**Última Atualização**: 20/01/2026  
**Responsável**: Warley de Melo Oliveira  
**Desenvolvedor**: Antigravity AI Assistant
