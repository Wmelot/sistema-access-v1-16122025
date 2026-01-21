
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ExternalLink, MapPin, Quote } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchGoogleReviews } from "../../actions"

export function GoogleReviewsWidget() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Fallback link if API fails or not configured
    const FALLBACK_URL = "https://share.google/zWxqhd4KOZa7ajBB0"

    useEffect(() => {
        fetchGoogleReviews()
            .then(res => {
                if (res) setData(res)
            })
            .catch(err => console.error("Reviews fetch error", err))
            .finally(() => setLoading(false))
    }, [])

    const reviews = data?.reviews || []
    const rating = data?.rating || 5.0
    const total = data?.userRatingCount || 0
    const url = data?.googleMapsUri || FALLBACK_URL
    const displayReviews = reviews.slice(0, 3) // Show top 3 recent

    return (
        <Card className="h-full bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Quote className="h-24 w-24" />
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-900 gap-2">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>Google Meu Negócio</span>
                    </div>
                    {data && (
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <span className="text-xs font-bold text-green-700">{rating}</span>
                            <Star className="h-3 w-3 fill-green-600 text-green-600" />
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-60px)]">

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                        Carregando avaliações...
                    </div>
                ) : !data ? (
                    // Fallback State (No API Key or Error)
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Veja nossas avaliações no Google.
                        </p>
                        <Button variant="outline" size="sm" asChild className="w-full">
                            <a href={FALLBACK_URL} target="_blank" rel="noreferrer">
                                Ver tudo <ExternalLink className="h-3 w-3 ml-2" />
                            </a>
                        </Button>
                    </div>
                ) : (
                    // Active State (Reviews loaded)
                    <div className="flex flex-col gap-3 h-full">
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                            {displayReviews.map((review: any, i: number) => (
                                <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-semibold text-gray-800">{review.authorAttribution?.displayName || 'Anônimo'}</div>
                                        <div className="flex">
                                            {Array.from({ length: 5 }).map((_, starI) => (
                                                <Star
                                                    key={starI}
                                                    className={`h-2.5 w-2.5 ${starI < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 line-clamp-3 italic">"{review.originalText?.text || review.text?.text || 'Sem comentário'}"</p>
                                    <div className="mt-1 text-[10px] text-gray-400 text-right">
                                        {review.publishTime ? new Date(review.publishTime).toLocaleDateString('pt-BR') : ''}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button variant="ghost" size="sm" asChild className="w-full text-xs text-blue-600 hover:text-blue-700 h-8 mt-auto shrink-0">
                            <a href={url} target="_blank" rel="noreferrer">
                                Ver todas ({total}) <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
