
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableWidgetProps {
    id: string
    children: React.ReactNode
    className?: string
    isEditing?: boolean
}

export function SortableWidget({ id, children, className, isEditing }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "h-full relative group",
                className,
                isDragging && "cursor-grabbing shadow-2xl"
            )}
        >
            {isEditing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 z-50 p-1.5 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing hover:bg-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Arraste para reordenar"
                >
                    <GripVertical className="w-4 h-4 text-zinc-400" />
                </div>
            )}
            <div className="h-full flex flex-col">
                {children}
            </div>
        </div>
    )
}
