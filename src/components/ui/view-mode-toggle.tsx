'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ViewModeToggleProps {
    viewMode: 'grid' | 'list'
    onViewModeChange: (mode: 'grid' | 'list') => void
    className?: string
}

export function ViewModeToggle({ viewMode, onViewModeChange, className }: ViewModeToggleProps) {
    return (
        <div className={cn("inline-flex items-center rounded-lg border bg-background p-1", className)}>
            <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={cn(
                    "h-8 px-3 gap-2",
                    viewMode === 'grid' && "shadow-sm"
                )}
            >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Grade</span>
            </Button>
            <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={cn(
                    "h-8 px-3 gap-2",
                    viewMode === 'list' && "shadow-sm"
                )}
            >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
            </Button>
        </div>
    )
}
