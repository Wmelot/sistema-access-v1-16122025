import { getPaymentFees } from "./actions"
import { FeesTab } from "./fees-tab"
import { OverviewTab } from "./overview-tab"
import { TransactionsTab } from "./transactions-tab"
import { PayrollTab } from "./payroll-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function FinancialPage() {
    const feesData = await getPaymentFees()

    return (
        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>

            <Tabs defaultValue="overview" className="space-y-6">

                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                    <TabsTrigger value="payroll">Profissionais (Folha)</TabsTrigger>
                    <TabsTrigger value="fees">Taxas e Tarifas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab />
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
            </Tabs>
        </div>
    )
}
