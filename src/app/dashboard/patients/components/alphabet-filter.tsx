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
        <div className="flex flex-wrap gap-1 mb-4 p-2 bg-muted/20 rounded-lg justify-center sm:justify-start">
            <Link href="/dashboard/patients">
                <Button
                    variant={!currentLetter ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                >
                    Todos
                </Button>
            </Link>
            {ALPHABET.map((letter) => (
                <Link key={letter} href={`/dashboard/patients?letter=${letter}`}>
                    <Button
                        variant={currentLetter === letter ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                            "h-7 w-7 p-0 text-xs",
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
