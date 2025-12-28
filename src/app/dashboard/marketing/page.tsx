import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Megaphone, Plus, Send, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getCampaigns } from "./actions"

export default async function MarketingPage() {
    const campaigns = await getCampaigns()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campanhas e Disparos</h1>
                    <p className="text-muted-foreground">
                        Gerencie listas de transmissão e envio de mensagens em massa.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/dashboard/marketing/billing">
                            <Send className="h-4 w-4" />
                            Cobrança Mensal
                        </Link>
                    </Button>
                    <Button className="gap-2" asChild>
                        <Link href="/dashboard/marketing/new">
                            <Plus className="h-4 w-4" />
                            Nova Campanha
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Stats Cards (Future) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns ? campaigns.reduce((acc: any, c: any) => acc + (c.sent_count || 0), 0) : 0}</div>
                        <p className="text-xs text-muted-foreground">Mensagens entregues</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns ? campaigns.filter((c: any) => c.status === 'sending').length : 0}</div>
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
                                            <Link href={`/dashboard/marketing/${campaign.id}`}>
                                                Detalhes
                                            </Link>
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
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/marketing/new">Criar Primeira Campanha</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
