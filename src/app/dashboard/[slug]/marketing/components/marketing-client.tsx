'use client'

import { useState } from "react"
import { Plus, Send, Megaphone, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { ManagementHeader } from "@/components/dashboard/management-header"
import { NewCampaignWizard } from "./new-campaign-wizard"
import { useRouter } from "next/navigation"

interface MarketingClientProps {
    slug: string;
    campaigns: any[];
}

export function MarketingClient({ slug, campaigns }: MarketingClientProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const { isCollapsed } = useSidebar()
    const router = useRouter()

    const handleSuccess = () => {
        setIsCreateOpen(false)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Campanhas e Disparos"
                description="Gerencie listas de transmissão e envio de mensagens em massa."
            >
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    modal={false}
                >
                    <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Nova Campanha
                    </Button>
                    <DialogContent
                        overlayClassName="hidden"
                        className={cn(
                            "fixed z-40 transition-all duration-300 ease-in-out",
                            "top-[84px] bottom-6 right-6",
                            "!translate-x-0 !translate-y-0",
                            "!w-auto !max-w-none h-auto overflow-y-auto shadow-2xl border-2 border-slate-200 bg-white",
                            isCollapsed
                                ? "left-[84px]"
                                : "left-[274px]"
                        )}
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">Nova Campanha</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium italic">
                                Siga os passos abaixo para configurar seu envio em massa.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            <NewCampaignWizard
                                onSuccess={handleSuccess}
                                onCancel={() => setIsCreateOpen(false)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </ManagementHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns ? campaigns.reduce((acc: any, c: any) => acc + (c.sent_count || 0), 0) : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Mensagens entregues</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns ? campaigns.filter((c: any) => c.status === 'sending').length : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Em processamento</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Campanhas</CardTitle>
                    <CardDescription>
                        Acompanhe o status dos seus envios recentes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {campaigns && campaigns.length > 0 ? (
                        <div className="space-y-4">
                            {campaigns.map((campaign: any) => (
                                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="grid gap-1">
                                        <div className="font-semibold">{campaign.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            Criado em {format(new Date(campaign.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {campaign.sent_count} enviados / {campaign.total_messages} total
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant={
                                                campaign.status === 'completed' ? 'default' :
                                                    campaign.status === 'sending' ? 'secondary' :
                                                        campaign.status === 'failed' ? 'destructive' : 'outline'
                                            }
                                        >
                                            {campaign.status === 'draft' && 'Rascunho'}
                                            {campaign.status === 'sending' && 'Enviando...'}
                                            {campaign.status === 'completed' && 'Concluído'}
                                            {campaign.status === 'failed' && 'Erro'}
                                        </Badge>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`/dashboard/${slug}/marketing/${campaign.id}`}>
                                                Detalhes
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">Nenhuma campanha criada</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Comece importando uma lista de contatos para enviar mensagens.
                            </p>
                            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                                Criar Primeira Campanha
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
