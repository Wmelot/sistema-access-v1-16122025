"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useGlobalLoader } from "@/components/providers/global-loader-provider"

interface ManagementHeaderProps {
    slug: string
    title: string
    description?: string
    children?: React.ReactNode
    backHref?: string
    backLabel?: string
}

export function ManagementHeader({
    slug,
    title,
    description,
    children,
    backHref,
    backLabel = "Voltar para Gestão"
}: ManagementHeaderProps) {
    const { showLoading } = useGlobalLoader()
    const finalBackHref = backHref || `/dashboard/${slug}/management`

    return (
        <div className="flex flex-col gap-4 mb-2">
            <div className="flex items-center gap-4">
                <Link href={finalBackHref}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm group gap-2"
                        onClick={() => showLoading(backLabel)}
                    >
                        <ChevronLeft className="h-4 w-4 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
                        <span className="text-xs font-bold uppercase tracking-tight text-slate-600 group-hover:text-blue-600">{backLabel}</span>
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                    {description && <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{description}</p>}
                </div>
                {children && (
                    <div className="flex items-center gap-2">
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}
