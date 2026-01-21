"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updatePaymentFee } from "./actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Fee {
    id: string
    method: string
    installments: number
    fee_percent: number
}

export function FeesTab({ fees }: { fees: Fee[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const handleEdit = (fee: Fee) => {
        setEditingId(fee.id)
        setEditValue(fee.fee_percent.toString())
    }

    const handleSave = async (id: string) => {
        const val = parseFloat(editValue)
        if (isNaN(val) || val < 0) {
            toast.error("Valor inválido")
            return
        }

        setLoading(true)
        const res = await updatePaymentFee(id, val)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Taxa atualizada!")
            setEditingId(null)
        }
    }

    const formatMethod = (method: string) => {
        if (method === 'pix') return 'Pix'
        if (method === 'debit_card') return 'Débito'
        if (method === 'credit_card') return 'Crédito'
        return method
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Taxas das Maquininhas</CardTitle>
                <CardDescription>
                    Configure as taxas cobradas pela operadora do cartão.
                    Essas taxas serão descontadas automaticamente no cálculo do "Valor Líquido".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Método</TableHead>
                            <TableHead>Parcelas</TableHead>
                            <TableHead>Taxa (%)</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fees.map((fee) => (
                            <TableRow key={fee.id}>
                                <TableCell className="font-medium">{formatMethod(fee.method)}</TableCell>
                                <TableCell>{fee.installments}x</TableCell>
                                <TableCell>
                                    {editingId === fee.id ? (
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-24 h-8"
                                        />
                                    ) : (
                                        <span>{fee.fee_percent}%</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === fee.id ? (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSave(fee.id)}
                                                disabled={loading}
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(fee)}>Editar</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
