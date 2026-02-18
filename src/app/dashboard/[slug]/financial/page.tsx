import { getPaymentFees, getCardBrands, getOrganizationPaymentSettings, getPayables, getFinancialCategories } from "./actions"
import { FeesTab } from "./fees-tab"
import { OverviewTab } from "./overview-tab"
import { TransactionsTab } from "./transactions-tab"
import { PayablesTab } from "./payables-tab"
import { PayrollTab } from "./payroll-tab"
import { OverdueTab } from "./overdue-tab"
import { MyStatementTab } from "./my-statement-tab"
import ReconciliationPage from "./reconciliation/page"
import DREPage from "./dre/page"
import { AccountingExportButton } from "./accounting-export-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FinancialNavigation } from "./navigation"
import { LayoutDashboard, Wallet, History, AlertCircle, Users, Handshake, Percent, FileText } from "lucide-react"

export default async function FinancialPage({
    params,
    searchParams
}: {
    params: { slug: string },
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug } = params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const resolvedSearchParams = await searchParams

    if (!user) {
        redirect('/login')
    }

    // Role & Permissions Check
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    // Fetch permissions
    const { data: permissions } = await supabase
        .from('role_permissions')
        .select('permissions(code)')
        .eq('role_id', (profile as any)?.role_id?.id || (profile as any)?.role_id)

    const permissionCodes = permissions?.map((p: any) => p.permissions?.code as string) || []

    const hasP = (code: string) => permissionCodes.includes(code) || profile?.role === 'master' || (profile?.roles as any)?.name === 'Master'

    // Determine View Mode
    const canViewClinic = hasP('financial.view_clinic')
    const canViewTransparency = hasP('financial.transparency_view')

    // Granular Tab Permissions
    const canViewOverview = hasP('financial.tabs.general_statement')
    const canViewDRE = hasP('financial.tabs.dre')
    const canViewPayables = hasP('financial.tabs.cash_flow')
    const canViewTransactions = hasP('financial.tabs.cash_flow')
    const canViewOverdue = hasP('financial.tabs.general_statement')
    const canViewPayroll = hasP('financial.tabs.general_statement')
    const canViewFees = hasP('financial.tabs.settings')
    const canViewReconciliation = hasP('financial.tabs.general_statement')
    const canViewMyStatement = hasP('financial.tabs.my_statement')

    // Determine Default Tab from URL or Permissions
    const defaultTab = (resolvedSearchParams.tab as string) ||
        (canViewOverview ? "overview" :
            canViewMyStatement ? "my_statement" :
                canViewDRE ? "dre" : "my_statement")

    // Pre-fetch data for Clinical View if permitted
    let feesData: any[] = [], cardBrandsData: any[] = [], paymentSettingsData: any = { max_installments: 12 }, payablesData: any[] = [], categories: any[] = []
    if (canViewClinic || canViewFees || canViewPayables) {
        if (canViewFees) {
            feesData = await getPaymentFees()
            cardBrandsData = await getCardBrands()
            paymentSettingsData = await getOrganizationPaymentSettings() || { max_installments: 12 }
        }
        if (canViewPayables) {
            payablesData = await getPayables()
            categories = await getFinancialCategories()
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                {canViewClinic && (
                    <div className="w-full md:w-auto">
                        <AccountingExportButton />
                    </div>
                )}
            </div>

            <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-6">
                <FinancialNavigation
                    canViewClinic={canViewClinic}
                    canViewTransparency={canViewTransparency}
                    defaultTab={defaultTab}
                />

                {canViewOverview && (
                    <TabsContent value="overview">
                        <OverviewTab />
                    </TabsContent>
                )}

                {canViewDRE && (
                    <TabsContent value="dre">
                        <DREPage />
                    </TabsContent>
                )}

                {canViewPayables && (
                    <TabsContent value="payables">
                        <PayablesTab initialPayables={payablesData} categories={categories} />
                    </TabsContent>
                )}

                {canViewTransactions && (
                    <TabsContent value="transactions">
                        <TransactionsTab />
                    </TabsContent>
                )}

                {canViewOverdue && (
                    <TabsContent value="overdue">
                        <OverdueTab slug={slug} />
                    </TabsContent>
                )}

                {canViewPayroll && (
                    <TabsContent value="payroll">
                        <PayrollTab />
                    </TabsContent>
                )}

                {canViewFees && (
                    <TabsContent value="fees">
                        <FeesTab
                            fees={feesData || []}
                            cardBrands={cardBrandsData || []}
                            paymentSettings={paymentSettingsData}
                        />
                    </TabsContent>
                )}

                {canViewReconciliation && (
                    <TabsContent value="reconciliation">
                        <ReconciliationPage />
                    </TabsContent>
                )}

                {canViewMyStatement && (
                    <TabsContent value="my_statement">
                        <MyStatementTab />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

