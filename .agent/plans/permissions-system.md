# Plano de Implementação: Sistema de Permissões Granulares

## Objetivo
Implementar um sistema completo de permissões com controle de:
1. **Ações** (Visualizar, Inserir, Alterar, Excluir) por módulo
2. **Visibilidade de Menus** (Sidebar e Topbar)

## Estrutura do Banco de Dados

### 1. Tabela `permissions` (Nova)
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'create', 'update', 'delete', 'menu_visible'
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module, action)
);
```

### 2. Módulos e Ações

#### Agenda
- `schedule.view` - Visualizar agenda
- `schedule.create` - Criar agendamentos
- `schedule.update` - Alterar agendamentos
- `schedule.delete` - Excluir agendamentos
- `schedule.block` - Criar bloqueios de grade
- `schedule.fit_in` - Agendamentos de encaixe
- `schedule.menu_visible` - Menu visível

#### Financeiro
- `financial.view` - Visualizar financeiro
- `financial.create` - Criar lançamentos
- `financial.update` - Alterar lançamentos
- `financial.delete` - Excluir lançamentos
- `financial.cash_flow` - Acesso a Fluxo de Caixa/Extrato
- `financial.accounts` - Acesso a Contas a Pagar/Receber
- `financial.discounts` - Aplicar descontos
- `financial.menu_visible` - Menu visível
- `financial.overview_menu` - Submenu Visão Geral
- `financial.dre_menu` - Submenu DRE Gerencial
- `financial.pricing_menu` - Submenu Tabela de Preços
- `financial.products_menu` - Submenu Produtos
- `financial.services_menu` - Submenu Serviços

#### Pacientes
- `patients.view` - Visualizar pacientes
- `patients.create` - Criar pacientes
- `patients.update` - Alterar pacientes
- `patients.delete` - Excluir pacientes
- `patients.records` - Acesso a Prontuário/Evoluções
- `patients.certificates` - Emitir atestados
- `patients.prescriptions` - Emitir receitas/prescrições
- `patients.files` - Gerenciar arquivos/imagens
- `patients.menu_visible` - Menu visível

#### Estoque/Produtos
- `inventory.view` - Visualizar estoque
- `inventory.create` - Criar produtos
- `inventory.update` - Alterar produtos
- `inventory.delete` - Excluir produtos
- `inventory.movements` - Entrada/Saída de estoque
- `inventory.kits` - Gerenciar kits de produtos
- `inventory.menu_visible` - Menu visível

#### Outros Menus
- `dashboard.menu_visible` - Tela Inicial
- `campaigns.menu_visible` - Campanhas
- `my_billing.menu_visible` - Meu Faturamento
- `forms.menu_visible` - Formulários
- `reminders.menu_visible` - Lembretes

#### Configurações
- `settings.professionals_menu` - Gestão de Profissionais
- `settings.forms_menu` - Gestão de Formulários
- `settings.questionnaires_menu` - Gestão de Questionários
- `settings.locations_menu` - Gestão de Locais
- `settings.whatsapp_menu` - Comunicação WhatsApp
- `settings.reports_menu` - Modelos de Relatório
- `settings.system_menu` - Configurações de Sistema
- `settings.migration_menu` - Assistente de Migração

## Implementação

### Fase 1: Backend (Actions e Hooks)
1. Criar migration para tabela `permissions`
2. Criar seed com permissões padrão para cada role
3. Criar action `getPermissions(roleId)` 
4. Criar hook `usePermissions()` para uso client-side
5. Criar helper `can(action, module)` para verificação

### Fase 2: Componentes de UI
1. Criar `PermissionsMatrix` component para admin
2. Atualizar página de roles para incluir matriz
3. Criar `ProtectedAction` wrapper para botões
4. Criar `ProtectedMenu` wrapper para itens de menu

### Fase 3: Aplicação nas Rotas
1. Atualizar Sidebar para filtrar menus
2. Atualizar Topbar dropdowns para filtrar
3. Adicionar verificações em botões de ação
4. Adicionar middleware de rota (opcional)

### Fase 4: Testes
1. Testar com role Admin (tudo habilitado)
2. Testar com role Professional (limitado)
3. Testar com role Receptionist (mais limitado)

## Permissões Padrão Sugeridas

### Admin/Master
- Todas as permissões habilitadas

### Professional
- ✅ Agenda (view, create, update, fit_in)
- ✅ Pacientes (view, create, update, records, certificates, prescriptions, files)
- ✅ Meu Faturamento (view)
- ✅ Formulários (view, create, update)
- ❌ Financeiro (apenas view do próprio)
- ❌ Configurações (nenhuma)
- ❌ Campanhas
- ❌ Estoque

### Receptionist
- ✅ Agenda (view, create, update, block)
- ✅ Pacientes (view, create, update, files)
- ✅ Financeiro (view, create, accounts)
- ❌ Prontuário/Evoluções
- ❌ Atestados/Receitas
- ❌ Configurações
- ❌ Campanhas
- ❌ Meu Faturamento

## Arquivos a Criar/Modificar

### Novos Arquivos
- `/src/lib/permissions/index.ts` - Core logic
- `/src/hooks/use-permissions.ts` - React hook
- `/src/components/permissions/PermissionsMatrix.tsx` - UI
- `/src/components/permissions/ProtectedAction.tsx` - Wrapper
- `/src/components/permissions/ProtectedMenu.tsx` - Wrapper
- `/migrations/XXXXXX_create_permissions.sql` - Migration
- `/seeds/permissions_seed.sql` - Seed data

### Arquivos a Modificar
- `/src/components/dashboard/Sidebar.tsx` - Filtrar menus
- `/src/components/dashboard/Topbar.tsx` - Filtrar dropdowns
- `/src/app/dashboard/settings/roles/page.tsx` - Adicionar matriz
- Todos os botões de ação (Edit, Delete, etc.)

## Próximos Passos
1. Revisar e aprovar este plano
2. Criar migration e seed
3. Implementar backend (actions + hooks)
4. Implementar UI components
5. Aplicar nas rotas e componentes
6. Testar com diferentes roles
