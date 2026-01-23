
'use client'

import { useEffect, useState } from "react"
import { WidgetID, WIDGET_REGISTRY } from "./registry"
import { DashboardMetrics } from "../../actions"
import { ManageWidgetsDialog } from "./manage-widgets-dialog"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"

// Widgets Imports (Will be implemented next)
import { BirthdaysWidget } from "./birthdays-widget"
import { MyFinanceWidget } from "./my-finance-widget"
import { PayablesWidget } from "./payables-widget"
import { DemographicsWidget } from "./demographics-widget"
import { YearlyComparisonWidget } from "./yearly-comparison-widget"
import { CategoriesWidget } from "./categories-widget"
import { SoccerNewsWidget } from "./soccer-news-widget"
import { FinancialMarketWidget } from "./financial-market-widget"
import { GoogleReviewsWidget } from "./google-reviews-widget"
import { PedroEvidenceWidget } from "./pedro-evidence-widget"

interface WidgetGridProps {
    metrics: DashboardMetrics
    userRole?: string | null
    permissions?: string[]
    professionals?: any[]
    currentUser?: any
    slug: string // [NEW] Tenant Isolation
}

export function WidgetGrid({ metrics, userRole, permissions = [], professionals = [], currentUser, slug }: WidgetGridProps) {
    const [enabledWidgets, setEnabledWidgets] = useState<WidgetID[]>([])
    const [mounted, setMounted] = useState(false)

    // Load preferences with Tenant Isolation
    useEffect(() => {
        setMounted(true)
        const storageKey = `dashboard_widgets_${slug}` // Unique key per tenant
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                setEnabledWidgets(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse widget prefs", e)
                loadDefaults()
            }
        } else {
            loadDefaults()
        }
    }, [slug]) // Re-load if slug changes

    const loadDefaults = () => {
        // Filter by permissions first
        const defaults = WIDGET_REGISTRY
            .filter(w => isAllowed(w))
            .filter(w => w.defaultEnabled)
            .map(w => w.id)
        setEnabledWidgets(defaults)
        save(defaults)
    }

    const save = (ids: WidgetID[]) => {
        const storageKey = `dashboard_widgets_${slug}`
        localStorage.setItem(storageKey, JSON.stringify(ids))
    }

    const toggleWidget = (id: WidgetID, enabled: boolean) => {
        const next = enabled
            ? [...enabledWidgets, id]
            : enabledWidgets.filter(w => w !== id)

        setEnabledWidgets(next)
        save(next)
    }

    const isAllowed = (w: typeof WIDGET_REGISTRY[0]) => {
        // Check strict permission if present
        if (w.permission && !permissions.includes(w.permission)) return false
        // Check role (simplified logic, usually covered by permission but just in case)
        if (w.minRole === 'master' && !permissions.includes('roles.manage')) return false // Proxy
        return true
    }

    if (!mounted) return <div className="p-10">Carregando painel...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Visão Geral</h2>
                <ManageWidgetsDialog
                    allWidgets={WIDGET_REGISTRY.filter(w => isAllowed(w))}
                    enabledWidgets={enabledWidgets}
                    onToggle={toggleWidget}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-3 lg:gap-4">
                {enabledWidgets.includes('birthdays') && (
                    <div className={getColSpan('birthdays')}>
                        <BirthdaysWidget data={metrics.birthdays} />
                    </div>
                )}
                {enabledWidgets.includes('financial_my_production') && (
                    <div className={getColSpan('financial_my_production')}>
                        <MyFinanceWidget data={metrics.my_finance} />
                    </div>
                )}
                {enabledWidgets.includes('financial_payables') && metrics.financials && (
                    <div className={getColSpan('financial_payables')}>
                        <PayablesWidget data={metrics.financials} />
                    </div>
                )}
                {enabledWidgets.includes('chart_demographics') && (
                    <div className={getColSpan('chart_demographics')}>
                        <DemographicsWidget data={metrics.demographics} />
                    </div>
                )}
                {enabledWidgets.includes('chart_yearly') && (
                    <div className={getColSpan('chart_yearly')}>
                        <YearlyComparisonWidget
                            data={metrics.yearly_comparison}
                            professionals={professionals}
                            permissions={permissions}
                            currentUser={currentUser} // [NEW]
                        />
                    </div>
                )}
                {enabledWidgets.includes('chart_categories') && (
                    <div className={getColSpan('chart_categories')}>
                        <CategoriesWidget data={metrics.categories} />
                    </div>
                )}
                {enabledWidgets.includes('soccer_news') && (
                    <div className={getColSpan('soccer_news')}>
                        <SoccerNewsWidget slug={slug} />
                    </div>
                )}
                {enabledWidgets.includes('financial_market') && (
                    <div className={getColSpan('financial_market')}>
                        <div className="h-[350px]">
                            <FinancialMarketWidget />
                        </div>
                    </div>
                )}
                {enabledWidgets.includes('google_reviews') && (
                    <div className={getColSpan('google_reviews')}>
                        <GoogleReviewsWidget />
                    </div>
                )}
                {enabledWidgets.includes('pedro_evidence') && (
                    <div className={getColSpan('pedro_evidence')}>
                        <div className="h-[430px]">
                            <PedroEvidenceWidget />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function getColSpan(id: WidgetID) {
    const w = WIDGET_REGISTRY.find(x => x.id === id)
    const span = w?.colSpan || 1
    if (span === 2) return "md:col-span-2"
    if (span === 3) return "md:col-span-3"
    return "md:col-span-1"
}
