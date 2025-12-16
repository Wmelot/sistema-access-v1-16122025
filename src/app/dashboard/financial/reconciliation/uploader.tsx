
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Check, X, AlertCircle } from "lucide-react"
import { processBankFile, reconcileTransaction, createTransactionFromBank } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { EditTransactionDialog } from "./edit-dialog"

export function ReconciliationUploader() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [editingTx, setEditingTx] = useState<any>(null)
    const [editOpen, setEditOpen] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)

        try {
            // ZIP Handling
            if (file.name.endsWith('.zip')) {
                // Dynamic import to avoid SSR issues if any (though this is 'use client')
                const { BlobReader, ZipReader, TextWriter } = await import('@zip.js/zip.js')

                const zipReader = new ZipReader(new BlobReader(file))
                const entries = await zipReader.getEntries()
                const processingPromises: Promise<any>[] = []

                for (const entry of entries) {
                    if (entry.directory || entry.filename.includes('__MACOSX') || entry.filename.startsWith('.')) continue

                    const lowerName = entry.filename.toLowerCase()
                    if (lowerName.endsWith('.ofx') || lowerName.endsWith('.csv')) {

                        // We need to wrap this in a promise to handle the password extraction cleanly
                        const extractPromise = (async () => {
                            try {
                                // Try Extracting with Password
                                // Note: getData(writer, options) -> options.password
                                const content = await entry.getData(new TextWriter(), { password: '360604' })

                                // Create a File object from content
                                const subFile = new File([content], entry.filename, { type: 'text/plain' })
                                const formData = new FormData()
                                formData.append('file', subFile)
                                return processBankFile(formData)
                            } catch (err: any) {
                                console.error(`Failed to extract ${entry.filename}:`, err)
                                // If error is password related, we might want to notify
                                if (err.message?.includes('Encrypted') || err.message?.includes('Password')) {
                                    return { error: `Senha incorreta para ${entry.filename}` }
                                }
                                return { error: `Erro ao extrair ${entry.filename}` }
                            }
                        })()

                        processingPromises.push(extractPromise)
                    }
                }

                const results = await Promise.all(processingPromises)
                await zipReader.close()

                // Aggregate results
                let totalImported = 0
                let allTransactions: any[] = []
                let errorCount = 0

                results.forEach(res => {
                    if (res?.error) {
                        errorCount++
                        if (res.error.includes('Senha')) toast.error(res.error)
                    } else if (res?.data) {
                        allTransactions = [...allTransactions, ...res.data]
                        totalImported += res.data.length
                    }
                })

                if (totalImported > 0) {
                    setTransactions(prev => [...prev, ...allTransactions])
                    toast.success(`${totalImported} transações extraídas do ZIP!`)
                }

                if (errorCount > 0) {
                    toast.warning(`${errorCount} arquivo(s) falharam (senha ou formato).`)
                } else if (totalImported === 0) {
                    toast.error("Nenhum arquivo válido (OFX/CSV) encontrado ou senha incorreta.")
                }

            } else {
                // Standard Single File Handling
                const formData = new FormData()
                formData.append('file', file)

                const result = await processBankFile(formData)
                if (result.error) {
                    toast.error(result.error)
                } else if (result.data) {
                    setTransactions(prev => [...prev, ...(result.data || [])])
                    toast.success(`${result.data.length} transações importadas!`)
                }
            }

        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar arquivo.")
        } finally {
            setLoading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const handleConfirm = async (tx: any) => {
        // Optimistic update using fitId
        setTransactions(prev => prev.filter(t => t.fitId !== tx.fitId))

        try {
            const res = await reconcileTransaction(tx.bank_id, tx.suggested_match?.id)
            if (!res.succes) throw new Error()
            toast.success("Conciliado com sucesso!")
        } catch {
            toast.error("Erro ao conciliar.")
            setTransactions(prev => [...prev, tx]) // Revert
        }
    }

    const onCloneClick = (tx: any) => {
        setEditingTx(tx)
        setEditOpen(true)
    }

    const handleCreateFromEdit = async (editedData: any) => {
        // Check fitId from ORIGINAL transaction to remove it
        // The editedData should preserve fitId
        setTransactions(prev => prev.filter(t => t.fitId !== editedData.fitId))
        try {
            await createTransactionFromBank(editedData)
            toast.success("Lançamento criado!")
        } catch {
            toast.error("Erro ao criar.")
            // Revert?
        }
    }

    if (transactions.length > 0) {
        return (
            <div className="space-y-4">
                <EditTransactionDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    transaction={editingTx}
                    onConfirm={handleCreateFromEdit}
                />

                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{transactions.length} Lançamentos Pendentes</h3>
                    <Button variant="outline" onClick={() => setTransactions([])}>Limpar</Button>
                </div>

                <div className="space-y-2">
                    {transactions.map((tx, i) => (
                        <div key={tx.fitId || i} className="flex flex-col md:flex-row items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            {/* Bank Side */}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-muted-foreground">
                                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className={cn(
                                        "font-mono font-bold",
                                        tx.amount < 0 ? "text-red-600" : "text-green-600"
                                    )}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                    </span>
                                </div>
                                <p className="text-sm truncate" title={tx.description}>{tx.description}</p>
                            </div>

                            {/* Match Center */}
                            <div className="mx-4 my-2 md:my-0 flex items-center justify-center">
                                {tx.suggested_match ? (
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border",
                                        tx.suggested_match.type === 'appointment'
                                            ? "bg-purple-50 text-purple-700 border-purple-200"
                                            : "bg-blue-50 text-blue-700 border-blue-200"
                                    )}>
                                        <Check className="h-3 w-3" />
                                        {tx.suggested_match.type === 'appointment' ? "Agendamento Encontrado" : "Sugestão Encontrada"}
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-yellow-200">
                                        <AlertCircle className="h-3 w-3" />
                                        Novo
                                    </div>
                                )}
                            </div>

                            {/* Action Side */}
                            <div className="flex-1 flex justify-end gap-2">
                                {tx.suggested_match ? (
                                    <div className="flex items-center gap-2">
                                        <div className="text-right text-xs text-muted-foreground border-r pr-2 mr-2">
                                            <p className="font-medium">{tx.suggested_match.description}</p>
                                            <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.suggested_match.price || tx.suggested_match.amount)}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleConfirm(tx)} className="bg-green-600 hover:bg-green-700">
                                            Confirmar
                                        </Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => onCloneClick(tx)}>
                                        Criar / Editar
                                    </Button>
                                )}
                                <Button size="icon" variant="ghost" className="text-muted-foreground w-8 h-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload de Extrato</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                Arraste seu arquivo OFX, CSV ou <strong>ZIP</strong> aqui.
            </p>
            <Input
                id="file-upload"
                type="file"
                accept=".ofx,.csv,.zip"
                className="hidden"
                onChange={handleFileUpload}
            />
            <Button asChild disabled={loading}>
                <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                    {loading && <Upload className="animate-spin h-4 w-4" />} {/* Reusing Upload icon as spinner for now or just text */}
                    {loading ? "Processando..." : "Selecionar Arquivo"}
                </label>
            </Button>
        </div>
    )
}
