"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function AlphabetFilter() {
    const searchParams = useSearchParams()
    const currentLetter = searchParams.get("letter")

    return (
        <div className="flex flex-nowrap gap-1 mb-4 p-2 bg-muted/20 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-hide items-center">
            <Link href="/dashboard/patients" className="flex-none">
                <Button
                    variant={!currentLetter ? "default" : "ghost"}
                    size="sm"
                    className="h-8 px-3 text-xs font-medium"
                >
                    Todos
                </Button>
            </Link>
            {ALPHABET.map((letter) => (
                <Link key={letter} href={`/dashboard/patients?letter=${letter}`} className="flex-none">
                    <Button
                        variant={currentLetter === letter ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                            "h-8 w-8 p-0 text-xs font-semibold",
                            currentLetter === letter && "bg-primary text-primary-foreground"
                        )}
                    >
                        {letter}
                    </Button>
                </Link>
            ))}
        </div>
    )
}
