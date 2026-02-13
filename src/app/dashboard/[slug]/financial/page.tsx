import { getPaymentFees, getCardBrands, getOrganizationPaymentSettings, getPayables, getFinancialCategories } from "./actions"
import { FeesTab } from "./fees-tab"
import { OverviewTab } from "./overview-tab"
import { TransactionsTab } from "./transactions-tab"
import { PayablesTab } from "./payables-tab"
import { PayrollTab } from "./payroll-tab"
import { OverdueTab } from "./overdue-tab"
import { MyStatementTab } from "./my-statement-tab"
import ReconciliationPage from "./reconciliation/page"
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

            <FinancialNavigation
                canViewClinic={canViewClinic}
                canViewTransparency={canViewTransparency}
                defaultTab={defaultTab}
            />

            <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-6">

                <TabsList className="hidden md:inline-flex h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    {(canViewClinic || canViewTransparency) && (
                        <TabsTrigger
                            value="overview"
                            className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                     data-[state=active]:text-primary data-[state=active]:shadow-md
                                     hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                        >
                            <LayoutDashboard className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                            Visão Geral
                        </TabsTrigger>
                    )}

                    {canViewClinic && (
                        <>
                            <TabsTrigger
                                value="payables"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Wallet className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Contas a Pagar
                            </TabsTrigger>
                            <TabsTrigger
                                value="transactions"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <History className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Transações
                            </TabsTrigger>
                            <TabsTrigger
                                value="overdue"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <AlertCircle className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Inadimplência
                            </TabsTrigger>
                            <TabsTrigger
                                value="payroll"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Users className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Folha de Pagamento
                            </TabsTrigger>
                            <TabsTrigger
                                value="reconciliation"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Handshake className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Conciliação
                            </TabsTrigger>
                            <TabsTrigger
                                value="fees"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Percent className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Taxas
                            </TabsTrigger>
                        </>
                    )}
                    {/* Everyone (or Pro) sees 'Minha Produção' */}
                    <TabsTrigger
                        value="my_statement"
                        className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                 data-[state=active]:text-primary data-[state=active]:shadow-md
                                 hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                    >
                        <FileText className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                        Minha Produção
                    </TabsTrigger>
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

