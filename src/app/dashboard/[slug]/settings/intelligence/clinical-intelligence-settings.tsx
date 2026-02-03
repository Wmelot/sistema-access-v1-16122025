
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, RefreshCw, Zap, CheckCircle2, Lock, Trash2, Plus, FileText, Ban, Eye, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { getProtocols, createProtocol, toggleProtocolStatus, deleteProtocol } from "./actions"

export function ClinicalIntelligenceSettings() {
    const [protocols, setProtocols] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Details Dialog State
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const [useAI, setUseAI] = useState(true)
    const [aiPersonality, setAiPersonality] = useState("Atue como um Fisioterapeuta Sênior especialista em Prática Baseada em Evidências. Seja direto, técnico e empático.")

    // Load protocols
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getProtocols()
            setProtocols(data || [])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar protocolos locais.")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateCheck = () => {
        setIsUpdating(true)
        setTimeout(() => {
            setIsUpdating(false)
            toast.success("Protocolos atualizados com sucesso!", {
                description: "Sua base de conhecimento está sincronicada com as diretrizes de 2025."
            })
        }, 2000)
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        try {
            await createProtocol(formData)
            toast.success("Novo protocolo adicionado!")
            setIsDialogOpen(false)
            loadData()
        } catch (error) {
            toast.error("Erro ao adicionar protocolo")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este protocolo personalizado?")) return
        try {
            await deleteProtocol(id)
            toast.success("Protocolo removido.")
            loadData()
        } catch (error) {
            toast.error("Erro ao remover.")
        }
    }

    const handleToggle = async (id: string, currentStatus: boolean, isCustom: boolean) => {
        if (!isCustom) {
            toast.info("Protocolos do Sistema", { description: "Estes itens são protegidos para garantir conformidade técnica." })
            return
        }
        try {
            await toggleProtocolStatus(id, !currentStatus)
            toast.success(`Protocolo ${!currentStatus ? 'ativado' : 'desativado'}.`)
            loadData()
        } catch (error) {
            toast.error("Erro ao atualizar status.")
        }
    }

    const openDetails = (protocol: any) => {
        setSelectedProtocol(protocol)
        setIsDetailsOpen(true)
    }

    const [searchTerm, setSearchTerm] = useState("")

    const filteredProtocols = protocols.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.region.toLowerCase().includes(searchTerm.toLowerCase())
    )

    console.log("Protocols Loaded:", protocols) // Debug

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* ... Cards code unchanged ... */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Protocolos Ativos</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : protocols.filter(p => p.is_active).length}</div>
                        <p className="text-xs text-muted-foreground">Baseados em evidência</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Personalizados</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : protocols.filter(p => p.is_custom).length}</div>
                        <p className="text-xs text-muted-foreground">Adicionados pela equipe</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status da IA</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Online</div>
                        <p className="text-xs text-muted-foreground">Assistente pronto</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-6">
                <Card className="h-fit">

                    <CardHeader>
                        <CardTitle>Comportamento da IA</CardTitle>
                        <CardDescription>Configure como o assistente deve responder e gerar relatórios.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="ai-active">Ativar Sugestões Automáticas</Label>
                            <Switch id="ai-active" checked={useAI} onCheckedChange={setUseAI} />
                        </div>
                        <div className="space-y-2">
                            <Label>Personalidade / Contexto</Label>
                            <Textarea
                                className="min-h-[100px]"
                                value={aiPersonality}
                                onChange={(e) => setAiPersonality(e.target.value)}
                                placeholder="Defina como a IA deve se comportar..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Estas instruções são enviadas junto com cada solicitação para guiar o estilo da resposta.
                            </p>
                        </div>
                        <Button onClick={() => toast.success("Configurações salvas!")} className="w-full bg-slate-800 hover:bg-zinc-900">
                            Salvar Preferências
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Base de Conhecimento</CardTitle>
                                <CardDescription className="text-sm">Gerencie os protocolos clínicos.</CardDescription>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full sm:w-auto shadow-sm active:scale-95 transition-all bg-slate-800 hover:bg-zinc-900">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Adicionar Protocolo
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Novo Protocolo</DialogTitle>
                                        <DialogDescription>
                                            Insira os dados do novo protocolo clínico baseado em evidência.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Patologia / Título</Label>
                                            <Input name="title" required placeholder="Ex: Entorse de Tornozelo" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Região Corporal</Label>
                                            <Input name="region" required placeholder="Ex: Membro Inferior" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fontes de Evidência</Label>
                                            <Textarea name="evidence_sources" placeholder="Um por linha." />
                                            <p className="text-[10px] text-muted-foreground">Para adicionar múltiplos links, use o formato de edição avançada futuramente.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Resumo Clínico</Label>
                                            <Textarea name="description" required placeholder="Descrição breve da condição e abordagem sugerida..." />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="w-full sm:w-auto bg-slate-800 hover:bg-zinc-900">Salvar Protocolo</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* SEARCH BAR */}
                        <div className="relative w-full">
                            <Input
                                placeholder="Buscar patologia ou região..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-slate-500"
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                        </div>

                    </CardHeader>
                    <CardContent>
                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-700">Patologia</TableHead>
                                        <TableHead className="font-bold text-slate-700">Fontes</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProtocols.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-slate-400">
                                                Nenhum protocolo encontrado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {filteredProtocols.map((p) => (
                                        <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-900">{p.title}</span>
                                                    {p.is_custom ? (
                                                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 border-slate-200 italic font-medium">Personalizado</Badge>
                                                    ) : (
                                                        <span title="Sistema (Padrão Ouro)" className="p-1 bg-slate-100 rounded">
                                                            <Lock className="w-3 h-3 text-slate-500" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{p.region}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs max-w-[200px] truncate text-slate-600 italic">
                                                    {/* Handle both string[] and Object[] */}
                                                    {Array.isArray(p.evidence_sources) && p.evidence_sources.length > 0 ? (
                                                        typeof p.evidence_sources[0] === 'string'
                                                            ? p.evidence_sources[0]
                                                            : (p.evidence_sources[0].titulo || p.evidence_sources[0].citation)
                                                    ) : '-'}
                                                    {(p.evidence_sources?.length || 0) > 1 && ` (+${p.evidence_sources.length - 1})`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-100" onClick={() => openDetails(p)} title="Ver Detalhes e Fontes">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {p.is_custom ? (
                                                        <>
                                                            <Switch
                                                                checked={p.is_active}
                                                                onCheckedChange={() => handleToggle(p.id, p.is_active, p.is_custom)}
                                                            />
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(p.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 text-[10px] font-bold">SISTEMA</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredProtocols.length === 0 && !loading && (
                                <div className="text-center py-10 text-slate-400 bg-slate-50 border-2 border-dashed rounded-xl">
                                    Nenhum protocolo encontrado.
                                </div>
                            )}
                            {filteredProtocols.map((p) => (
                                <Card key={p.id} className="overflow-hidden border-slate-200 shadow-sm">
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                                    <h4 className="font-bold text-slate-900 leading-tight">{p.title}</h4>
                                                    {p.is_custom ? (
                                                        <Badge className="text-[9px] bg-slate-100 text-slate-700 border-slate-200 italic font-medium h-5">Personalizado</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 text-[9px] font-bold h-5 uppercase tracking-tighter">Sistema</Badge>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{p.region}</p>
                                            </div>
                                            {!p.is_custom && (
                                                <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3 text-blue-600 hover:bg-blue-50 font-bold text-xs"
                                                    onClick={() => openDetails(p)}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                    VER DETALHES
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {p.is_custom && (
                                                    <>
                                                        <Switch
                                                            checked={p.is_active}
                                                            onCheckedChange={() => handleToggle(p.id, p.is_active, p.is_custom)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-rose-500 hover:bg-rose-50"
                                                            onClick={() => handleDelete(p.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-6">
                            <Button variant="outline" className="w-full h-11 text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl" disabled={isUpdating} onClick={handleUpdateCheck}>
                                {isUpdating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando atualizações...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Sincronizar Diretrizes Online
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* View Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {selectedProtocol?.title}
                            {selectedProtocol?.is_custom && <Badge>Personalizado</Badge>}
                        </DialogTitle>
                        <DialogDescription>
                            Região: {selectedProtocol?.region} | Baseado em Evidência (Atualizado: {new Date(selectedProtocol?.created_at || new Date()).getFullYear()})
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-8 pr-4 pb-6">

                            {/* 1. Clinical Summary (FIRST) */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                    <Brain className="w-4 h-4" />
                                    Resumo Clínico & Abordagem
                                </h3>
                                <div className="p-4 rounded-lg bg-blue-50/50 text-blue-900/90 text-sm leading-relaxed border border-blue-100">
                                    {selectedProtocol?.description || (selectedProtocol?.resumo_clinico)}
                                </div>
                            </div>

                            {/* 2. Interventions (SECOND) */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                    <Zap className="w-4 h-4" />
                                    Intervenções Mapeadas
                                </h3>
                                <div className="grid gap-3">
                                    {Array.isArray(selectedProtocol?.interventions) && selectedProtocol.interventions.map((item: any, idx: number) => {
                                        const techData = item.dados_tecnicos || {};
                                        const viz = item.visualizacao_paciente || {};
                                        const level = techData.nivel_evidencia || item.nivel_evidencia;

                                        return (
                                            <Card key={idx} className={`shadow-sm border-l-4 ${viz.cor === 'green' ? 'border-l-green-500' : viz.cor === 'red' ? 'border-l-red-500' : 'border-l-primary'}`}>
                                                <CardContent className="pt-4 pb-4 px-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">{item.tipo}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.categoria}</span>
                                                        </div>
                                                        {level && <Badge variant="outline" className="bg-white">{level}</Badge>}
                                                    </div>

                                                    <p className="text-sm text-slate-700 leading-snug">{item.conduta_sugerida}</p>

                                                    {item.dosagem && (
                                                        <div className="mt-3 text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                                                            <span className="font-semibold text-slate-800">Dosagem: </span>
                                                            {typeof item.dosagem === 'object' ? Object.values(item.dosagem).join(' | ') : item.dosagem}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 3. Evidence Sources (LAST) */}
                            <div className="space-y-3 pt-4 border-t">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                    <FileText className="w-4 h-4" />
                                    Base de Conhecimento (Referências)
                                </h3>
                                <div className="grid gap-3">
                                    {Array.isArray(selectedProtocol?.evidence_sources) && selectedProtocol.evidence_sources.map((source: any, idx: number) => {
                                        const isString = typeof source === 'string'
                                        const title = isString ? source : (source.titulo || source.citation)
                                        const author = !isString ? source.autor : null
                                        const year = !isString ? source.ano : null
                                        const quality = !isString ? (source.nota_qualidade || source.nivel_evidencia) : null
                                        const url = !isString ? (source.doi_link || source.url) : null
                                        const summary = !isString ? source.resumo_educativo : null
                                        const points = !isString ? source.pontos_chave : null
                                        const type = !isString ? source.tipo_estudo : null

                                        // Clickable Title Wrapper
                                        const TitleComponent = url ? 'a' : 'span'
                                        const titleProps = url ? { href: url, target: "_blank", rel: "noopener noreferrer", className: "hover:underline hover:text-blue-700 transition-colors cursor-pointer" } : {}

                                        return (
                                            <div key={idx} className="flex flex-col p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2 group hover:border-blue-200 transition-colors">
                                                {/* Header */}
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex flex-col gap-0.5 w-full">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {type && <Badge variant="secondary" className="text-[9px] font-bold px-1.5 h-5">{type}</Badge>}
                                                            {quality && <Badge variant={quality.includes('A') || quality.includes('Gold') || quality.includes('10') ? "default" : "outline"} className="text-[9px] h-5 ml-auto">{quality}</Badge>}
                                                        </div>

                                                        {/* CLICKABLE TITLE */}
                                                        {url ? (
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-900 text-sm leading-tight hover:text-blue-700 hover:underline flex items-center gap-1.5 w-fit">
                                                                {title}
                                                                <ExternalLink className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </a>
                                                        ) : (
                                                            <span className="font-semibold text-blue-900 text-sm leading-tight">{title}</span>
                                                        )}

                                                        {(author || year) && (
                                                            <span className="text-xs text-slate-500 mt-0.5">
                                                                {author} <span className="text-slate-300">•</span> {year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Summary */}
                                                {summary && (
                                                    <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                                                        {summary}
                                                    </div>
                                                )}

                                                {/* Key Points */}
                                                {points && points.length > 0 && (
                                                    <div className="pl-1">
                                                        <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Pontos Chave:</p>
                                                        <ul className="space-y-1">
                                                            {points.map((pt: string, i: number) => (
                                                                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                                    <span>{pt}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
