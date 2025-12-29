"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { getOrganizationSettings, updateOrganizationSettings } from "./actions"

export default function OrganizationSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [org, setOrg] = useState<any>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const data = await getOrganizationSettings()
            if (data.error) throw new Error(data.error)
            setOrg(data.org)
        } catch (e) {
            toast.error("Erro ao carregar configurações da clínica")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await updateOrganizationSettings(formData)
            if (res.error) throw new Error(res.error)
            toast.success("Configurações salvas! A página será recarregada para aplicar as mudanças.")
            setTimeout(() => window.location.reload(), 1500)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Identidade da Clínica (White-label)</h2>
                <p className="text-muted-foreground">Personalize o sistema com a marca da sua empresa.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Organização</CardTitle>
                        <CardDescription>Essas informações aparecerão no cabeçalho e em documentos para pacientes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Clínica</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={org?.name}
                                required
                                placeholder="Ex: Access Fisioterapia"
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <Label htmlFor="primary_color">Cor Principal (Hex)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="primary_color"
                                    name="primary_color"
                                    defaultValue={org?.primary_color || '#000000'}
                                    type="color"
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    name="primary_color_text"
                                    defaultValue={org?.primary_color || '#000000'}
                                    className="flex-1 font-mono uppercase"
                                    onChange={(e) => {
                                        // Sync color picker if needed (simplified here)
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Usada em botões e destaques.</p>
                        </div>

                        {/* Logo Upload (Simplified) */}
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo (URL ou Upload)</Label>
                            <div className="flex gap-2 items-center">
                                {org?.logo_url && (
                                    <img src={org.logo_url} alt="Logo Atual" className="h-10 w-auto border rounded bg-gray-50 p-1" />
                                )}
                                <div className="flex-1">
                                    <Input
                                        id="logo_url"
                                        name="logo_url"
                                        defaultValue={org?.logo_url}
                                        placeholder="https://..."
                                    />
                                    {/* Future: Real File Upload */}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Cole a URL do seu logo (ex: Hospedado no Imgur ou similar) por enquanto.</p>
                        </div>

                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </form>
        </div>
    )
}
