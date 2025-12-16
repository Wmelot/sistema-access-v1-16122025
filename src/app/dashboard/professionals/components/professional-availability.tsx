"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { updateAvailability, getAvailability, updateProfessionalSettings } from "../actions"
import { getLocations } from "../../locations/actions"
import { getProfessional } from "../actions"
import { toast } from "sonner"
import { Loader2, Copy, Plus, Trash2, MapPin, Settings2 } from "lucide-react"
import VMasker from "vanilla-masker"

interface ProfessionalAvailabilityProps {
    professionalId: string
}

const DAYS_OF_WEEK = [
    { id: 1, name: "Segunda-feira" },
    { id: 2, name: "Terça-feira" },
    { id: 3, name: "Quarta-feira" },
    { id: 4, name: "Quinta-feira" },
    { id: 5, name: "Sexta-feira" },
    { id: 6, name: "Sábado" },
    { id: 0, name: "Domingo" },
]

export function ProfessionalAvailability({ professionalId }: ProfessionalAvailabilityProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Data States
    const [slots, setSlots] = useState<any[]>([]) // Flat list of all slots
    const [locations, setLocations] = useState<any[]>([])
    const [settings, setSettings] = useState({ slot_interval: 30, allow_overbooking: false })

    // Copy Dialog State
    const [copyDialogOpen, setCopyDialogOpen] = useState(false)
    const [sourceDay, setSourceDay] = useState<number | null>(null)
    const [targetDays, setTargetDays] = useState<number[]>([])

    useEffect(() => {
        const loadData = async () => {
            const [availData, locsData, profileData] = await Promise.all([
                getAvailability(professionalId),
                getLocations(),
                getProfessional(professionalId)
            ])

            setSlots(availData || [])
            setLocations(locsData || [])
            if (profileData) {
                setSettings({
                    slot_interval: profileData.slot_interval || 30,
                    allow_overbooking: profileData.allow_overbooking || false
                })
            }
            setLoading(false)
        }
        loadData()
    }, [professionalId])

    // --- Settings Handlers ---
    const handleSettingChange = async (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        await updateProfessionalSettings(professionalId, newSettings)
        toast.info("Configuração atualizada.")
    }

    // --- Slot Management ---
    const addSlot = (dayId: number) => {
        const defaultLocation = locations.length > 0 ? locations[0].id : null
        const newSlot = {
            day_of_week: dayId,
            start_time: "08:00", // Default start
            end_time: "12:00",   // Default end
            location_id: defaultLocation,
            temp_id: Math.random().toString(36) // For keying in UI
        }
        setSlots([...slots, newSlot])
    }

    const removeSlot = (indexToRem: number, dayId: number) => {
        const daySlots = slots.filter(s => s.day_of_week === dayId)
        const slotToRemove = daySlots[indexToRem]
        setSlots(slots.filter(s => s !== slotToRemove))
    }

    const updateSlot = (dayId: number, index: number, field: string, value: any) => {
        const daySlots = slots.filter(s => s.day_of_week === dayId)
        const slotToUpdate = daySlots[index]
        const updatedSlot = { ...slotToUpdate, [field]: value }

        // Replace in global list
        setSlots(slots.map(s => s === slotToUpdate ? updatedSlot : s))
    }

    const handleTimeChange = (dayId: number, index: number, field: string, rawValue: string) => {
        const value = VMasker.toPattern(rawValue, "99:99")
        updateSlot(dayId, index, field, value)
    }

    // --- Copy Logic ---
    const openCopyDialog = (dayId: number) => {
        setSourceDay(dayId)
        setTargetDays([]) // Reset
        setCopyDialogOpen(true)
    }

    const executeCopy = () => {
        if (sourceDay === null) return

        const sourceSlots = slots.filter(s => s.day_of_week === sourceDay)

        // Remove existing slots from target days first? Yes, "Copy" usually implies overwrite or append?
        // Usually Overwrite for clarity.
        const newSlots = slots.filter(s => !targetDays.includes(s.day_of_week)) // Keep non-targets

        targetDays.forEach(targetDay => {
            sourceSlots.forEach(src => {
                newSlots.push({
                    ...src,
                    day_of_week: targetDay,
                    id: undefined, // Clear DB ID to ensure insertion
                    temp_id: Math.random().toString()
                })
            })
        })

        setSlots(newSlots)
        setCopyDialogOpen(false)
        toast.success(`Horários copiados para ${targetDays.length} dias!`)
    }

    // --- Main Save ---
    const handleSave = async () => {
        setSaving(true)
        const cleanSlots = slots.map(s => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            location_id: s.location_id
        }))

        const result = await updateAvailability(professionalId, cleanSlots)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Agenda completa salva com sucesso!")
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-6">

            {/* SETTINGS CARD */}
            <Card className="bg-muted/10 border-primary/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Configurações da Grade</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between border p-3 rounded-lg bg-background">
                        <div className="grid gap-1">
                            <Label>Intervalo de Tempo</Label>
                            <span className="text-xs text-muted-foreground">Tamanho dos blocos na agenda visual</span>
                        </div>
                        <Select
                            value={String(settings.slot_interval)}
                            onValueChange={(v) => handleSettingChange('slot_interval', parseInt(v))}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 min</SelectItem>
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="45">45 min</SelectItem>
                                <SelectItem value="60">60 min</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between border p-3 rounded-lg bg-background">
                        <div className="grid gap-1">
                            <Label>Permitir Encaixes</Label>
                            <span className="text-xs text-muted-foreground">Aceitar agendamentos fora da grade regular</span>
                        </div>
                        <Switch
                            checked={settings.allow_overbooking}
                            onCheckedChange={(c) => handleSettingChange('allow_overbooking', c)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SCHEDULE LIST */}
            <Card>
                <CardHeader>
                    <CardTitle>Grade Semanal</CardTitle>
                    <CardDescription>Defina locais e horários de trabalho para cada dia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {DAYS_OF_WEEK.map((day) => {
                        const daySlots = slots.filter(s => s.day_of_week === day.id).sort((a, b) => a.start_time.localeCompare(b.start_time))
                        const hasSlots = daySlots.length > 0

                        return (
                            <div key={day.id} className={`border rounded-xl transition-all ${hasSlots ? 'bg-background border-border shadow-sm' : 'bg-muted/30 border-dashed border-muted-foreground/20'}`}>
                                <div className="p-4 flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Header / Day Name */}
                                    <div className="flex items-center justify-between md:w-48 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-1 rounded-full ${hasSlots ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                            <span className={`font-medium ${hasSlots ? 'text-foreground' : 'text-muted-foreground'}`}>{day.name}</span>
                                        </div>
                                        <div className="flex gap-1 md:hidden">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => addSlot(day.id)}><Plus className="h-4 w-4" /></Button>
                                            {hasSlots && <Button type="button" variant="ghost" size="icon" onClick={() => openCopyDialog(day.id)}><Copy className="h-4 w-4" /></Button>}
                                        </div>
                                    </div>

                                    {/* Slots List */}
                                    <div className="flex-1 space-y-3">
                                        {hasSlots ? daySlots.map((slot, index) => (
                                            <div key={index} className="flex flex-wrap items-center gap-3 bg-muted/50 p-2 rounded-md group">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="text"
                                                        maxLength={5}
                                                        placeholder="00:00"
                                                        className="w-24 h-8 text-sm"
                                                        value={slot.start_time?.slice(0, 5)}
                                                        onChange={(e) => handleTimeChange(day.id, index, 'start_time', e.target.value)}
                                                    />
                                                    <span className="text-muted-foreground text-xs">até</span>
                                                    <Input
                                                        type="text"
                                                        maxLength={5}
                                                        placeholder="00:00"
                                                        className="w-24 h-8 text-sm"
                                                        value={slot.end_time?.slice(0, 5)}
                                                        onChange={(e) => handleTimeChange(day.id, index, 'end_time', e.target.value)}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    <Select
                                                        value={slot.location_id || "none"}
                                                        onValueChange={(v) => updateSlot(day.id, index, 'location_id', v === "none" ? null : v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm bg-background">
                                                            <SelectValue placeholder="Local de Atendimento" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {locations.map(loc => (
                                                                <SelectItem key={loc.id} value={loc.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        {loc.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: loc.color }} />}
                                                                        {loc.name}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                            {locations.length === 0 && <SelectItem value="none" disabled>Nenhum local cadastrado</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeSlot(index, day.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="h-8 flex items-center text-sm text-muted-foreground italic">
                                                Sem horários definidos
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions (Desktop) */}
                                    <div className="hidden md:flex flex-col gap-2 shrink-0">
                                        <Button type="button" variant="outline" size="sm" onClick={() => addSlot(day.id)} className="h-8 w-8 p-0" title="Adicionar Horário">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        {hasSlots && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => openCopyDialog(day.id)} className="h-8 w-8 p-0" title="Copiar Dia">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
                <div className="p-6 border-t bg-muted/10 flex justify-end sticky bottom-0 z-10">
                    <Button type="button" onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px] shadow-md">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar Agenda Completa
                    </Button>
                </div>
            </Card>

            {/* COPY DIALOG */}
            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Copiar Horários</DialogTitle>
                        <DialogDescription>
                            Copiar a grade de <strong>{DAYS_OF_WEEK.find(d => d.id === sourceDay)?.name}</strong> para:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {DAYS_OF_WEEK.filter(d => d.id !== sourceDay).map(day => (
                            <div key={day.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => {
                                setTargetDays(prev => prev.includes(day.id) ? prev.filter(x => x !== day.id) : [...prev, day.id])
                            }}>
                                <Checkbox
                                    checked={targetDays.includes(day.id)}
                                    className="pointer-events-none"
                                />
                                <Label className="cursor-pointer pointer-events-none">{day.name}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={executeCopy} disabled={targetDays.length === 0}>
                            Copiar para {targetDays.length} dias
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
