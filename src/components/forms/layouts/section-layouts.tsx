import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Settings, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Helper to render icon dynamically
const DynamicIcon = ({ name, className }: { name?: string, className?: string }) => {
    if (!name) return null;
    // @ts-ignore
    const Icon = LucideIcons[name];
    if (!Icon) return null;
    return <Icon className={className} />;
};

export interface SectionCardProps {
    children: React.ReactNode;
    title: string;
    icon?: string;
    description?: string;
    backgroundColor?: string;
    className?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    isEditing?: boolean;
}

export function SectionCard({ children, title, icon, description, backgroundColor, className, onEdit, onDelete, isEditing }: SectionCardProps) {
    return (
        <Card className={cn("overflow-hidden border-slate-200 shadow-sm", className)}>
            <CardHeader className={cn("border-b px-6 py-4", backgroundColor || "bg-slate-50")}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon && <div className="p-2 bg-white rounded-lg shadow-sm text-slate-600"><DynamicIcon name={icon} className="h-5 w-5" /></div>}
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-800">{title}</CardTitle>
                            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                        </div>
                    </div>
                    {isEditing && (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Settings className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

export interface AccordionSectionProps {
    children: React.ReactNode;
    title: string;
    icon?: string;
    defaultOpen?: boolean;
    className?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    isEditing?: boolean;
}

export function AccordionSection({ children, title, icon, defaultOpen = false, className, onEdit, onDelete, isEditing }: AccordionSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("border border-slate-200 rounded-xl bg-white shadow-sm", className)}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-transparent data-[state=open]:border-slate-100">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="p-0 hover:bg-transparent flex-1 justify-start h-auto font-semibold text-slate-800 text-base">
                        {isOpen ? <ChevronDown className="h-5 w-5 mr-2 text-slate-400" /> : <ChevronRight className="h-5 w-5 mr-2 text-slate-400" />}
                        {icon && <DynamicIcon name={icon} className="h-4 w-4 mr-2 text-slate-500" />}
                        {title}
                    </Button>
                </CollapsibleTrigger>
                {isEditing && (
                    <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Settings className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                )}
            </div>
            <CollapsibleContent className="p-4 space-y-4 animate-accordion-down">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
