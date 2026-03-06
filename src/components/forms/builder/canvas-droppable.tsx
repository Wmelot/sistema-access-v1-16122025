
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { BuilderNode } from './builder-node';
import { Plus } from 'lucide-react';

interface CanvasDroppableProps {
    fields: any[];
    selectedIds: string[];
    onFieldClick: (id: string, e: React.MouseEvent) => void; // Map to onSelect
    onConfigChange: (id: string, key: string, val: any) => void;
    onInsert: (index: number, position: 'before' | 'after') => void;
    // New Props for BuilderNode
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onAddChild?: (parentId: string) => void;
    formValues?: any;
    allFields?: any[];
}

export const CanvasDroppable = ({
    fields,
    selectedIds,
    onFieldClick,
    onConfigChange,
    onInsert,
    onDelete = () => { },
    onDuplicate = () => { },
    onAddChild = () => { },
    formValues,
    allFields
}: CanvasDroppableProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-droppable',
    });

    return (
        <div
            ref={setNodeRef}
            className={`w-full bg-white shadow-sm border rounded-lg min-h-[500px] p-3 h-fit transition-colors relative ${isOver ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' : ''}`}
        >
            <SortableContext items={fields.map(f => f.id)} strategy={rectSortingStrategy}>
                {fields.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12 select-none">
                        <Plus className="h-12 w-12 opacity-50 mb-4" />
                        <p>Arraste os campos aqui para começar</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-start content-start -mx-2">
                        {fields.map((field: any, index: number) => {
                            // Map enum to width percentage for style (or use classes if grid is flex-wrap)
                            const widthMap: Record<string, string> = {
                                'full': '100%',
                                '1/2': '50%',
                                '1/3': '33.333%',
                                '1/4': '25%',
                                '100': '100%' // Legacy fallback
                            };
                            const widthStyle = widthMap[field.width] || '100%';

                            return (
                                <div key={field.id} className="px-2" style={{ width: widthStyle }}>
                                    <BuilderNode
                                        node={field}
                                        isSelected={selectedIds.includes(field.id)}
                                        onSelect={(id) => onFieldClick(id, { stopPropagation: () => { } } as any)} // Adapt event
                                        onDelete={onDelete}
                                        onDuplicate={onDuplicate}
                                        onEdit={(id) => onFieldClick(id, { stopPropagation: () => { } } as any)} // Edit implies select
                                        onAddChild={onAddChild}
                                        formValues={formValues}
                                        allFields={allFields}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </SortableContext>
        </div>
    );
};
