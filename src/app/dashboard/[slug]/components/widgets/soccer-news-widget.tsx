
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { ExternalLink, Settings2, RefreshCw, Shield, Trophy } from "lucide-react"
import { fetchGeNews } from "../../actions"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

// Lista de times apenas com texto (Sem imagens para evitar quebras)
const TEAMS = [
    { label: 'Atlético-MG', value: 'atletico-mg' },
    { label: 'Cruzeiro', value: 'cruzeiro' },
    { label: 'América-MG', value: 'america-mg' },
    { label: 'Flamengo', value: 'flamengo' },
    { label: 'Vasco', value: 'vasco' },
    { label: 'Fluminense', value: 'fluminense' },
    { label: 'Botafogo', value: 'botafogo' },
    { label: 'Corinthians', value: 'corinthians' },
    { label: 'Palmeiras', value: 'palmeiras' },
    { label: 'São Paulo', value: 'sao-paulo' },
    { label: 'Santos', value: 'santos' },
    { label: 'Grêmio', value: 'gremio' },
    { label: 'Internacional', value: 'internacional' },
    { label: 'Bahia', value: 'bahia' },
    { label: 'Vitória', value: 'vitoria' },
    { label: 'Fortaleza', value: 'fortaleza' },
    { label: 'Ceará', value: 'ceara' },
    { label: 'Athletico-PR', value: 'athletico-pr' },
    { label: 'Coritiba', value: 'coritiba' },
    { label: 'Sport', value: 'sport' },
]

export function SoccerNewsWidget() {
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [teamSlug, setTeamSlug] = useState('atletico-mg')

    useEffect(() => {
        // Load preference
        const saved = localStorage.getItem('soccer_widget_team')
        if (saved) setTeamSlug(saved)
    }, [])

    useEffect(() => {
        loadNews()
    }, [teamSlug])

    const loadNews = () => {
        setLoading(true)
        fetchGeNews(teamSlug)
            .then(items => {
                setNews(items.slice(0, 5))
            })
            .catch(err => console.error("Failed to fetch news", err))
            .finally(() => setLoading(false))
    }

    const handleTeamChange = (slug: string) => {
        setTeamSlug(slug)
        localStorage.setItem('soccer_widget_team', slug)
    }

    const currentTeam = TEAMS.find(t => t.value === teamSlug)
    const currentTeamName = currentTeam?.label || 'Futebol'

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600">
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle className="text-base font-semibold text-gray-900 leading-none">
                            {currentTeamName}
                        </CardTitle>
                        <span className="text-[10px] text-muted-foreground font-medium mt-1">Notícias do GE</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-100">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] max-h-[300px]">
                            <DropdownMenuLabel>Escolher Time</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="h-[200px]">
                                {TEAMS.map(team => (
                                    <DropdownMenuItem
                                        key={team.value}
                                        onSelect={() => handleTeamChange(team.value)}
                                        className={`flex items-center gap-2 cursor-pointer ${teamSlug === team.value ? "bg-slate-100 font-medium" : ""}`}
                                    >
                                        <Shield className="w-3 h-3 opacity-50" />
                                        {team.label}
                                    </DropdownMenuItem>
                                ))}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <a href={`https://ge.globo.com/futebol/times/${teamSlug}/`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-700 hover:bg-green-50">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Atualizando...
                    </div>
                ) : (
                    <ScrollArea className="h-[300px] pr-3">
                        <ul className="space-y-3">
                            {news.map((item, i) => (
                                <li key={i} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 border-dashed">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-medium hover:underline hover:text-green-800 leading-snug"
                                    >
                                        {item.title}
                                    </a>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        {item.pubDate}
                                    </span>
                                </li>
                            ))}
                            {!news.length && (
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    Sem notícias recentes.
                                </div>
                            )}
                        </ul>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
