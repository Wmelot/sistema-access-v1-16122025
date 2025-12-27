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
        .eq('role_id', profile?.role_id?.id || profile?.role_id)

    const permissionCodes = permissions?.map((p: any) => p.permissions?.code) || []

    // Determine View Mode
    const canViewClinic = permissionCodes.includes('financial.view_clinic') || profile?.role === 'admin' || profile?.role === 'master'

    // Determine Default Tab from URL or Role
    const defaultTab = (resolvedSearchParams.tab as string) || (canViewClinic ? "overview" : "my_statement")

    // Pre-fetch data for Master View (Optimize: Only if canViewClinic)
    let feesData: any[] = [], payablesData: any[] = [], categories: any[] = []
    if (canViewClinic) {
        feesData = await getPaymentFees()
        payablesData = await getPayables()
        categories = await getFinancialCategories()
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                {canViewClinic && <AccountingExportButton />}
            </div>

            <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-6">

                <TabsList className="w-full justify-start overflow-x-auto h-auto flex-nowrap py-1">
                    {canViewClinic && (
                        <>
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
                            <TabsTrigger value="transactions">Transações</TabsTrigger>
                            <TabsTrigger value="payroll">Folha de Pagamento</TabsTrigger>
                            <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
                            <TabsTrigger value="fees">Taxas</TabsTrigger>
                        </>
                    )}
                    {/* Everyone (or Pro) sees 'Minha Produção' */}
                    <TabsTrigger value="my_statement">Minha Produção</TabsTrigger>
                </TabsList>

                {canViewClinic && (
                    <>
                        <TabsContent value="overview">
                            <OverviewTab />
                        </TabsContent>

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

