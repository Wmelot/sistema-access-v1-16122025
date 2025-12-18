
import {
    Cake,
    Wallet,
    BarChart3,
    PieChart,
    Users,
    MessageCircle,
    Newspaper,
    TrendingUp
} from "lucide-react"

export type WidgetID =
    | 'birthdays'
    | 'financial_my_production'
    | 'financial_payables'
    | 'chart_demographics'
    | 'chart_yearly'
    | 'chart_categories'
    | 'google_reviews'
    | 'soccer_news'
    | 'financial_market'

export interface WidgetDefinition {
    id: WidgetID
    title: string
    description: string
    icon: any
    defaultEnabled: boolean
    minRole?: 'master' | 'partner' | 'all'
    permission?: string // specific permission code check
    colSpan?: 1 | 2 | 3 // Grid columns (default 1)
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
    {
        id: 'birthdays',
        title: 'Aniversariantes',
        description: 'Aniversariantes do dia e da semana.',
        icon: Cake,
        defaultEnabled: true,
        colSpan: 1
    },
    {
        id: 'financial_my_production',
        title: 'Minha Produção',
        description: 'Resumo rápido do seu faturamento.',
        icon: Wallet,
        defaultEnabled: true,
        colSpan: 1
    },
    {
        id: 'financial_payables',
        title: 'Contas a Pagar',
        description: 'Resumo de despesas pendentes da clínica.',
        icon: Wallet,
        defaultEnabled: true,
        minRole: 'partner',
        permission: 'financial.view_clinic',
        colSpan: 1
    },
    {
        id: 'chart_demographics',
        title: 'Público (Demografia)',
        description: 'Gráfico de atendimentos por gênero e idade.',
        icon: Users,
        defaultEnabled: true,
        colSpan: 1
    },
    {
        id: 'chart_yearly',
        title: 'Comparativo Anual',
        description: 'Atendimentos deste ano vs ano passado.',
        icon: BarChart3,
        defaultEnabled: true,
        colSpan: 2 // Wide
    },
    {
        id: 'chart_categories',
        title: 'Categorias',
        description: 'Atendimentos divididos por categoria.',
        icon: PieChart,
        defaultEnabled: true,
        colSpan: 1
    },
    {
        id: 'soccer_news',
        title: 'Notícias (GE)',
        description: 'Últimas notícias do futebol.',
        icon: Newspaper,
        defaultEnabled: true,
        colSpan: 1
    },
    {
        id: 'financial_market',
        title: 'Mercado Financeiro',
        description: 'Cotações e visão geral do mercado.',
        icon: TrendingUp,
        defaultEnabled: false,
        colSpan: 1
    },
    {
        id: 'google_reviews',
        title: 'Opiniões Google',
        description: 'Link direto para avaliações.',
        icon: MessageCircle,
        defaultEnabled: true,
        colSpan: 1
    }
]
