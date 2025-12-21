import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useState } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from "@tiptap/extension-link"
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { ChartExtension } from './extensions/chart-extension'
import { createClient } from '@/lib/supabase/client'

import { Button } from "@/components/ui/button"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Heading1,
    Heading2,
    Heading3,
    Table as TableIcon,
    Columns,
    Rows,
    PieChart,
    Type,
    Minus,
    Plus
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
}

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
    const [charts, setCharts] = useState<any[]>([])

    // Fetch available charts
    useEffect(() => {
        const fetchCharts = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('chart_templates')
                .select('id, title')
                .order('title')

            if (data) setCharts(data)
        }
        fetchCharts()
    }, [])

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Comece a escrever seu laudo aqui...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
            Underline,
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            ChartExtension
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                // Added distinct table styling: border-black/20 for visibility
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[300px] max-w-none [&_table]:border-collapse [&_table]:border [&_table]:border-slate-400 [&_table]:w-full [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:relative [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:text-left font-sans',
                style: `
                    background-image: linear-gradient(to bottom, transparent calc(1123px - 2px), #e5e7eb calc(1123px - 2px), #e5e7eb 1123px, transparent 1123px);
                    background-size: 100% 1123px;
                    background-repeat: repeat-y;
                `
            },
        },
        immediatelyRender: false,
    })

    // Sync content when it changes externally (e.g. AI generation)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    const addChart = (chartId: string) => {
        editor.chain().focus().insertContent({
            type: 'reportChart',
            attrs: { chartId }
        }).run()
    }

    return (
        <div className="border rounded-md bg-background flex flex-col min-h-[500px] shadow-sm">
            {editable && (
                <div className="border-b p-2 flex flex-wrap gap-1 items-center bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                    {/* History */}
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
                            disabled={!editor.can().undo()}
                            title="Desfazer"
                        >
                            <span className="text-xs">↩</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
                            disabled={!editor.can().redo()}
                            title="Refazer"
                        >
                            <span className="text-xs">↪</span>
                        </Button>
                    </div>

                    {/* Font Family */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none w-24 justify-between">
                                <span className="truncate text-xs">
                                    {editor.getAttributes('textStyle').fontFamily || 'Fonte'}
                                </span>
                                <Type className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Inter').run()} style={{ fontFamily: 'Inter' }}>
                                Padrão (Inter)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Calibri, sans-serif').run()} style={{ fontFamily: 'Calibri, sans-serif' }}>
                                Calibri
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Arial').run()} style={{ fontFamily: 'Arial' }}>
                                Arial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Times New Roman').run()} style={{ fontFamily: 'Times New Roman' }}>
                                Times New Roman
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Verdana').run()} style={{ fontFamily: 'Verdana' }}>
                                Verdana
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Basic Formatting */}
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                            className={editor.isActive('bold') ? 'bg-muted' : ''}
                            title="Negrito"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                            className={editor.isActive('italic') ? 'bg-muted' : ''}
                            title="Itálico"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
                            className={editor.isActive('underline') ? 'bg-muted' : ''}
                            title="Sublinhado"
                        >
                            <UnderlineIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Alignment */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none">
                                <AlignLeft className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}>
                                <AlignLeft className="h-4 w-4 mr-2" /> Esquerda
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}>
                                <AlignCenter className="h-4 w-4 mr-2" /> Centralizado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}>
                                <AlignRight className="h-4 w-4 mr-2" /> Direita
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run(); }}>
                                <AlignJustify className="h-4 w-4 mr-2" /> Justificado
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Headings / Size */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none">
                                <Heading1 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Títulos</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}>
                                <Heading1 className="h-4 w-4 mr-2" /> Título 1
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}>
                                <Heading2 className="h-4 w-4 mr-2" /> Título 2
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}>
                                <Heading3 className="h-4 w-4 mr-2" /> Título 3
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Parágrafo</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}>
                                <Type className="h-4 w-4 mr-2" /> Texto Normal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Lists */}
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
                            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
                            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tables */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none">
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }}>
                                <TableIcon className="h-4 w-4 mr-2" /> Inserir Tabela
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }} disabled={!editor.can().addColumnAfter()}>
                                <Columns className="h-4 w-4 mr-2" /> Adicionar Coluna
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }} disabled={!editor.can().deleteColumn()}>
                                <Columns className="h-4 w-4 mr-2 text-red-500" /> Remover Coluna
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }} disabled={!editor.can().addRowAfter()}>
                                <Rows className="h-4 w-4 mr-2" /> Adicionar Linha
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }} disabled={!editor.can().deleteRow()}>
                                <Rows className="h-4 w-4 mr-2 text-red-500" /> Remover Linha
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Charts (NEW) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <PieChart className="h-4 w-4" />
                                <span className="hidden sm:inline text-xs font-semibold">Gráfico</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Inserir Gráfico</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {charts.length === 0 ? (
                                <DropdownMenuItem disabled>
                                    Nenhum gráfico disponível
                                </DropdownMenuItem>
                            ) : (
                                charts.map((chart) => (
                                    <DropdownMenuItem key={chart.id} onClick={() => addChart(chart.id)}>
                                        <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {chart.title}
                                    </DropdownMenuItem>
                                ))
                            )}
                            <DropdownMenuSeparator />
                            <div className="p-2 text-[10px] text-muted-foreground pointer-events-none">
                                Configure gráficos em Ajustes.
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            )}

            <EditorContent editor={editor} className="flex-1" />
        </div>
    )
}
