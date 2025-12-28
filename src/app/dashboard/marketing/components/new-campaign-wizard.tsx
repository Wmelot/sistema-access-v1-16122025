'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronRight, FileSpreadsheet, Loader2, Send, Upload, Users, Search, CheckSquare, X } from "lucide-react"
import { parseContactsFromExcel, createCampaign, startCampaign, CampaignContact, getServicesList, searchPatientsForCampaign } from "../actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export function NewCampaignWizard() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // Data State
    const [title, setTitle] = useState("")
    const [templateContent, setTemplateContent] = useState("")

    // Audience State
    const [excelContacts, setExcelContacts] = useState<CampaignContact[]>([])
    const [importStats, setImportStats] = useState({ total: 0, invalid: 0 })

    const [services, setServices] = useState<any[]>([])
    const [dbFilters, setDbFilters] = useState({ startDate: '', endDate: '', serviceId: 'all' })
    const [dbSearchResults, setDbSearchResults] = useState<any[]>([])
    const [selectedDbIds, setSelectedDbIds] = useState<Set<string>>(new Set())
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        getServicesList().then(setServices)
    }, [])

    // Computed Final Contacts
    const finalContacts = [
        ...excelContacts,
        ...dbSearchResults.filter(p => selectedDbIds.has(p.phone)) // Use phone as unique ID if ID not available or mix
    ]

    // STEP 1: EXCEL
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        const res = await parseContactsFromExcel(formData)
        setIsLoading(false)

        if (res.error) {
            toast.error(res.error)
            return
        }

        if (res.contacts) {
            setExcelContacts(res.contacts)
            setImportStats({
                total: res.contacts.length,
                invalid: res.invalidCount || 0
            })
            toast.success(`${res.contacts.length} contatos importados com sucesso!`)
        }
    }

    // STEP 1: DB SEARCH
    async function handleSearch() {
        setIsSearching(true)
        try {
            const results = await searchPatientsForCampaign({
                startDate: dbFilters.startDate || undefined,
                endDate: dbFilters.endDate || undefined,
                serviceIds: dbFilters.serviceId && dbFilters.serviceId !== 'all' ? [dbFilters.serviceId] : undefined
            })
            setDbSearchResults(results)
            // By default select all? No, let user select.
            // Actually, maybe select all by default for convenience?
            // Let's select all found.
            const allPhones = new Set(results.map((r: any) => r.phone))
            setSelectedDbIds(allPhones)

            if (results.length === 0) toast.info("Nenhum paciente encontrado com esses filtros.")
        } catch (error) {
            toast.error("Erro ao buscar pacientes.")
        } finally {
            setIsSearching(false)
        }
    }

    const toggleDbPatient = (phone: string) => {
        const newSet = new Set(selectedDbIds)
        if (newSet.has(phone)) newSet.delete(phone)
        else newSet.add(phone)
        setSelectedDbIds(newSet)
    }

    const toggleAllDbPatients = () => {
        if (selectedDbIds.size === dbSearchResults.length) {
            setSelectedDbIds(new Set())
        } else {
            const allPhones = new Set(dbSearchResults.map((r: any) => r.phone))
            setSelectedDbIds(allPhones)
        }
    }

    // STEP 3: SUBMIT
    async function handleFinish() {
        if (!title || !templateContent || finalContacts.length === 0) {
            toast.error("Preencha todos os campos e selecione destinatários.")
            return
        }

        setIsLoading(true)
        try {
            // 1. Create Campaign
            const createRes = await createCampaign(title, templateContent, finalContacts)
            if (createRes.error || !createRes.campaignId) {
                toast.error(createRes.error || "Erro ao criar campanha")
                setIsLoading(false)
                return
            }

            // 2. Start Campaign
            const startRes = await startCampaign(createRes.campaignId)
            if (startRes.error) {
                toast.warning("Campanha criada como Rascunho, mas erro ao iniciar envio: " + startRes.error)
            } else {
                toast.success("Campanha iniciada com sucesso!")
            }

            // Redirect
            router.push('/dashboard/marketing')
            router.refresh()

        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado.")
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Stepper Indicator */}
            <div className="flex justify-between items-center px-10">
                <div className={`flex flex-col items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-current'}`}>1</div>
                    <span className="text-xs font-medium">Público</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`flex flex-col items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-current'}`}>2</div>
                    <span className="text-xs font-medium">Mensagem</span>
                </div>
                <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`flex flex-col items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-current'}`}>3</div>
                    <span className="text-xs font-medium">Revisão</span>
                </div>
            </div>

            {/* Step 1: Audience */}
            {step === 1 && (
                <Card className="min-h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Definir Público Alvo</CardTitle>
                        <CardDescription>
                            Importe contatos ou selecione pacientes do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <Tabs defaultValue="db" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="db">Selecionar Pacientes</TabsTrigger>
                                <TabsTrigger value="excel">Importar Excel</TabsTrigger>
                            </TabsList>

                            {/* TAB: DATABASE */}
                            <TabsContent value="db" className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Data Início</Label>
                                        <Input type="date" value={dbFilters.startDate} onChange={e => setDbFilters({ ...dbFilters, startDate: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data Fim</Label>
                                        <Input type="date" value={dbFilters.endDate} onChange={e => setDbFilters({ ...dbFilters, endDate: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-1">
                                        <Label>Serviço</Label>
                                        <Select value={dbFilters.serviceId} onValueChange={v => setDbFilters({ ...dbFilters, serviceId: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os serviços</SelectItem>
                                                {services.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                        Buscar
                                    </Button>
                                </div>

                                {/* Results Table */}
                                <div className="border rounded-md mt-4 max-h-[300px] overflow-y-auto relative">
                                    {dbSearchResults.length > 0 ? (
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-secondary z-10">
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={selectedDbIds.size === dbSearchResults.length && dbSearchResults.length > 0}
                                                            onCheckedChange={toggleAllDbPatients}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Telefone</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dbSearchResults.map((contact, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedDbIds.has(contact.phone)}
                                                                onCheckedChange={() => toggleDbPatient(contact.phone)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{contact.name}</TableCell>
                                                        <TableCell>{contact.phone}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-10 text-center text-muted-foreground">
                                            {isSearching ? 'Buscando...' : 'Nenhum paciente listado. Utilize os filtros acima.'}
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground text-right">
                                    {selectedDbIds.size} pacientes selecionados.
                                </div>
                            </TabsContent>

                            {/* TAB: EXCEL */}
                            <TabsContent value="excel" className="py-4 space-y-4">
                                <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={isLoading}
                                    />
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{excelContacts.length > 0 ? "Arquivo Carregado" : "Clique ou Arraste o arquivo"}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {excelContacts.length > 0
                                                ? `${importStats.total} contatos válidos encontrados.`
                                                : "Suporta arquivos .xlsx. Colunas 'Nome' e 'Telefone'."
                                            }
                                        </p>
                                    </div>
                                </div>
                                {excelContacts.length > 0 && (
                                    <div className="bg-slate-50 p-4 rounded-md border text-sm max-h-[200px] overflow-y-auto">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> Importados ({excelContacts.length})</h4>
                                        {excelContacts.slice(0, 10).map((c, i) => (
                                            <div key={i} className="flex justify-between py-1 border-b last:border-0 border-slate-200">
                                                <span>{c.name}</span>
                                                <span className="text-muted-foreground">{c.phone}</span>
                                            </div>
                                        ))}
                                        {excelContacts.length > 10 && <div className="text-center pt-2 text-xs text-muted-foreground">e mais {excelContacts.length - 10}...</div>}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Combined Summary */}
                        <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-sm">Total de Destinatários</h4>
                                <p className="text-xs text-muted-foreground">Combinando Excel e Seleção do Sistema</p>
                            </div>
                            <div className="text-xl font-bold text-primary">
                                {finalContacts.length}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={() => setStep(2)} disabled={finalContacts.length === 0 || isLoading}>
                            Próximo: Mensagem
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 2: Content */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Conteúdo da Campanha</CardTitle>
                        <CardDescription>
                            Defina o título da campanha e escreva a mensagem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Nome da Campanha (Interno)</Label>
                            <Input
                                placeholder="Ex: Aviso de Feriado 2024"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Mensagem</Label>
                                <span className="text-xs text-muted-foreground">Variáveis: {'{{nome}}'}</span>
                            </div>
                            <Textarea
                                className="min-h-[200px]"
                                placeholder="Olá {{nome}}, gostaríamos de avisar que..."
                                value={templateContent}
                                onChange={e => setTemplateContent(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Use <strong>{'{{nome}}'}</strong> para inserir o primeiro nome do paciente automaticamente.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                        <Button onClick={() => setStep(3)} disabled={!title || !templateContent}>
                            Próximo: Revisão
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Revisar e Enviar</CardTitle>
                        <CardDescription>
                            Verifique os detalhes antes de iniciar o disparo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total de Envios</span>
                                <div className="text-2xl font-bold">{finalContacts.length}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Tempo Estimado</span>
                                <div className="text-2xl font-bold">~{Math.ceil(finalContacts.length / 6)} min</div>
                                <span className="text-xs text-muted-foreground">Baseado em 1 msg a cada 10s</span>
                            </div>
                        </div>

                        <div className="border rounded-md p-4">
                            <h4 className="text-sm font-semibold mb-2">Exemplo de Mensagem:</h4>
                            <div className="bg-green-50 p-3 rounded-lg text-sm whitespace-pre-wrap border border-green-100 text-green-900">
                                {templateContent.replace('{{nome}}', finalContacts[0]?.name.split(' ')[0] || 'Maria')}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="ghost" onClick={() => setStep(2)} disabled={isLoading}>Voltar</Button>
                        <Button onClick={handleFinish} disabled={isLoading} className="gap-2 bg-green-600 hover:bg-green-700">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Iniciar Campanha
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
