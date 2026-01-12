
"use client"

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Save, Plus, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { ReportBlueprint, ReportSection, ReportWidget } from '@/lib/services/smart-reports/types'

// Setup default empty blueprint
const DEFAULT_BLUEPRINT: ReportBlueprint = {
    id: 'new_blueprint',
    name: 'Novo Modelo',
    version: '1.0.0',
    sections: [
        {
            id: 'section_1',
            title: 'Seção Principal',
            layout: 'full_width',
            widgets: []
        }
    ],
    globalSettings: {
        showLogo: true,
        showPatientInfo: true,
        primaryColor: '#4F46E5'
    }
}

import { useSearchParams } from 'next/navigation'
import palmilhaV2 from '@/lib/services/smart-reports/blueprints/palmilha-v2.json'

export function SmartReportBuilder() {
    const searchParams = useSearchParams()
    const templateId = searchParams.get('id')

    // Initial state logic
    const getInitialBlueprint = () => {
        if (templateId === 'REPORT_PALMILHA_V2') {
            return palmilhaV2 as unknown as ReportBlueprint
        }
        return DEFAULT_BLUEPRINT
    }

    const [blueprint, setBlueprint] = useState<ReportBlueprint>(getInitialBlueprint())
    const [activeId, setActiveId] = useState<string | null>(null)

    const handleSave = async () => {
        // Call Server Action later
        console.log("Saving Blueprint:", blueprint)
        toast.success("Blueprint salvo (simulado)")
    }

    // Drag End Handler
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over) return

        if (active.id !== over.id) {
            // Reordering Logic for Sections or Widgets would go here
            console.log("Moved", active.id, "to", over.id)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Construtor de Relatórios</h1>
                    <p className="text-muted-foreground">Arraste os blocos para criar o layout do seu relatório.</p>
                </div>
                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Modelo
                </Button>
            </div>

            {/* Builder Area */}
            <div className="flex flex-1 gap-6 h-[calc(100vh-200px)]">
                {/* Left: Toolbox */}
                <Card className="w-64 shrink-0 flex flex-col">
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase">Blocos Disponíveis</h3>
                        <div className="space-y-2">
                            {/* Placeholder for Toolbox Items */}
                            <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:bg-slate-50 flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-slate-400" />
                                <span>Texto Simples</span>
                            </div>
                            <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:bg-slate-50 flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-slate-400" />
                                <span>Gráfico Radar</span>
                            </div>
                            <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:bg-slate-50 flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-slate-400" />
                                <span>Evidência (PBE)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Canvas */}
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="flex-1 bg-slate-50 border rounded-lg p-8 overflow-y-auto">
                        <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-sm border p-8">
                            {/* Header Preview */}
                            <div className="border-b pb-4 mb-8 text-center text-slate-400 border-dashed">
                                [Cabeçalho da Clínica]
                            </div>

                            {/* Sections */}
                            {blueprint.sections.map((section) => (
                                <div key={section.id} className="mb-6 border border-dashed border-slate-200 p-4 rounded hover:border-indigo-300 transition-colors">
                                    <h4 className="font-semibold text-indigo-900 mb-4">{section.title}</h4>

                                    <div className="min-h-[100px] bg-slate-50/50 rounded flex items-center justify-center text-slate-400 text-sm">
                                        Arraste widgets para cá
                                    </div>
                                </div>
                            ))}

                            <Button variant="ghost" className="w-full text-slate-400 border-dashed border-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Nova Seção
                            </Button>
                        </div>
                    </div>
                </DndContext>
            </div>
        </div>
    )
}
