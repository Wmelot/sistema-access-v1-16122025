
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatProtocolToReport } from '@/lib/data/clinical-protocols';
import { getProtocols } from '@/app/dashboard/settings/intelligence/actions';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FieldRichTextProps {
    field: any;
    value: any;
    onChange?: (val: any) => void;
    isPreview: boolean;
}

export const FieldRichText = ({ field, value, onChange, isPreview }: FieldRichTextProps) => {
    // [FIX] Local State for Rich Text / Report Template Logic
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [reportTemplates, setReportTemplates] = useState<any[]>([]);

    // Mock patient/professional names for template filling
    const [patientName] = useState('Paciente');
    const [professionalName] = useState('Profissional');

    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: value || '',
        editable: isPreview,
        onUpdate: ({ editor }) => {
            onChange && onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none',
            },
        },
    });

    // Sync value change if external update (e.g. template load)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            if (value && value !== '<p></p>') {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    // Update editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(isPreview);
        }
    }, [isPreview, editor]);


    useEffect(() => {
        getProtocols().then(protocols => {
            if (Array.isArray(protocols)) {
                const templates = protocols.filter(p => p.is_active).map(p => ({
                    id: p.id,
                    title: p.title,
                    label: p.title,
                    content: formatProtocolToReport({
                        patologia: p.title,
                        regiao: p.region,
                        fontes_evidencia: Array.isArray(p.evidence_sources)
                            ? p.evidence_sources.map((s: any) => {
                                if (typeof s === 'string') return s;
                                if (s.citation) return s.citation;
                                return `${s.titulo} (${s.autor}, ${s.ano})`;
                            })
                            : [],
                        ultima_atualizacao: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Data não disponível',
                        resumo_clinico: p.description,
                        intervencoes: p.interventions || [],
                        id: p.id
                    } as any)
                }));
                setReportTemplates(templates);
            }
        });
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        // [FIX] Use dynamic templates
        const template = reportTemplates.find(t => t.id === templateId)
        if (template && onChange) {
            // Auto-fill variables
            const now = new Date()
            const dateStr = now.toLocaleDateString('pt-BR')
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            const filledContent = template.content
                .replace(/{{PACIENTE}}/g, patientName)
                .replace(/{{DATA}}/g, dateStr)
                .replace(/{{HORARIO}}/g, timeStr)
                .replace(/{{PROFISSIONAL}}/g, professionalName)

            // Update editor directly
            editor?.commands.setContent(filledContent);
            onChange(filledContent)
        }
    }

    if (!editor) {
        return null;
    }

    return (
        <div className="grid gap-2">
            <div className="flex justify-between items-center">
                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect} disabled={!isPreview}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                        <SelectValue placeholder="Carregar Modelo..." />
                    </SelectTrigger>
                    <SelectContent>
                        {reportTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                {isPreview && (
                    <div className="flex items-center gap-1 p-1 border-b bg-muted/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-muted text-primary")}
                            title="Negrito"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-muted text-primary")}
                            title="Itálico"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-muted text-primary")}
                            title="Lista"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-muted text-primary")}
                            title="Lista Ordenada"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="p-2 min-h-[150px]">
                    <EditorContent editor={editor} />
                </div>
            </div>
            {field.helpText && <p className="text-[0.8rem] text-muted-foreground">{field.helpText}</p>}
        </div>
    );
};
