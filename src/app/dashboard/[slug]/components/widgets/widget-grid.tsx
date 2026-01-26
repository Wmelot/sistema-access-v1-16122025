
'use client'

import { useEffect, useState } from "react"
import { WidgetID, WIDGET_REGISTRY } from "./registry"
import { DashboardMetrics, updateDashboardWidgets, updateDashboardSettings } from "../../actions"
import { ManageWidgetsDialog } from "./manage-widgets-dialog"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
import { SortableWidget } from "./sortable-widget"

// DND Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

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
    const [isEditingLayout, setIsEditingLayout] = useState(false)
    const [widgetSettings, setWidgetSettings] = useState<Record<string, any>>({})
    const [mounted, setMounted] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags on clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load preferences with Database Sync + Tenant/User Isolation
    useEffect(() => {
        if (!slug) return
        setMounted(true)

        // 1. Load Settings (Internal Configs)
        if (currentUser?.dashboard_settings) {
            setWidgetSettings(currentUser.dashboard_settings)
        }

        // 2. Load Enabled State
        if (currentUser?.dashboard_widgets && Array.isArray(currentUser.dashboard_widgets) && currentUser.dashboard_widgets.length > 0) {
            setEnabledWidgets(currentUser.dashboard_widgets as WidgetID[])
            return
        }

        // 3. Fallback to LocalStorage (Migration / Legacy)
        const userId = currentUser?.id || 'anon'
        const storageKey = `dashboard_widgets_${slug.toLowerCase()}_${userId}`

        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setEnabledWidgets(parsed)
                    // Optional: Push to DB if it was only local
                    if (currentUser?.id) {
                        updateDashboardWidgets(parsed)
                    }
                    return
                }
            } catch (e) {
                console.error("Failed to parse widget prefs", e)
            }
        }

        // 4. System Defaults
        loadDefaults()
    }, [slug, currentUser?.id, currentUser?.dashboard_widgets, currentUser?.dashboard_settings]) // Re-load if context changes

    const updateSingleWidgetSetting = (id: string, key: string, value: any) => {
        const next = {
            ...widgetSettings,
            [id]: {
                ...(widgetSettings[id] || {}),
                [key]: value
            }
        }
        setWidgetSettings(next)
        if (currentUser?.id) {
            updateDashboardSettings(next)
        }
    }

    const loadDefaults = () => {
        // Filter by permissions first
        const defaults = WIDGET_REGISTRY
            .filter(w => isAllowed(w))
            .filter(w => w.defaultEnabled)
            .map(w => w.id)

        setEnabledWidgets(defaults)

        // Only save if we have a valid context
        if (slug) {
            const userId = currentUser?.id || 'anon'
            const storageKey = `dashboard_widgets_${slug.toLowerCase()}_${userId}`
            localStorage.setItem(storageKey, JSON.stringify(defaults))

            if (currentUser?.id) {
                updateDashboardWidgets(defaults)
            }
        }
    }

    const save = (ids: WidgetID[]) => {
        if (!slug) return

        // Save to LocalStorage (as cache/fallback)
        const userId = currentUser?.id || 'anon'
        const storageKey = `dashboard_widgets_${slug.toLowerCase()}_${userId}`
        localStorage.setItem(storageKey, JSON.stringify(ids))

        // Save to Database (Permanent)
        if (currentUser?.id) {
            updateDashboardWidgets(ids)
        }
    }

    const toggleWidget = (id: WidgetID, enabled: boolean) => {
        const next = enabled
            ? [...enabledWidgets, id]
            : enabledWidgets.filter(w => w !== id)

        setEnabledWidgets(next)
        save(next)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = enabledWidgets.indexOf(active.id as WidgetID);
            const newIndex = enabledWidgets.indexOf(over.id as WidgetID);

            const next = arrayMove(enabledWidgets, oldIndex, newIndex);
            setEnabledWidgets(next);
            save(next);
        }
    };

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
                <h2 className="text-lg font-medium text-zinc-900">Dashboard</h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isEditingLayout ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setIsEditingLayout(!isEditingLayout)}
                        className={isEditingLayout ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : ""}
                    >
                        <Settings2 className="w-4 h-4 mr-2" />
                        {isEditingLayout ? "Finalizar Ordem" : "Ajustar Layout"}
                    </Button>
                    <ManageWidgetsDialog
                        allWidgets={WIDGET_REGISTRY.filter(w => isAllowed(w))}
                        enabledWidgets={enabledWidgets}
                        onToggle={(id, e) => {
                            const next = e
                                ? [...enabledWidgets, id]
                                : enabledWidgets.filter(w => w !== id)
                            setEnabledWidgets(next)
                            save(next)
                        }}
                    />
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToWindowEdges]}
            >
                <SortableContext
                    items={enabledWidgets}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        {enabledWidgets.map((id) => {
                            const w = WIDGET_REGISTRY.find(x => x.id === id);
                            if (!w) return null;

                            return (
                                <SortableWidget
                                    key={id}
                                    id={id}
                                    isEditing={isEditingLayout}
                                    className={cn("flex flex-col", getColSpan(id))}
                                >
                                    <WidgetRenderer
                                        id={id}
                                        metrics={metrics}
                                        professionals={professionals}
                                        permissions={permissions}
                                        currentUser={currentUser}
                                        slug={slug}
                                        widgetSettings={widgetSettings}
                                        updateSingleWidgetSetting={updateSingleWidgetSetting}
                                    />
                                </SortableWidget>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
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

interface WidgetRendererProps {
    id: WidgetID
    metrics: DashboardMetrics
    professionals: any[]
    permissions: string[]
    currentUser: any
    slug: string
    widgetSettings: any
    updateSingleWidgetSetting: (id: string, key: string, value: any) => void
}

function WidgetRenderer({ id, metrics, professionals, permissions, currentUser, slug, widgetSettings, updateSingleWidgetSetting }: WidgetRendererProps) {
    switch (id) {
        case 'birthdays': return <BirthdaysWidget data={metrics.birthdays} />
        case 'financial_my_production': return <MyFinanceWidget data={metrics.my_finance} />
        case 'financial_payables': return metrics.financials ? <PayablesWidget data={metrics.financials} /> : null
        case 'chart_demographics': return <DemographicsWidget data={metrics.demographics} />
        case 'chart_yearly': return (
            <YearlyComparisonWidget
                data={metrics.yearly_comparison}
                professionals={professionals}
                permissions={permissions}
                currentUser={currentUser}
            />
        )
        case 'chart_categories': return <CategoriesWidget data={metrics.categories} />
        case 'soccer_news': return (
            <SoccerNewsWidget
                slug={slug}
                initialTeam={widgetSettings.soccer_news?.team}
                onTeamChange={(team: string) => updateSingleWidgetSetting('soccer_news', 'team', team)}
            />
        )
        case 'financial_market': return (
            <div className="h-full min-h-[350px]">
                <FinancialMarketWidget
                    settings={widgetSettings.financial_market?.config}
                    onSettingsChange={(s) => updateSingleWidgetSetting('financial_market', 'config', s)}
                />
            </div>
        )
        case 'google_reviews': return <GoogleReviewsWidget />
        case 'pedro_evidence': return <div className="h-full min-h-[430px]"><PedroEvidenceWidget /></div>
        default: return null
    }
}
