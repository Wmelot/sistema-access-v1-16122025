"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useParams, useSearchParams } from "next/navigation"

interface FinancialNavigationProps {
    canViewClinic: boolean
    canViewTransparency: boolean
    defaultTab: string
}

export function FinancialNavigation({ canViewClinic, canViewTransparency, defaultTab }: FinancialNavigationProps) {
    const router = useRouter()
    const { slug } = useParams()
    const searchParams = useSearchParams()

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.push(`/dashboard/${slug}/financial?${params.toString()}`)
    }

    const tabs = [
        ...(canViewClinic || canViewTransparency ? [{ value: 'overview', label: 'Visão Geral' }] : []),
        ...(canViewClinic ? [
            { value: 'payables', label: 'Contas a Pagar' },
            { value: 'transactions', label: 'Transações' },
            { value: 'payroll', label: 'Folha de Pagamento' },
            { value: 'reconciliation', label: 'Conciliação' },
            { value: 'fees', label: 'Taxas' },
        ] : []),
        { value: 'my_statement', label: 'Minha Produção' }
    ]

    const currentTabLabel = tabs.find(t => t.value === defaultTab)?.label || 'Selecionar Aba'

    return (
        <div className="md:hidden w-full mb-4">
            <Select value={defaultTab} onValueChange={handleTabChange}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-12 text-lg font-semibold shadow-sm rounded-xl">
                    <SelectValue placeholder={currentTabLabel} />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={8} className="z-[100]">
                    {tabs.map((tab) => (
                        <SelectItem key={tab.value} value={tab.value} className="py-3 text-base">
                            {tab.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
