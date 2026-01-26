'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, ShoppingCart, MessageSquare, DollarSign, Brain, Lock } from "lucide-react"
import { getMarketplaceItems, activateFeature } from "../actions"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ICON_MAP: Record<string, any> = {
    MessageSquare: MessageSquare,
    DollarSign: DollarSign,
    Brain: Brain
}

export function Marketplace({ slug }: { slug: string }) {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [password, setPassword] = useState("")
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        loadItems()
    }, [])

    const loadItems = async () => {
        setLoading(true)
        try {
            const data = await getMarketplaceItems(slug)
            setItems(data)
        } catch (e) {
            toast.error("Erro ao carregar loja")
        } finally {
            setLoading(false)
        }
    }

    const handleActivate = async () => {
        setConfirming(true)
        try {
            const res = await activateFeature(slug, selectedItem.feature_key, password)
            if (res.success) {
                toast.success(`${selectedItem.name} ativado com sucesso!`)
                setSelectedItem(null)
                setPassword("")
                loadItems()
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error("Erro na ativação")
        } finally {
            setConfirming(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                <p className="text-zinc-500 text-sm">Carregando recursos disponíveis...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                    const Icon = ICON_MAP[item.icon] || MessageSquare
                    return (
                        <Card key={item.id} className={`relative overflow-hidden transition-all hover:shadow-md ${item.isActive ? 'border-emerald-200 bg-emerald-50/10' : ''}`}>
                            {item.isActive && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        ATIVO
                                    </div>
                                </div>
                            )}
                            <CardHeader>
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-2 ${item.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl">{item.name}</CardTitle>
                                <CardDescription className="min-h-[40px] leading-relaxed">
                                    {item.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">R$ {item.price}</span>
                                    <span className="text-zinc-500 text-sm">/mês</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                {item.isActive ? (
                                    <Button variant="outline" className="w-full border-emerald-200 text-emerald-600 bg-emerald-50 pointer-events-none">
                                        Serviço Habilitado
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Contratar Agora
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-indigo-600" />
                            Confirmar Contratação
                        </DialogTitle>
                        <DialogDescription>
                            Você está prestes a ativar o recurso <strong>{selectedItem?.name}</strong> por <strong>R$ {selectedItem?.price}/mês</strong>.
                            O valor será adicionado à sua próxima fatura.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Para confirmar, insira sua senha de acesso:</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Sua senha secreta"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedItem(null)} disabled={confirming}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleActivate}
                            disabled={confirming || !password}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                            Confirmar e Ativar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
