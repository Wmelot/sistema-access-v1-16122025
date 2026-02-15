"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Search, Send, Users, Filter, Calendar, MessageSquare, Zap, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchPatientsForCampaign, getServicesList, createCampaign, startCampaign } from "../../../marketing/actions"
import { getTemplates, sendMessage, getWhatsappConfig } from "../actions"

interface CampaignsManagerProps {
    slug: string
}

export function CampaignsManager({ slug }: CampaignsManagerProps) {
    const [services, setServices] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedService, setSelectedService] = useState<string>("all")
    const [period, setPeriod] = useState<string>("all")
    const [noAttendance, setNoAttendance] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [selectedPatients, setSelectedPatients] = useState<string[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")
    const [customMessage, setCustomMessage] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        getServicesList().then(setServices)
        getTemplates(slug).then(setTemplates)
    }, [slug])

    const handleSearch = async () => {
        setIsSearching(true)
        try {
            // Mapping filters to what the action expects
            const filters: any = {}
            if (selectedService !== "all") filters.serviceIds = [selectedService]

            if (period === "none") {
                filters.noAttendance = true
            } else {
                // Logic for periods
                const now = new Date()
                if (period === "1year") {
                    const oneYearAgo = new Date()
                    oneYearAgo.setFullYear(now.getFullYear() - 1)
                    filters.endDate = oneYearAgo.toISOString().split('T')[0]
                } else if (period === "6months") {
                    const sixMonthsAgo = new Date()
                    sixMonthsAgo.setMonth(now.getMonth() - 6)
                    filters.endDate = sixMonthsAgo.toISOString().split('T')[0]
                }
            }

            const results = await searchPatientsForCampaign(filters)
            setPatients(results)
            setSelectedPatients(results.map((p: any) => p.phone))
            toast.success(`${results.length} pacientes encontrados.`)
        } catch (error) {
            toast.error("Erro ao buscar pacientes.")
        } finally {
            setIsSearching(false)
        }
    }

    const handleSend = async () => {
        if (!selectedTemplate && !customMessage) {
            toast.error("Selecione um modelo ou escreva uma mensagem.")
            return
        }
        if (selectedPatients.length === 0) {
            toast.error("Selecione ao menos um paciente.")
            return
        }

        setIsSending(true)
        try {
            const template = templates.find(t => t.id === selectedTemplate)
            const finalContent = customMessage || template?.content || ""

            const contacts = patients
                .filter(p => selectedPatients.includes(p.phone))
                .map(p => ({ name: p.name, phone: p.phone }))

            const res = await createCampaign("Campanha Manual - " + new Date().toLocaleDateString(), finalContent, contacts)
            if (res.success && res.campaignId) {
                await startCampaign(res.campaignId)
                toast.success("Campanha iniciada com sucesso!")
                setSelectedPatients([])
                setCustomMessage("")
            } else {
                toast.error(res.error || "Erro ao criar campanha.")
            }
        } catch (error) {
            toast.error("Erro ao enviar campanha.")
        } finally {
            setIsSending(false)
        }
    }

    const togglePatient = (phone: string) => {
        setSelectedPatients(prev =>
            prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
        )
    }

    const toggleAll = () => {
        if (selectedPatients.length === patients.length) setSelectedPatients([])
        else setSelectedPatients(patients.map(p => p.phone))
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros de Público
                    </CardTitle>
                    <CardDescription>Selecione quem receberá a mensagem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Serviço Realizado</Label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os serviços" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os serviços</SelectItem>
                                {services.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Período de Atendimento</Label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Qualquer data" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Qualquer data</SelectItem>
                                <SelectItem value="6months">Há mais de 6 meses</SelectItem>
                                <SelectItem value="1year">Há mais de 1 ano</SelectItem>
                                <SelectItem value="none">Sem data registrada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="w-full" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Buscar Pacientes
                    </Button>
                </CardContent>
            </Card>

            {/* List and Message */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Pacientes Selecionados
                            </CardTitle>
                            <CardDescription>{patients.length} encontrados | {selectedPatients.length} selecionados</CardDescription>
                        </div>
                        {patients.length > 0 && (
                            <Button variant="outline" size="sm" onClick={toggleAll}>
                                {selectedPatients.length === patients.length ? "Desmarcar Todos" : "Selecionar Todos"}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {patients.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                    Nenhum paciente encontrado com estes filtros.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {patients.map(p => (
                                        <div key={p.phone} className="flex items-center space-x-2 border p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <Checkbox
                                                id={`p-${p.phone}`}
                                                checked={selectedPatients.includes(p.phone)}
                                                onCheckedChange={() => togglePatient(p.phone)}
                                            />
                                            <div className="grid gap-0.5 leading-none">
                                                <label htmlFor={`p-${p.phone}`} className="text-sm font-medium leading-none cursor-pointer">
                                                    {p.name}
                                                </label>
                                                <p className="text-[10px] text-muted-foreground">{p.phone}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Mensagem da Campanha
                        </CardTitle>
                        <CardDescription>Escolha um modelo ou escreva algo novo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Modelo de Mensagem</Label>
                            <Select value={selectedTemplate} onValueChange={(v) => {
                                setSelectedTemplate(v)
                                setCustomMessage("")
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um modelo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Personalizar Mensagem (Opcional)</Label>
                            <textarea
                                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Utilize {{nome}} para o primeiro nome do paciente..."
                                value={customMessage || templates.find(t => t.id === selectedTemplate)?.content || ""}
                                onChange={(e) => setCustomMessage(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold"
                            disabled={isSending || selectedPatients.length === 0}
                            onClick={handleSend}
                        >
                            {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                            DISPARAR PARA {selectedPatients.length} PACIENTES
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 italic font-medium uppercase tracking-widest">
                            <Zap className="inline-block h-3 w-3 mr-1" /> Envio processado via Z-API
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
