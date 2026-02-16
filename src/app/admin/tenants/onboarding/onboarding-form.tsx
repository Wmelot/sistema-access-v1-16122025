'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { onboardNewClinic } from './actions'
import { toast } from 'sonner'
import { Loader2, Rocket, Building2, User, Shield } from 'lucide-react'

const AVAILABLE_PLANS = [
    { label: 'Free (Demo)', slug: 'free' },
    { label: 'Pro (Essencial)', slug: 'pro' },
    { label: 'Premium (Ilimitado)', slug: 'premium' },
    { label: 'Personalizado / Legado', slug: 'personalized' },
]

const EXTRA_FEATURES = [
    { id: 'smart_pbe', label: 'IA Evidence Auditor (PBE)' },
    { id: 'biomechanics_lab', label: 'Laboratório Biomecânico (Avançado)' },
    { id: 'financial_lock', label: 'Trava Financeira Rigorosa' },
    { id: 'whatsapp_integration', label: 'Integração WhatsApp (Z-API)' },
]

export function OnboardingForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        ownerEmail: '',
        planSlug: 'pro',
    })
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

    function updateSlug(name: string) {
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/--+/g, "-")
            .trim()
        setFormData(prev => ({ ...prev, name, slug }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.name || !formData.ownerEmail || !formData.slug) {
            toast.error('Preencha os campos obrigatórios.')
            return
        }

        setIsLoading(true)
        const res = await onboardNewClinic({
            ...formData,
            features: selectedFeatures
        })
        setIsLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Clínica ativada com sucesso!')
            router.push(`/admin/tenants/${res.orgId}`)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Dados da Organização
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome Fantasia</Label>
                            <Input
                                placeholder="Ex: Clínica Saúde Viva"
                                value={formData.name}
                                onChange={(e) => updateSlug(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug (URL do Dashboard)</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400">/dashboard/</span>
                                <Input
                                    placeholder="clinica-saude-viva"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Proprietário / Master
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>E-mail do Dono</Label>
                            <Input
                                type="email"
                                placeholder="dono@email.com"
                                value={formData.ownerEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                            />
                            <p className="text-[10px] text-zinc-500 italic">O usuário já deve estar cadastrado no sistema (Auth).</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Plano de Assinatura</Label>
                            <Select
                                value={formData.planSlug}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, planSlug: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_PLANS.map(p => (
                                        <SelectItem key={p.slug} value={p.slug}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Recursos Adicionais (Override)
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Habilite recursos além do que o plano padrão oferece.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {EXTRA_FEATURES.map((feature) => (
                            <div key={feature.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                                <Checkbox
                                    id={feature.id}
                                    checked={selectedFeatures.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedFeatures(prev => [...prev, feature.id])
                                        else setSelectedFeatures(prev => prev.filter(id => id !== feature.id))
                                    }}
                                />
                                <Label htmlFor={feature.id} className="text-xs font-medium cursor-pointer flex-1">
                                    {feature.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                <Button
                    className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2 px-8"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    Finalizar Ativação
                </Button>
            </div>
        </form>
    )
}
