'use client'

import { useState } from "react"
import { ProfileSchedulingSettings, updateProfileSettings } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Info } from "lucide-react"

interface OptimizationSettingsProps {
    profiles: ProfileSchedulingSettings[]
}

export function OptimizationSettings({ profiles }: OptimizationSettingsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Estratégia de Agenda Inteligente
                </CardTitle>
                <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-md mb-2 border border-blue-100">
                    <p className="font-semibold mb-1">Como funciona:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong className="text-green-700">Aberto:</strong> Disponibilidade total. Mostra todos os horários livres.</li>
                        <li><strong className="text-yellow-700">Otimizado (Híbrido):</strong> Alterna dias com Âncoras e dias Aleatórios (Recomendado).</li>
                        <li><strong className="text-yellow-700">Otimizado (Fixo):</strong> Dias vazios mostram APENAS os horários Âncora.</li>
                        <li><strong className="text-yellow-700">Otimizado (Explorador):</strong> Dias vazios mostram sempre 2 horários aleatórios.</li>
                        <li><strong className="text-red-700">Rígido:</strong> Apenas horários colados. Bloqueia "buracos".</li>
                    </ul>
                </div>
                <CardDescription>Evite buracos na agenda forçando agendamentos adjacentes ou em horários chave.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {profiles.map(profile => (
                        <ProfileRow key={profile.id} profile={profile} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function ProfileRow({ profile }: { profile: ProfileSchedulingSettings }) {
    const [mode, setMode] = useState<string>((profile.smart_scheduling_mode as any) || 'open')
    const [anchors, setAnchors] = useState<string>(profile.anchor_times?.join(', ') || '08:00, 14:00')
    const [saving, setSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        // Parse anchors
        const anchorList = anchors.split(',').map(s => s.trim()).filter(s => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(s))

        const res = await updateProfileSettings(profile.id, mode, anchorList)
        if (res.success) {
            toast.success("Configuração salva")
            setIsDirty(false)
        } else {
            toast.error("Erro ao salvar")
        }
        setSaving(false)
    }

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-xl bg-slate-50/50 gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{profile.full_name}</h3>
                    <div className="flex gap-2 mt-1">
                        {mode === 'open' && <Badge variant="outline" className="text-[10px] uppercase font-bold text-green-600 border-green-200 bg-green-50">Modo Aberto</Badge>}
                        {mode.startsWith('optimized') && <Badge variant="outline" className="text-[10px] uppercase font-bold text-yellow-600 border-yellow-200 bg-yellow-50">Modo Otimizado</Badge>}
                        {mode === 'strict' && <Badge variant="outline" className="text-[10px] uppercase font-bold text-red-600 border-red-200 bg-red-50">Modo Rígido</Badge>}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
                <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2">
                    <div className="w-full sm:w-48">
                        <Select value={mode} onValueChange={(v) => { setMode(v as any); setIsDirty(true) }}>
                            <SelectTrigger className="h-10 bg-white border-slate-200 font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Aberto (Padrão)</SelectItem>
                                <SelectItem value="optimized">Otimizado (Híbrido)</SelectItem>
                                <SelectItem value="optimized_anchor">Otimizado (Fixo 100%)</SelectItem>
                                <SelectItem value="optimized_random">Otimizado (Explorador)</SelectItem>
                                <SelectItem value="strict">Rígido (Compacto)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {mode !== 'open' && (
                        <div className="w-full sm:w-48">
                            <Input
                                placeholder="Âncoras: 08:00, 14:00"
                                value={anchors}
                                onChange={(e) => { setAnchors(e.target.value); setIsDirty(true) }}
                                title="Horários Âncora (separados por vírgula)"
                                className="h-10 bg-white border-slate-200"
                            />
                        </div>
                    )}

                    <div className="sm:hidden mt-2">
                        {isDirty && (
                            <Button className="w-full font-bold shadow-sm" onClick={handleSave} disabled={saving}>
                                {saving ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="hidden sm:block">
                    {isDirty && (
                        <Button size="sm" className="font-bold shadow-sm" onClick={handleSave} disabled={saving}>
                            {saving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
