
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"

// Simple RSS parser via API or Client
// Since we can't easily parse XML in client without CORS issues, 
// we interpret the user's request as "Embed GE" or "Show News".
// We will use a public RSS-to-JSON bridge or just link for now to avoid CORS/Server complexity in this step.
// UPDATE: We can use a Server Action to fetch XML and parse it! That avoids CORS.

import { fetchGeNews } from "../../actions" // We need to add this

export function SoccerNewsWidget() {
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchGeNews()
            .then(items => {
                setNews(items.slice(0, 5))
            })
            .catch(err => console.error("Failed to fetch news", err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-green-700">Notícias do Esporte (GE)</CardTitle>
                <a href="https://ge.globo.com" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-green-700" />
                </a>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-sm text-muted-foreground">Carregando notícias...</div>
                ) : (
                    <ul className="space-y-3">
                        {news.map((item, i) => (
                            <li key={i} className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0">
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-medium hover:underline hover:text-green-800 line-clamp-2"
                                >
                                    {item.title}
                                </a>
                                <span className="text-[10px] text-muted-foreground">{item.pubDate}</span>
                            </li>
                        ))}
                        {!news.length && <div className="text-sm text-muted-foreground">Não foi possível carregar as notícias.</div>}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
