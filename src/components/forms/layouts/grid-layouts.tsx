import React from 'react';
import { cn } from '@/lib/utils';
import { Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GridRowProps {
    children: React.ReactNode;
    className?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    isEditing?: boolean;
}

export function GridRow({ children, className, onEdit, onDelete, isEditing }: GridRowProps) {
    return (
        <div className={cn("group relative flex flex-wrap gap-4 p-4 border border-dashed border-slate-200 rounded-lg hover:border-slate-400 transition-colors bg-slate-50/30", className)}>
            {isEditing && (
                <div className="absolute -top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-white shadow-sm" onClick={onEdit}>
                        <Settings className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-white shadow-sm text-red-500 hover:text-red-600" onClick={onDelete}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            )}
            {children}
        </div>
    );
}

export interface GridColumnProps {
    children: React.ReactNode;
    width?: '100%' | '50%' | '33%' | '66%' | '25%' | '75%';
    className?: string;
}

export function GridColumn({ children, width = '100%', className }: GridColumnProps) {
    const widthClass = {
        '100%': 'w-full',
        '75%': 'w-full md:w-3/4',
        '66%': 'w-full md:w-2/3',
        '50%': 'w-full md:w-1/2',
        '33%': 'w-full md:w-1/3',
        '25%': 'w-full md:w-1/4'
    }[width];

    return (
        <div className={cn("min-w-[200px] flex-grow basis-0", widthClass, className)}>
            {children}
        </div>
    );
}
