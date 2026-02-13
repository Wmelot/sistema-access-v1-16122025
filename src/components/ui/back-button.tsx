"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function BackButton({ fallbackHref }: { fallbackHref?: string }) {
    const router = useRouter()

    return (
        <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
                // Better usability: Try to go back in history if possible
                // history.length > 1 is a good indicator, but not perfect.
                // We check if there's a referrer from the same host to be safer.
                const hasInternalHistory = typeof window !== 'undefined' &&
                    window.history.length > 1 &&
                    document.referrer.includes(window.location.host);

                if (hasInternalHistory) {
                    router.back()
                } else if (fallbackHref) {
                    router.push(fallbackHref)
                } else {
                    router.back()
                }
            }}
            title="Voltar"
        >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
        </Button>
    )
}
