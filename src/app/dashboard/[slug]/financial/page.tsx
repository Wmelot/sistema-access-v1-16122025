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

    // Determine View Mode
    const canViewClinic = permissionCodes.includes('financial.view_clinic') || profile?.role === 'admin' || profile?.role === 'master'
    const canViewTransparency = permissionCodes.includes('financial.transparency_view');

    // Determine Default Tab from URL or Role
    const defaultTab = (resolvedSearchParams.tab as string) || (canViewClinic || canViewTransparency ? "overview" : "my_statement")

    // Pre-fetch data for Master View (Optimize: Only if canViewClinic)
    let feesData: any[] = [], cardBrandsData: any[] = [], paymentSettingsData: any = { max_installments: 12 }, payablesData: any[] = [], categories: any[] = []
    if (canViewClinic) {
        feesData = await getPaymentFees()
        cardBrandsData = await getCardBrands()
        paymentSettingsData = await getOrganizationPaymentSettings() || { max_installments: 12 }
        payablesData = await getPayables()
        categories = await getFinancialCategories()
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

                {/* Desktop TabsList moved to FinancialNavigation for loader support */}

                {(canViewClinic || canViewTransparency) && (
                    <>
                        <TabsContent value="overview">
                            <OverviewTab />
                        </TabsContent>

                        <TabsContent value="dre">
                            <DREPage />
                        </TabsContent>
                    </>
                )}

                {canViewClinic && (
                    <>
                        <TabsContent value="payables">
                            <PayablesTab initialPayables={payablesData} categories={categories} />
                        </TabsContent>

                        <TabsContent value="transactions">
                            <TransactionsTab />
                        </TabsContent>

                        <TabsContent value="overdue">
                            <OverdueTab slug={slug} />
                        </TabsContent>

                        <TabsContent value="payroll">
                            <PayrollTab />
                        </TabsContent>

                        <TabsContent value="fees">
                            <FeesTab
                                fees={feesData || []}
                                cardBrands={cardBrandsData || []}
                                paymentSettings={paymentSettingsData}
                            />
                        </TabsContent>

                        <TabsContent value="reconciliation">
                            <ReconciliationPage />
                        </TabsContent>
                    </>
                )}

                <TabsContent value="my_statement">
                    <MyStatementTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

