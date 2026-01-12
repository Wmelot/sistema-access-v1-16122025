
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { RenderField } from './render-field';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Copy, Edit3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface BuilderNodeProps {
    node: any;
    depth?: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onEdit: (id: string) => void;
    onAddChild?: (parentId: string) => void;
    formValues?: any;
    allFields?: any[]; // For calculations and references
}

export const BuilderNode = ({
    node,
    depth = 0,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    onEdit,
    onAddChild,
    formValues,
    allFields
}: BuilderNodeProps) => {
    // Container Detection
    const isContainer = ['section', 'tab', 'grid', 'group_row'].includes(node.type) || (node.children && Array.isArray(node.children));

    // Sortable Hook
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: node.id, data: { type: node.type, node } });

    // Droppable Hook for Nesting (Visual Feedback)
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `${node.id}::drop-zone`,
        disabled: !isContainer,
        data: {
            parentId: node.id,
            isContainer: true
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    // Specific styling for containers vs fields
    // Compose styles
    const containerClasses = isContainer ? "border-l-4 border-primary/20 pl-4 py-2" : "";
    const selectedClasses = isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50";
    const dropTargetClasses = isOver ? "ring-2 ring-blue-500 bg-blue-50 border-blue-500" : "";

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                if (isContainer) setDroppableRef(node);
            }}
            style={style}
            className={cn("relative group mb-2 transition-all rounded-md", containerClasses, selectedClasses, dropTargetClasses)}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
            }}
        >
            <ContextMenu>
                <ContextMenuTrigger>
                    <div className="flex items-start gap-2">
                        {/* Drag Handle */}
                        <div {...attributes} {...listeners} className="mt-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Render Logic */}
                            <RenderField
                                field={node}
                                isPreview={false} // Builder Mode
                                value={formValues?.[node.id]}
                                formValues={formValues}
                                allFields={allFields}
                            // Pass recursive render callback if needed? 
                            // RenderField currently renders container children recursively? 
                            // Let's check render-field.tsx. 
                            // Case 'group_row' in RenderField uses `field.fields?.map(...)`.
                            // If we want BuilderNode to manage sorting of children, we should NOT let RenderField render children blindly.
                            // We should render children separately HERE if it's a Sortable Container.
                            />

                            {/* If RenderField renders children (like group_row), it renders them as static. 
                                To make children sortable, we need to bypass RenderField's child rendering 
                                OR update RenderField to accept a custom renderer.
                                For now, standard containers (Section, Tab) might be just markers, 
                                but 'group_row' actually contains items.
                                If we want to drop items INTO a group_row in the builder, 
                                we need a Droppable area here.
                             */}
                        </div>

                        {/* Actions (Visible on Hover/Select) */}
                        <div className={cn("flex items-center gap-1 opacity-100 transition-opacity", /* isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100' */)}>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => onDuplicate(node.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDelete(node.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </ContextMenuItem>
                    {isContainer && onAddChild && (
                        <ContextMenuItem onClick={() => onAddChild(node.id)}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Item Aqui
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>
        </div>
    );
};
