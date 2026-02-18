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
}

export function ManagementHeader({ slug, title, description, children }: ManagementHeaderProps) {
    const { showLoading } = useGlobalLoader()

    return (
        <div className="flex flex-col gap-4 mb-2">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/${slug}/management`}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-9 w-9 border-slate-200 hover:bg-slate-50 transition-all shadow-sm group"
                        onClick={() => showLoading("Voltando para Gestão")}
                    >
                        <ChevronLeft className="h-5 w-5 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
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
