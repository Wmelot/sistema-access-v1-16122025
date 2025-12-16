"use client"

import { useState, useEffect } from "react"
import { getTemplateSettingsData, updateTemplatePreference } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Star, StarOff, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function TemplateSettingsPage() {
    const [professionals, setProfessionals] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [preferences, setPreferences] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadInitalData()
    }, [])

    const loadInitalData = async () => {
        const data = await getTemplateSettingsData()
        setProfessionals(data.professionals)
        setTemplates(data.templates)
        setPreferences(data.preferences)
        setIsLoading(false)
    }

    const getPref = (userId: string, templateId: string) => {
        return preferences.find(p => p.user_id === userId && p.template_id === templateId) || { is_allowed: true, is_favorite: false } // Default: allowed, not favorite
    }

    const toggleAllowed = async (userId: string, templateId: string, current: boolean) => {
        // Optimistic update
        const newPrefs = [...preferences]
        const idx = newPrefs.findIndex(p => p.user_id === userId && p.template_id === templateId)
        if (idx !== -1) {
            newPrefs[idx].is_allowed = !current
        } else {
            newPrefs.push({ user_id: userId, template_id: templateId, is_allowed: !current, is_favorite: false })
        }
        setPreferences(newPrefs)

        await updateTemplatePreference(userId, templateId, { is_allowed: !current })
    }

    const toggleFavorite = async (userId: string, templateId: string, current: boolean) => {
        // Reset other favorites for this user first (logic: only 1 favorite?)
        // Ideally yes. For now let's just toggle.

        // Optimistic
        const newPrefs = [...preferences]

        // If setting to true, optional: set others to false
        if (!current) {
            newPrefs.forEach(p => {
                if (p.user_id === userId) p.is_favorite = false
            })
        }

        const idx = newPrefs.findIndex(p => p.user_id === userId && p.template_id === templateId)
        if (idx !== -1) {
            newPrefs[idx].is_favorite = !current
        } else {
            newPrefs.push({ user_id: userId, template_id: templateId, is_favorite: !current, is_allowed: true })
        }
        setPreferences(newPrefs)

        // If setting to true, we might need to batch update others to false in DB, but let's stick to simple toggle for MVP
        await updateTemplatePreference(userId, templateId, { is_favorite: !current })
        toast.success("Favorito atualizado")
    }

    if (isLoading) return <div className="p-8">Carregando...</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Permissões de Prontuário</h1>
                <p className="text-muted-foreground">Defina quais modelos cada profissional pode acessar e seus favoritos.</p>
            </div>

            <div className="grid gap-6">
                {professionals.map(prof => (
                    <Card key={prof.id}>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <Avatar>
                                <AvatarFallback>{prof.full_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{prof.full_name}</CardTitle>
                                <CardDescription className="text-xs">{prof.email}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Modelo</TableHead>
                                        <TableHead className="w-[100px] text-center">Permitido</TableHead>
                                        <TableHead className="w-[100px] text-center">Favorito</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map(tpl => {
                                        const pref = getPref(prof.id, tpl.id)
                                        return (
                                            <TableRow key={tpl.id}>
                                                <TableCell>{tpl.title}</TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={pref.is_allowed !== false} // Default true
                                                        onCheckedChange={() => toggleAllowed(prof.id, tpl.id, pref.is_allowed !== false)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleFavorite(prof.id, tpl.id, pref.is_favorite)}
                                                        className={pref.is_favorite ? "text-yellow-500" : "text-slate-300"}
                                                    >
                                                        {pref.is_favorite ? <Star className="fill-current h-4 w-4" /> : <Star className="h-4 w-4" />}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
