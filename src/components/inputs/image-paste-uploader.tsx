import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface ImagePasteUploaderProps {
    label: string
    value?: string // base64 or url
    onChange: (value: string | null) => void
    readOnly?: boolean
}

export function ImagePasteUploader({ label, value, onChange, readOnly = false }: ImagePasteUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Compression Helper
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    // Compress to JPEG 0.7
                    resolve(canvas.toDataURL('image/jpeg', 0.7))
                }
                img.onerror = (err) => reject(err)
            }
            reader.onerror = (err) => reject(err)
        })
    }

    // Handle File Processing
    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, envie apenas imagens.')
            return
        }

        try {
            toast.loading('Comprimindo imagem...', { id: 'compression' })
            const compressedBase64 = await compressImage(file)
            onChange(compressedBase64)
            toast.success('Imagem otimizada e carregada!', { id: 'compression' })
        } catch (error) {
            console.error('Erro ao comprimir imagem:', error)
            toast.error('Erro ao processar imagem.', { id: 'compression' })
        }
    }

    // Handle Paste via Context Menu or Keyboard
    const handlePasteFromClipboard = async () => {
        try {
            const items = await navigator.clipboard.read()
            for (const item of items) {
                if (item.types && item.types.some(type => type.startsWith('image/'))) {
                    const blob = await item.getType(item.types.find(type => type.startsWith('image/'))!)
                    const file = new File([blob], "pasted-image.png", { type: blob.type })
                    processFile(file)
                    return
                }
            }
            toast.error('Nenhuma imagem encontrada na área de transferência.')
        } catch (err) {
            console.error(err)
            toast.error('Erro ao acessar área de transferência. Tente Ctrl+V ou use HTTPS.')
        }
    }

    // Paste Event Listener (Keyboard)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (readOnly) return

            // Only handle paste if:
            // 1. This component is focused (activeElement)
            // 2. OR the paste happened inside this container (event target is descendant)
            if (
                document.activeElement === containerRef.current ||
                containerRef.current?.contains(e.target as Node)
            ) {
                if (e.clipboardData?.files.length) {
                    const file = e.clipboardData.files[0]
                    processFile(file)
                }
            }
        }

        const div = containerRef.current
        if (div) {
            div.addEventListener('paste', handlePaste as any)
        }
        return () => {
            if (div) div.removeEventListener('paste', handlePaste as any)
        }
    }, [readOnly, onChange])

    // Drag Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!readOnly) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (readOnly) return

        if (e.dataTransfer.files?.length) {
            processFile(e.dataTransfer.files[0])
        }
    }

    if (readOnly) {
        if (!value) return null // Don't show empty uploaders in report
        return (
            <div className="space-y-2 mb-4 break-inside-avoid">
                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">{label}</h4>
                <div className="rounded-lg border overflow-hidden bg-slate-50 aspect-[4/3] relative">
                    <img src={value} alt={label} className="w-full h-full object-contain" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">{label}</h4>

            <ContextMenu>
                <ContextMenuTrigger>
                    {value ? (
                        <div className="relative rounded-lg border overflow-hidden bg-slate-50 aspect-video group">
                            <img src={value} alt={label} className="w-full h-full object-contain" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onChange(null)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div
                            ref={containerRef}
                            tabIndex={0}
                            className={`
                                border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer transition-colors outline-none
                                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                            `}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById(`upload-${label}`)?.click()}
                            onKeyDown={(e) => {
                                // Paste instruction usually handled by OS, but we can verify focus
                            }}
                        >
                            <input
                                id={`upload-${label}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                            />

                            <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <Upload className="w-6 h-6 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-600">
                                        Clique ou Arraste
                                    </p>
                                    <p className="text-xs">
                                        ou clique aqui e pressione <kbd className="font-mono bg-slate-100 px-1 rounded">Ctrl+V</kbd> para colar
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onSelect={handlePasteFromClipboard}>
                        <Upload className="w-4 h-4 mr-2" />
                        Colar Imagem
                    </ContextMenuItem>
                    <ContextMenuItem
                        onSelect={() => onChange(null)}
                        disabled={!value}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Apagar Imagem
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </div>
    )
}
