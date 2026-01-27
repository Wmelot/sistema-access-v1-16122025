import { getPaymentFees, getPayables, getFinancialCategories } from "./actions"
import { FeesTab } from "./fees-tab"
import { OverviewTab } from "./overview-tab"
import { TransactionsTab } from "./transactions-tab"
import { PayablesTab } from "./payables-tab"
import { PayrollTab } from "./payroll-tab"
import { MyStatementTab } from "./my-statement-tab"
import ReconciliationPage from "./reconciliation/page"
import { AccountingExportButton } from "./accounting-export-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FinancialNavigation } from "./navigation"

export default async function FinancialPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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
    let feesData: any[] = [], payablesData: any[] = [], categories: any[] = []
    if (canViewClinic) {
        feesData = await getPaymentFees()
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

            <FinancialNavigation
                canViewClinic={canViewClinic}
                canViewTransparency={canViewTransparency}
                defaultTab={defaultTab}
            />

            <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-6">

                <TabsList className="hidden md:flex w-full justify-start overflow-x-auto h-auto flex-nowrap py-1.5 px-1 bg-muted/50 rounded-lg scrollbar-hide">
                    {(canViewClinic || canViewTransparency) && (
                        <TabsTrigger value="overview" className="shrink-0">Visão Geral</TabsTrigger>
                    )}

                    {canViewClinic && (
                        <>
                            <TabsTrigger value="payables" className="shrink-0">Contas a Pagar</TabsTrigger>
                            <TabsTrigger value="transactions" className="shrink-0">Transações</TabsTrigger>
                            <TabsTrigger value="payroll" className="shrink-0">Folha de Pagamento</TabsTrigger>
                            <TabsTrigger value="reconciliation" className="shrink-0">Conciliação</TabsTrigger>
                            <TabsTrigger value="fees" className="shrink-0">Taxas</TabsTrigger>
                        </>
                    )}
                    {/* Everyone (or Pro) sees 'Minha Produção' */}
                    <TabsTrigger value="my_statement" className="shrink-0">Minha Produção</TabsTrigger>
                </TabsList>

                {(canViewClinic || canViewTransparency) && (
                    <TabsContent value="overview">
                        <OverviewTab />
                    </TabsContent>
                )}

                {canViewClinic && (
                    <>
                        <TabsContent value="payables">
                            <PayablesTab initialPayables={payablesData} categories={categories} />
                        </TabsContent>

                        <TabsContent value="transactions">
                            <TransactionsTab />
                        </TabsContent>

                        <TabsContent value="payroll">
                            <PayrollTab />
                        </TabsContent>

                        <TabsContent value="fees">
                            <FeesTab fees={feesData || []} />
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

