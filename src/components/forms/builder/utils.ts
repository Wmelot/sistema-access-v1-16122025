
import { arrayMove } from "@dnd-kit/sortable";


export interface FormItem {
    id: string;
    type: string;
    children?: FormItem[];
    // Standard Layout Props
    width?: 'full' | '1/2' | '1/3' | '1/4';

    // Logic & Calculation
    visibilityRules?: {
        action: 'show' | 'hide';
        logicOperator: 'AND' | 'OR';
        conditions: {
            fieldId: string;
            operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
            value: any;
        }[];
    };
    calculation?: {
        formula: string; // e.g. "field_123 + field_456"
        targetWidgetId?: string;
    };

    [key: string]: any;
}


export const findNode = (items: FormItem[], id: string): FormItem | undefined => {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findNode(item.children, id);
            if (found) return found;
        }
    }
    return undefined;
};

export const findPath = (items: FormItem[], id: string, path: FormItem[] = []): FormItem[] | null => {
    for (const item of items) {
        if (item.id === id) return [...path, item];
        if (item.children) {
            const foundPath = findPath(item.children, id, [...path, item]);
            if (foundPath) return foundPath;
        }
    }
    return null;
};

// Returns the array containing the item, and the index
export const findContainerArray = (items: FormItem[], id: string): { container: FormItem[], index: number, parent: FormItem | null } | null => {
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) return { container: items, index, parent: null };

    for (const item of items) {
        if (item.children) {
            const found = findContainerArray(item.children, id);
            if (found) {
                if (found.parent === null) {
                    // It was found in this item's children directly
                    return { container: item.children, index: found.index, parent: item };
                }
                return found;
            }
        }
    }
    return null;
};

export const removeNode = (items: FormItem[], id: string): FormItem[] => {
    return items.reduce((acc: FormItem[], item) => {
        if (item.id === id) return acc;
        if (item.children) {
            return [...acc, { ...item, children: removeNode(item.children, id) }];
        }
        return [...acc, item];
    }, []);
};

export const insertNode = (items: FormItem[], parentId: string | null, index: number, newNode: FormItem): FormItem[] => {
    if (parentId === null) {
        // Insert at root
        const newItems = [...items];
        newItems.splice(index, 0, newNode);
        return newItems;
    }

    return items.map(item => {
        if (item.id === parentId) {
            const newChildren = item.children ? [...item.children] : [];
            newChildren.splice(index, 0, newNode);
            return { ...item, children: newChildren };
        }
        if (item.children) {
            return { ...item, children: insertNode(item.children, parentId, index, newNode) };
        }
        return item;
    });
};

export const moveNode = (items: FormItem[], activeId: string, overId: string): FormItem[] => {
    const activeInfo = findContainerArray(items, activeId);
    const overInfo = findContainerArray(items, overId);

    if (!activeInfo || !overInfo) return items;

    const activeContainer = activeInfo.container;
    const overContainer = overInfo.container;

    // If stable (same container), just reorder
    if (activeContainer === overContainer) {
        const activeIndex = activeContainer.findIndex(i => i.id === activeId);
        const overIndex = activeContainer.findIndex(i => i.id === overId);

        if (activeIndex !== overIndex) {
            // We need to clone the structure to avoid mutation
            // But since we need to return the FULL ROOT items with the change, 
            // and arrayMove only returns the modified array...
            // We need a way to splicing it back in.

            // Actually, simpler logic:
            // 1. Remove active
            // 2. Insert at new pos
            // But doing this 'In Place' deep in the tree is hard with immutable pattern.

            // Let's use a mutable clone for simplicity in complex trees, then return it? 
            // Or better, standard immutable with helper.

            // Special Case: Root
            if (!activeInfo.parent) {
                return arrayMove(items, activeIndex, overIndex);
            }

            // Case: Nested
            // We can reuse insertNode/removeNode but that's 2 passes.
            // Let's create a specialized 'replaceChildren' helper?

            const newChildren = arrayMove(activeContainer, activeIndex, overIndex);
            return updateNodeChildren(items, activeInfo.parent.id, newChildren);
        }
        return items;
    }

    // Moving between containers
    // 1. Remove from old
    // 2. Insert into new
    const activeNode = findNode(items, activeId);
    if (!activeNode) return items;

    let newItems = removeNode(items, activeId);

    // Recalculate overIndex because the tree changed (if removing from same branch affected indices?)
    // Usually safe if we grab 'overId' position again.

    // IMPORTANT: When moving to a different container, we need to know the target index.
    // 'overId' is the item we are hovering OVER.
    // If dragging A over B, we likely want to place A *after* or *before* B.

    // We need to find the fresh location of 'overId' in 'newItems'
    const freshOverInfo = findContainerArray(newItems, overId);
    if (!freshOverInfo) {
        // Must have been deleted? Should not happen.
        return newItems;
    }

    // Logic: If dragging downwards, insert after. If upwards, before.
    // But cross-container, we usually just insert At index of Over.
    // Let's defaulting to 'index' (before).

    // Wait, if overId is a CONTAINER itself, we might want to insert INSIDE it?
    // This is "Collapsing" logic.
    // For now, let's assume we are dragging over a LEAF sibling.

    const targetParentId = freshOverInfo.parent ? freshOverInfo.parent.id : null;
    return insertNode(newItems, targetParentId, freshOverInfo.index, activeNode);
};

export const updateNodeChildren = (items: FormItem[], nodeId: string, newChildren: FormItem[]): FormItem[] => {
    return items.map(item => {
        if (item.id === nodeId) {
            return { ...item, children: newChildren };
        }
        if (item.children) {
            return { ...item, children: updateNodeChildren(item.children, nodeId, newChildren) };
        }
        return item;
    });
};

export const updateNodeProp = (items: FormItem[], nodeId: string, key: string | object, value?: any): FormItem[] => {
    return items.map(item => {
        if (item.id === nodeId) {
            if (key && typeof key === 'object') {
                return { ...item, ...key };
            }
            if (typeof key === 'string') {
                return { ...item, [key]: value };
            }
        }
        if (item.children) {
            return { ...item, children: updateNodeProp(item.children, nodeId, key, value) };
        }
        return item;
    });
};
