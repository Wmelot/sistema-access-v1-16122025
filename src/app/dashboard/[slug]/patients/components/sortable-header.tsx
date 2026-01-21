'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SortableHeaderProps {
    label: string
    column: string
    className?: string
}

export function SortableHeader({ label, column, className }: SortableHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentSort = searchParams.get('sort')
    const currentOrder = searchParams.get('order')

    const isSorted = currentSort === column
    const isAsc = currentOrder === 'asc'

    const handleClick = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (isSorted) {
            // Toggle order
            params.set('order', isAsc ? 'desc' : 'asc')
        } else {
            // Set new sort
            params.set('sort', column)
            params.set('order', 'asc') // Default to asc
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
            onClick={handleClick}
        >
            <span>{label}</span>
            {isSorted ? (
                isAsc ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </Button>
    )
}
