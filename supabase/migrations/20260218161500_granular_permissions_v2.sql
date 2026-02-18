-- Add granular permissions for Management Hub and Sidebar
INSERT INTO public.permissions (code, description, module) VALUES
    -- SIDEBAR
    ('sidebar.home.view', 'Menu: Tela Inicial', 'Navegação'),
    ('sidebar.schedule.view', 'Menu: Agenda', 'Navegação'),
    ('sidebar.patients.view', 'Menu: Pacientes', 'Navegação'),
    ('sidebar.financial.view', 'Menu: Finanças', 'Navegação'),
    ('sidebar.whatsapp.view', 'Menu: WhatsApp', 'Navegação'),
    ('sidebar.auditor.view', 'Menu: Auditor PBE', 'Navegação'),
    ('sidebar.management.view', 'Menu: Configurações Gerais', 'Navegação'),
    
    -- MANAGEMENT CARDS
    ('settings.professionals.view', 'Config: Gestão de Profissionais', 'Gestão'),
    ('settings.locations.view', 'Config: Gestão de Locais', 'Gestão'),
    ('settings.services.view', 'Config: Gestão de Serviços', 'Gestão'),
    ('settings.forms.view', 'Config: Formulários de Avaliação', 'Gestão'),
    ('settings.questionnaires.view', 'Config: Questionários', 'Gestão'),
    ('settings.prices.view', 'Config: Tabela de Preços', 'Gestão'),
    ('settings.dre.view', 'Config: DRE (Financeiro)', 'Gestão'),
    ('settings.products.view', 'Config: Gestão de Estoque', 'Gestão'),
    ('settings.marketplace.view', 'Config: Loja de Recursos', 'Gestão'),
    ('settings.marketing.view', 'Config: Marketing', 'Gestão'),
    ('settings.communication.view', 'Config: Comunicação (WhatsApp)', 'Gestão'),
    ('settings.identity.view', 'Config: Identidade da Clínica', 'Gestão'),
    ('settings.documents.view', 'Config: Documentos e Atestados', 'Gestão'),
    ('settings.intelligence.view', 'Config: Protocolos & IA', 'Gestão'),
    ('settings.users.view', 'Config: Controle de Usuários', 'Gestão'),
    ('settings.roles.view', 'Config: Perfis de Acesso', 'Gestão'),
    ('settings.audit.view', 'Config: Auditoria (LGPD)', 'Gestão'),
    ('settings.migration.view', 'Config: Assistente de Migração', 'Gestão'),
    ('settings.support.view', 'Config: Saúde e Suporte', 'Gestão'),
    
    -- FINANCIAL TABS
    ('financial.tabs.my_statement', 'Financeiro: Aba Meu Extrato', 'Financeiro'),
    ('financial.tabs.general_statement', 'Financeiro: Aba Extrato Geral', 'Financeiro'),
    ('financial.tabs.cash_flow', 'Financeiro: Aba Fluxo de Caixa', 'Financeiro'),
    ('financial.tabs.dre', 'Financeiro: Aba DRE', 'Financeiro'),
    ('financial.tabs.settings', 'Financeiro: Aba Configurações', 'Financeiro')
ON CONFLICT (code) DO UPDATE SET 
    module = EXCLUDED.module,
    description = EXCLUDED.description;

-- Ensure Administrador and Master roles have all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('Administrador', 'Master')
ON CONFLICT DO NOTHING;
