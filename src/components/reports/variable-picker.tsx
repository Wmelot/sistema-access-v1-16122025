"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, FileText, Settings, Clock, Stethoscope } from "lucide-react"

interface VariablePickerProps {
    formTemplates?: any[]
    onInsert: (variable: string) => void
}

export function VariablePicker({ formTemplates = [], onInsert }: VariablePickerProps) {

    // Static Variable Definitions
    const systemVariables = [
        { label: "Data Atual (dd/mm/aaaa)", value: "data_atual" },
        { label: "Data Atual (Extenso)", value: "data_atual_extenso" },
        { label: "Cidade da Clínica", value: "cidade_clinica" },
        { label: "Estado da Clínica", value: "estado_clinica" },
    ]

    const professionalVariables = [
        { label: "Nome do Profissional", value: "profissional_nome" },
        { label: "Registro (CREFITO/CRM)", value: "profissional_registro" },
        { label: "Especialidade", value: "profissional_especialidade" },
        { label: "Email", value: "profissional_email" },
    ]

    const appointmentVariables = [
        { label: "Data da Consulta", value: "agendamento_data" },
        { label: "Horário", value: "agendamento_horario" },
        { label: "Procedimento", value: "agendamento_procedimento" },
        { label: "Status", value: "agendamento_status" },
        { label: "Duração", value: "agendamento_duracao" },
    ]

    const patientVariables = [
        { label: "Nome Completo", value: "paciente_nome" },
        { label: "CPF", value: "paciente_cpf" },
        { label: "Data de Nascimento", value: "paciente_nascimento" },
        { label: "Idade", value: "paciente_idade" },
        { label: "Telefone", value: "paciente_telefone" },
        { label: "Email", value: "paciente_email" },
        { label: "Endereço Completo", value: "paciente_endereco" },
    ]

    return (
        <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/30 border-b">
                <h3 className="font-semibold text-sm">Variáveis Dinâmicas</h3>
                <p className="text-xs text-muted-foreground">
                    Clique para copiar ou arraste para o editor.
                </p>
            </div>

            <Tabs defaultValue="paciente" className="flex-1 flex flex-col min-h-0">
                <div className="p-2 border-b bg-muted/10">
                    <TabsList className="w-full grid grid-cols-4 h-auto py-1">
                        <TabsTrigger value="paciente" title="Paciente">
                            <User className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="agenda" title="Agenda e Geral">
                            <Calendar className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="forms" title="Formulários">
                            <FileText className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="prof" title="Profissional">
                            <Stethoscope className="w-4 h-4" />
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        <div className="p-3 space-y-4">

                            {/* TAB: PACIENTE */}
                            <TabsContent value="paciente" className="mt-0 space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dados do Paciente</h4>
                                {patientVariables.map((v) => (
                                    <VariableButton key={v.value} label={v.label} value={v.value} onInsert={onInsert} />
                                ))}
                            </TabsContent>

                            {/* TAB: AGENDA & GERAL (Combined for compactness or split if needed) */}
                            <TabsContent value="agenda" className="mt-0 space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Agenda
                                    </h4>
                                    <div className="space-y-2">
                                        {appointmentVariables.map((v) => (
                                            <VariableButton key={v.value} label={v.label} value={v.value} onInsert={onInsert} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 mt-4 flex items-center gap-2">
                                        <Settings className="w-3 h-3" /> Sistema / Geral
                                    </h4>
                                    <div className="space-y-2">
                                        {systemVariables.map((v) => (
                                            <VariableButton key={v.value} label={v.label} value={v.value} onInsert={onInsert} />
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: PROFISSIONAL */}
                            <TabsContent value="prof" className="mt-0 space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dados do Profissional</h4>
                                {professionalVariables.map((v) => (
                                    <VariableButton key={v.value} label={v.label} value={v.value} onInsert={onInsert} />
                                ))}
                            </TabsContent>

                            {/* TAB: FORMULÁRIOS */}
                            <TabsContent value="forms" className="mt-0">
                                <Accordion type="single" collapsible className="w-full">
                                    {formTemplates.map((form: any) => (
                                        <AccordionItem key={form.id} value={form.id}>
                                            <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                                {form.title}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-1 pt-1">
                                                    {form.fields.map((field: any, idx: number) => {
                                                        if (!field?.label) return null
                                                        return (
                                                            <VariableButton
                                                                key={idx}
                                                                label={field.label}
                                                                value={`form_${form.id}_${field.label.toLowerCase().replace(/\s+/g, '_')}`}
                                                                onInsert={onInsert}
                                                                isForm
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                    {formTemplates.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                            Nenhum formulário encontrado.
                                        </p>
                                    )}
                                </Accordion>
                            </TabsContent>

                        </div>
                    </ScrollArea>
                </div>
            </Tabs>
        </div>
    )
}

function VariableButton({ label, value, onInsert, isForm }: { label: string, value: string, onInsert: (v: string) => void, isForm?: boolean }) {
    const variableCode = `{{${value}}}`

    return (
        <Button
            variant="outline"
            className={`w-full justify-between h-auto py-2 text-xs font-normal ${isForm ? 'border-dashed' : ''}`}
            onClick={() => onInsert(variableCode)}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", variableCode)
            }}
        >
            <span className="truncate mr-2">{label}</span>
            <Badge variant="secondary" className="text-[10px] h-5 px-1 font-mono shrink-0 opacity-50">
                {variableCode}
            </Badge>
        </Button>
    )
}
