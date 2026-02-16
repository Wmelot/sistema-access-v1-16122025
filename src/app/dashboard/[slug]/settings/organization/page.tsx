"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { useParams } from "next/navigation"
import { getOrganizationSettings, updateOrganizationSettings } from "./actions"
import { toggleSupportAccess } from "./support-actions"
import { runSystemDiagnostic } from "./debug-actions"
import { ShieldCheck, TimerReset, Lock, Unlock, AlertCircle, Activity, Cpu, CheckCircle2, XCircle, AlertTriangle, Bot, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function OrganizationSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [supportLoading, setSupportLoading] = useState(false)
    const [diagnosticLoading, setDiagnosticLoading] = useState(false)
    const [diagnosticData, setDiagnosticData] = useState<{ results: any[], aiAnalysis: string } | null>(null)
    const [org, setOrg] = useState<any>(null)
    const { slug } = useParams() as { slug: string }

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const data = await getOrganizationSettings(slug)
            if (data.error) throw new Error(data.error)
            setOrg(data.org)
        } catch (e) {
            toast.error("Erro ao carregar configurações da clínica")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await updateOrganizationSettings(formData, slug)
            if (res.error) throw new Error(res.error)
            toast.success("Configurações salvas! A página será recarregada para aplicar as mudanças.")
            setTimeout(() => window.location.reload(), 1500)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleSupport() {
        if (!org?.id) return
        setSupportLoading(true)
        const isActive = org.support_access_active

        try {
            const res = await toggleSupportAccess(org.id, !isActive)
            if (res.error) throw new Error(res.error)

            toast.success(!isActive ? "Acesso de suporte liberado!" : "Acesso de suporte revogado.")
            loadSettings()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSupportLoading(false)
        }
    }

    async function handleRunDiagnostic() {
        setDiagnosticLoading(true)
        setDiagnosticData(null)
        try {
            const data = await runSystemDiagnostic(slug)
            setDiagnosticData(data)
            toast.success("Diagnóstico concluído!")
        } catch (e) {
            toast.error("Erro ao executar diagnóstico")
        } finally {
            setDiagnosticLoading(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Identidade da Clínica (White-label)</h2>
                <p className="text-muted-foreground">Personalize o sistema com a marca da sua empresa.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Organização</CardTitle>
                        <CardDescription>Essas informações aparecerão no cabeçalho e em documentos para pacientes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Clínica</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={org?.name}
                                required
                                placeholder="Ex: Access Fisioterapia"
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <Label htmlFor="primary_color">Cor Principal (Hex)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="primary_color"
                                    name="primary_color"
                                    defaultValue={org?.primary_color || '#000000'}
                                    type="color"
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    name="primary_color_text"
                                    defaultValue={org?.primary_color || '#000000'}
                                    className="flex-1 font-mono uppercase"
                                    onChange={(e) => {
                                        // Sync color picker if needed (simplified here)
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Usada em botões e destaques.</p>
                        </div>

                        {/* Logo Upload (Simplified) */}
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo (URL ou Upload)</Label>
                            <div className="flex gap-2 items-center">
                                {org?.logo_url && (
                                    <img src={org.logo_url} alt="Logo Atual" className="h-10 w-auto border rounded bg-gray-50 p-1" />
                                )}
                                <div className="flex-1">
                                    <Input
                                        id="logo_url"
                                        name="logo_url"
                                        defaultValue={org?.logo_url}
                                        placeholder="https://..."
                                    />
                                    {/* Future: Real File Upload */}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Cole a URL do seu logo (ex: Hospedado no Imgur ou similar) por enquanto.</p>
                        </div>

                        {/* Google Place ID */}
                        <div className="space-y-2">
                            <Label htmlFor="google_place_id">ID do Google Maps (Place ID)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="google_place_id"
                                    name="google_place_id"
                                    defaultValue={org?.google_place_id}
                                    placeholder="Ex: ChIJ..."
                                />
                                <Button variant="outline" type="button" asChild>
                                    <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer">
                                        Como pegar?
                                    </a>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Necessário para integrar avaliações do Google e Mapa.
                                <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" className="underline ml-1">
                                    Encontre seu ID aqui.
                                </a>
                            </p>
                        </div>

                    </CardContent>
                </Card>

                <Card className="mt-6 border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="text-blue-700 flex items-center gap-2 text-base">
                            Link de Agendamento Online
                        </CardTitle>
                        <CardDescription className="text-xs">Compartilhe este link em seu Instagram e WhatsApp para que os pacientes agendem sozinhos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={typeof window !== 'undefined' ? `${window.location.origin}/book/${slug}` : ''}
                                className="bg-white h-9 text-xs"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`)
                                toast.success("Link copiado!")
                            }}>
                                Copiar Link
                            </Button>
                        </div>
                        <p className="text-[10px] text-blue-600 font-medium">
                            💡 Dica: Você pode usar este link no "Link da Bio" do seu Instagram.
                        </p>
                    </CardContent>
                </Card>

                {/* SUPORTE TÉCNICO CARD */}
                <Card className={cn(
                    "mt-6 border-2 transition-all duration-500",
                    org?.support_access_active ? "border-amber-200 bg-amber-50/20 shadow-lg shadow-amber-100" : "border-slate-100 bg-slate-50/50"
                )}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className={cn(
                                    "flex items-center gap-2 text-base",
                                    org?.support_access_active ? "text-amber-700" : "text-slate-700"
                                )}>
                                    <ShieldCheck className={cn("w-5 h-5", org?.support_access_active ? "text-amber-500 animate-pulse" : "text-slate-400")} />
                                    Acesso para Suporte Técnico
                                </CardTitle>
                                <CardDescription className="text-[11px] leading-relaxed max-w-sm">
                                    Libera temporariamente o acesso total aos dados da clínica para o desenvolvedor realizar manutenções ou correções de erros.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant={org?.support_access_active ? "destructive" : "outline"}
                                size="sm"
                                disabled={supportLoading}
                                onClick={handleToggleSupport}
                                className="font-bold text-xs rounded-xl h-9 px-4"
                            >
                                {supportLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : (org?.support_access_active ? <Lock className="w-3 h-3 mr-2" /> : <Unlock className="w-3 h-3 mr-2" />)}
                                {org?.support_access_active ? "Revogar Acesso" : "Liberar Acesso (4h)"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {org?.support_access_active && org?.support_access_until ? (
                            <div className="bg-white/80 p-3 rounded-xl border border-amber-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <TimerReset className="w-4 h-4 text-amber-500" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Acesso Expira Em:</p>
                                        <p className="text-xs font-bold text-amber-900">
                                            {format(new Date(org.support_access_until), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 font-bold text-[10px]">ATIVO</Badge>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 opacity-60">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                                <p className="text-[10px] font-medium text-slate-500 italic">
                                    Seus dados estão protegidos. O suporte só terá acesso se você clicar no botão acima.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </form>

            {/* DIAGNÓSTICO DE SISTEMA */}
            <Card className="mt-6 border-slate-200 bg-white shadow-sm overflow-hidden mb-12">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                Saúde do Sistema
                            </CardTitle>
                            <CardDescription className="text-[10px]">Identifique inconsistências ou problemas técnicos na sua conta.</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[9px] font-bold px-3 rounded-lg"
                            disabled={diagnosticLoading}
                            onClick={handleRunDiagnostic}
                        >
                            {diagnosticLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Cpu className="w-3 h-3 mr-2" />}
                            Executar Check-up
                        </Button>
                    </div>
                </CardHeader>
                {diagnosticData && (
                    <CardContent className="p-0 border-t border-slate-100">
                        {/* Technical Checks List */}
                        <div className="divide-y divide-slate-50 bg-slate-50/20">
                            {diagnosticData.results.map((res: any, i: number) => (
                                <div key={i} className="px-4 py-2.5 flex items-start gap-3 transition-colors hover:bg-slate-50/50">
                                    {res.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />}
                                    {res.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />}
                                    {res.status === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-slate-700">{res.name}</p>
                                        <p className="text-[10px] text-slate-500 leading-tight">{res.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* AI INSIGHT SECTION */}
                        {diagnosticData.aiAnalysis && (
                            <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-indigo-600 p-1 rounded-lg">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                            Axiom Assistant (IA)
                                            <Sparkles className="w-3 h-3 text-indigo-400" />
                                        </p>
                                        <p className="text-[9px] text-indigo-600 font-medium">Parecer Técnico e Recomendações</p>
                                    </div>
                                </div>
                                <div className="bg-white/60 rounded-xl p-3 border border-indigo-100 shadow-sm">
                                    <p className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap font-medium">
                                        {diagnosticData.aiAnalysis}
                                    </p>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-[10px] text-indigo-600 font-bold hover:no-underline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(diagnosticData.aiAnalysis)
                                            toast.success("Parecer copiado para o suporte!")
                                        }}
                                    >
                                        Copiar parecer para o desenvolvedor
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
