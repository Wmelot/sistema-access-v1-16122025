import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
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
import ImageResize from 'tiptap-extension-resize-image'
import { VariableExtension } from './extensions/variable-extension'
import { ChartExtension } from './extensions/chart-extension'
import { createClient } from '@/lib/supabase/client'
import { generateDocx } from '@/app/actions/generate-docx'

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
    Plus,
    Image as ImageIcon,
    Download,
    Upload,
    Printer,
    ChevronDown,
    FileText
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
    chartOptions?: { id: string, title: string }[]
}

export interface RichTextEditorRef {
    insertVariable: (id: string, label: string) => void
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ content, onChange, editable = true, chartOptions = [] }, ref) => {
    const [charts, setCharts] = useState<any[]>(chartOptions)

    // Sync chartOptions when they change
    useEffect(() => {
        if (chartOptions.length > 0) {
            setCharts(prev => {
                // Merge unique charts
                const newCharts = [...prev]
                chartOptions.forEach(c => {
                    if (!newCharts.find(existing => existing.id === c.id)) {
                        newCharts.push(c)
                    }
                })
                return newCharts
            })
        }
    }, [chartOptions])

    // Fetch available charts (legacy/static templates)
    useEffect(() => {
        const fetchCharts = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('chart_templates')
                .select('id, title')
                .order('title')

            if (data) {
                setCharts(prev => {
                    // Merge unique charts
                    const distinctData = data.filter(d => !prev.find(p => p.id === d.id))
                    return [...prev, ...distinctData]
                })
            }
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
            ChartExtension,
            ImageResize,
            VariableExtension
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                // A4 Page simulation
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[297mm] w-[210mm] bg-white shadow-lg p-[20mm] mx-auto [&_table]:border-collapse [&_table]:border [&_table]:border-black/50 [&_table]:w-full [&_td]:border [&_td]:border-black/20 [&_td]:p-2 [&_td]:relative [&_th]:border [&_th]:border-black/20 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:text-left font-sans text-black',
                style: `
                    min-height: 297mm;
                    width: 210mm;
                `
            },
            handleDrop: (view: any, event: any, slice: any, moved: boolean) => {
                const data = event.dataTransfer?.getData("application/x-access-variable")
                if (data) {
                    try {
                        const { label, value } = JSON.parse(data)
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })

                        // Insert the variable node at drop position
                        view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.variable.create({ id: value, label })))

                        return true // Handled
                    } catch (e) {
                        console.error("Failed to parse variable drop", e)
                    }
                }
                return false
            }
        },
        immediatelyRender: false,
    })

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        insertVariable: (id: string, label: string) => {
            editor?.chain().focus().insertVariable({ id, label }).run()
        }
    }), [editor])

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

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                if (result) {
                    editor.chain().focus().setImage({ src: result }).run()
                }
            }
            reader.readAsDataURL(file)
        }
        // Reset input
        event.target.value = ''
    }

    const exportToWord = async () => {
        try {
            const htmlContent = `<!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8" />
                    <title>Laudo</title>
                </head>
                <body>
                    ${editor.getHTML()}
                </body>
                </html>`

            const result = await generateDocx(htmlContent)

            if (!result.success || !result.base64) {
                throw new Error(result.error || 'Erro na geração do arquivo')
            }

            // Convert base64 to Blob
            const binaryString = window.atob(result.base64)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Relatorio_${new Date().toISOString().slice(0, 10)}.docx`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to export docx', error)
            alert('Erro ao exportar para Word. Tente novamente.')
        }
    }

    // Toolbar Button Helper
    const ToolbarButton = ({ onClick, isActive, disabled, title, children, className }: any) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            // Use onMouseDown to prevent focus loss
            onMouseDown={(e) => {
                e.preventDefault()
                onClick(e)
            }}
            disabled={disabled}
            className={`${isActive ? 'bg-slate-200 text-black' : 'text-slate-600 hover:bg-slate-100'} ${className || ''}`}
            title={title}
        >
            {children}
        </Button>
    )

    return (
        <div className="border rounded-md bg-slate-100/50 flex flex-col h-full shadow-inner overflow-hidden">
            {editable && (
                <div className="border-b p-2 flex flex-wrap gap-1 items-center bg-white sticky top-0 z-50 shadow-sm shrink-0">
                    {/* History */}
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            title="Desfazer"
                        >
                            <span className="text-xs">↩</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            title="Refazer"
                        >
                            <span className="text-xs">↪</span>
                        </ToolbarButton>
                    </div>

                    {/* Font Family */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none w-24 justify-between font-normal">
                                <span className="truncate text-xs">
                                    {editor.getAttributes('textStyle').fontFamily || 'Fonte'}
                                </span>
                                <Type className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setFontFamily('Inter').run() }} style={{ fontFamily: 'Inter' }}>
                                Padrão (Inter)
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setFontFamily('Calibri, sans-serif').run() }} style={{ fontFamily: 'Calibri, sans-serif' }}>
                                Calibri
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setFontFamily('Arial').run() }} style={{ fontFamily: 'Arial' }}>
                                Arial
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setFontFamily('Times New Roman').run() }} style={{ fontFamily: 'Times New Roman' }}>
                                Times New Roman
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setFontFamily('Verdana').run() }} style={{ fontFamily: 'Verdana' }}>
                                Verdana
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Font Size */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none w-16 justify-between font-normal">
                                <span className="truncate text-xs">
                                    Size
                                </span>
                                <Minus className="h-3 w-3 opacity-50 rotate-90" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-60 overflow-y-auto">
                            {[10, 11, 12, 13, 14, 16, 18, 20, 24, 30, 36, 48, 72].map((size) => (
                                <DropdownMenuItem
                                    key={size}
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run()
                                    }}
                                >
                                    {size}px
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().unsetMark('textStyle').run() }}>
                                Resetar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Basic Formatting */}
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            title="Negrito"
                        >
                            <Bold className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            title="Itálico"
                        >
                            <Italic className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            isActive={editor.isActive('underline')}
                            title="Sublinhado"
                        >
                            <UnderlineIcon className="h-4 w-4" />
                        </ToolbarButton>
                    </div>

                    {/* Alignment */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none hover:bg-slate-100">
                                <AlignLeft className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }}>
                                <AlignLeft className="h-4 w-4 mr-2" /> Esquerda
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }}>
                                <AlignCenter className="h-4 w-4 mr-2" /> Centralizado
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }}>
                                <AlignRight className="h-4 w-4 mr-2" /> Direita
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run() }}>
                                <AlignJustify className="h-4 w-4 mr-2" /> Justificado
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Headings */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none hover:bg-slate-100">
                                <Heading1 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Estilos</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}>
                                <Heading1 className="h-4 w-4 mr-2" /> Título 1
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}>
                                <Heading2 className="h-4 w-4 mr-2" /> Título 2
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}>
                                <Heading3 className="h-4 w-4 mr-2" /> Título 3
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run() }}>
                                <Type className="h-4 w-4 mr-2" /> Texto Normal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Lists */}
                    <div className="flex items-center gap-1 border-r pr-2 mr-2">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                        >
                            <List className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </ToolbarButton>
                    </div>

                    {/* Tables */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none hover:bg-slate-100">
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }}>
                                <TableIcon className="h-4 w-4 mr-2" /> Inserir Tabela
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run() }} disabled={!editor.can().addColumnAfter()}>
                                <Columns className="h-4 w-4 mr-2" /> Adicionar Coluna
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run() }} disabled={!editor.can().deleteColumn()}>
                                <Columns className="h-4 w-4 mr-2 text-red-500" /> Remover Coluna
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run() }} disabled={!editor.can().addRowAfter()}>
                                <Rows className="h-4 w-4 mr-2" /> Adicionar Linha
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run() }} disabled={!editor.can().deleteRow()}>
                                <Rows className="h-4 w-4 mr-2 text-red-500" /> Remover Linha
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Media */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 rounded-none hover:bg-slate-100">
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => document.getElementById('image-upload-input')?.click()}>
                                <Upload className="h-4 w-4 mr-2" /> Carregar Foto (Arquivo)
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                                const url = window.prompt('URL da Imagem:')
                                if (url) {
                                    editor.chain().focus().setImage({ src: url }).run()
                                }
                            }}>
                                <ImageIcon className="h-4 w-4 mr-2" /> Inserir Imagem (URL)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                        type="file"
                        id="image-upload-input"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    {/* Charts */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-r pr-2 mr-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
                                    <DropdownMenuItem key={chart.id} onSelect={() => addChart(chart.id)}>
                                        <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {chart.title}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Export */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 border-l pl-2 ml-2 text-green-700 hover:text-green-800 hover:bg-green-50">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline text-xs font-semibold">Exportar</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Formatos</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={exportToWord}>
                                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                Microsoft Word (.docx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => window.print()}>
                                <Printer className="h-4 w-4 mr-2 text-gray-600" />
                                Imprimir / PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            )}

            <div className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center print:bg-white print:p-0 print:overflow-visible">
                <div
                    id="print-area"
                    className="print:transform-none print:m-0 print:w-full"
                    style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    )
})

RichTextEditor.displayName = 'RichTextEditor'
