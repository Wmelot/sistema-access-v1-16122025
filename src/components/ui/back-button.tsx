"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function BackButton() {
    const router = useRouter()

    return (
        <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => router.back()}
            title="Voltar"
        >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
        </Button>
    )
}
