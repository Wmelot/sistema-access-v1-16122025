
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ExternalLink, MapPin } from "lucide-react"

export function GoogleReviewsWidget() {
    // User provided link: https://share.google/zWxqhd4KOZa7ajBB0 
    // This is a share link. We'll use it as the target.
    const REVIEWS_URL = "https://share.google/zWxqhd4KOZa7ajBB0"

    return (
        <Card className="h-full bg-gradient-to-br from-white to-blue-50/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Google Meu Negócio
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Sua opinião é importante!</p>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                        Veja nossas avaliações ou deixe seu comentário no Google.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full max-w-[200px] border-blue-200 hover:bg-blue-50 text-blue-700"
                    asChild
                >
                    <a href={REVIEWS_URL} target="_blank" rel="noreferrer">
                        Ver Avaliações
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    )
}
