
'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, ExternalLink, RefreshCw, Settings2, Loader2, Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// Import Server Action
import { getPedroEvidence } from "./pedro-actions"

// Categories Config (IDs must match actions.ts)
const PEDRO_CATEGORIES = [
    { id: 'musculoskeletal', label: 'Musculoesquelética' },
    { id: 'sports', label: 'Esportiva' },
    { id: 'gerontology', label: 'Gerontologia' },
    { id: 'neurology', label: 'Neurologia' },
    { id: 'cardiothoracics', label: 'Cardiorrespiratória' },
    { id: 'paediatrics', label: 'Pediatria' },
    { id: 'orthopaedics', label: 'Ortopedia' }
]

interface Article {
    title: string
    link: string
    category: string
    categoryLabel: string
}

export function PedroEvidenceWidget() {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['musculoskeletal', 'sports'])
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)

    // Load Preferences
    useEffect(() => {
        const saved = localStorage.getItem('pedro_widget_prefs')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSelectedCategories(parsed)
                }
            } catch (e) {
                console.error("Failed to parse pedro prefs", e)
            }
        }
    }, [])

    // Fetch Content (via Server Action)
    useEffect(() => {
        let mounted = true

        const load = async () => {
            if (selectedCategories.length === 0) {
                if (mounted) {
                    setArticles([])
                    setLoading(false)
                }
                return
            }

            if (mounted) setLoading(true)

            try {
                const data = await getPedroEvidence(selectedCategories)
                if (mounted) setArticles(data)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()

        return () => { mounted = false }
    }, [selectedCategories])

    const savePrefs = (cats: string[]) => {
        setSelectedCategories(cats)
        localStorage.setItem('pedro_widget_prefs', JSON.stringify(cats))
    }

    const toggleCategory = (catId: string) => {
        const next = selectedCategories.includes(catId)
            ? selectedCategories.filter(c => c !== catId)
            : [...selectedCategories, catId]

        savePrefs(next)
    }

    const handleRefresh = async () => {
        setLoading(true)
        try {
            const data = await getPedroEvidence(selectedCategories)
            setArticles(data)
            toast.success("Evidências atualizadas")
        } catch (e) {
            toast.error("Erro ao atualizar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-3 space-y-0 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-base">Últimas Evidências (PEDro)</CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="end">
                                <h4 className="font-medium text-sm mb-2">Filtrar Áreas</h4>
                                <div className="space-y-2">
                                    {PEDRO_CATEGORIES.map(cat => (
                                        <div key={cat.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`cat-${cat.id}`}
                                                checked={selectedCategories.includes(cat.id)}
                                                onCheckedChange={() => toggleCategory(cat.id)}
                                            />
                                            <Label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">{cat.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <CardDescription className="text-xs truncate">
                    Últimas evidências da Fisioterapia baseada em evidências.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 p-0">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-sm">Buscando atualizações (Servidor)...</span>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground gap-2 text-center">
                        <Info className="h-8 w-8 opacity-50" />
                        <span className="text-sm">
                            {selectedCategories.length === 0
                                ? "Selecione categorias no ícone de engrenagem."
                                : "Nenhum artigo encontrado ou falha na conexão com PEDro."}
                        </span>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="space-y-0 p-4 pt-0 pb-4">
                            {articles.map((article, idx) => (
                                <a
                                    key={idx}
                                    href={article.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block group border-b last:border-0 py-3 hover:bg-muted/30 -mx-4 px-4 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 flex-shrink-0">
                                            {article.categoryLabel}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">PEDro.org.au</span>
                                    </div>
                                    <h5 className="text-sm font-medium leading-tight text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-3">
                                        {article.title}
                                    </h5>
                                    <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground font-medium">
                                        <span>Ler evidência completa</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
