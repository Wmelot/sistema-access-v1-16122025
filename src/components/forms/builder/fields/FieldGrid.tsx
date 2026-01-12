
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { extractNumber } from '../field-utils';

interface FieldGridProps {
    field: any;
    value: any;
    onChange?: (val: any) => void;
    isPreview: boolean;
    formValues?: any;
}

export const FieldGrid = ({ field, value, onChange, isPreview, formValues }: FieldGridProps) => {
    // Grid Value Structure: {"row-col": value, "row-label-i": "Custom Label" }
    const gridType = field.gridType || 'radio';
    const firstColMode = field.firstColMode || (field.firstColEditable ? 'editable' : 'default');
    const showTotal = field.showTotalColumn;

    // Grid Resizing Logic
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [resizing, setResizing] = useState<{ index: number, startX: number, startWidth: number } | null>(null);

    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - resizing.startX;
            setColWidths(prev => ({
                ...prev,
                [resizing.index]: Math.max(50, resizing.startWidth + diff) // Min 50px
            }));
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing]);

    const startResize = (e: React.MouseEvent, index: number, currentWidth: number) => {
        e.preventDefault();
        setResizing({ index, startX: e.clientX, startWidth: currentWidth });
    };

    const getRowTotal = (rowIndex: number) => {
        if (!field.columns) return 0;

        // 1. Try summing individual cell values (for Numbers/Text/Checkboxes overridden columns)
        let cellSum = 0;
        let foundCellValues = false;

        field.columns.forEach((_: any, j: number) => {
            const val = value && value[`${rowIndex}-${j}`];
            // Check for valid value (not undefined/null/empty)
            if (val !== undefined && val !== '' && val !== null) {
                foundCellValues = true;
                // extractNumber from RenderField scope
                cellSum += extractNumber(val.toString());
            }
        });

        if (foundCellValues) {
            return cellSum;
        }

        // 2. Fallback to Radio Value (if Grid is Radio-type and no cells override)
        const val = value && value[`${rowIndex}`];
        if (val) {
            const radioSum = extractNumber(val);
            return radioSum;
        }

        return 0;
    };

    const handleGridChange = (r: number, c: number, val: any) => {
        if (!onChange) return;
        const current = typeof value === 'object' ? { ...value } : {};
        if (val === undefined || val === '') delete current[`${r}-${c}`];
        else current[`${r}-${c}`] = val;
        onChange(current);
    };

    const handleRadioChange = (r: number, val: string) => {
        if (!onChange) return;
        const current = typeof value === 'object' ? { ...value } : {}
        current[`${r}`] = val
        onChange(current)
    }

    const handleRowLabelChange = (r: number, val: string) => {
        if (!onChange) return;
        const current = typeof value === 'object' ? { ...value } : {};
        current[`row-label-${r}`] = val;
        onChange(current);
    };

    // ROW MAPPING SYNC [NEW]
    useEffect(() => {
        if (!field.rowMappings || !onChange || !formValues) return;

        // Check if any mapped value is different from current grid value
        let hasChanges = false;
        const current = typeof value === 'object' ? { ...value } : {};

        Object.keys(field.rowMappings).forEach((rowIndexStr) => {
            const sourceId = field.rowMappings[rowIndexStr];
            if (!sourceId) return;

            const sourceVal = formValues[sourceId];
            if (sourceVal !== undefined && sourceVal !== '') {
                // Handle Grid Objects (Summation)
                let finalVal = sourceVal;
                if (typeof sourceVal === 'object' && sourceVal !== null) {
                    let sum = 0;
                    Object.values(sourceVal).forEach((v: any) => {
                        const n = extractNumber(String(v));
                        if (!isNaN(n)) sum += n;
                    });
                    finalVal = sum;
                }

                const targetKey = `${rowIndexStr}-0`; // Col 0
                // Only update if changed to avoid loops
                if (current[targetKey] != finalVal) {
                    current[targetKey] = finalVal;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            onChange(current);
        }
    }, [formValues, field.rowMappings]); // Re-run when form values change

    return (
        <div className="space-y-2">
            <Label className="font-bold">{field.label}</Label>
            <div className="border rounded-md overflow-x-auto bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            {/* Condition: First Col */}
                            {firstColMode !== 'none' && (
                                <th className="p-2 text-left min-w-[150px]">Item</th>
                            )}

                            {field.columns?.map((col: string, i: number) => (
                                <th
                                    key={i}
                                    className="p-2 text-center border-l min-w-[80px] relative group"
                                    style={{ width: colWidths[i] ? `${colWidths[i]}px` : undefined }}
                                >
                                    {col}
                                    {isPreview && (
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/20 transition-colors"
                                            onMouseDown={(e) => startResize(e, i, colWidths[i] || 100)}
                                        />
                                    )}
                                </th>
                            ))}

                            {/* Total Header */}
                            {showTotal && (
                                <th className="p-2 text-center border-l bg-muted font-bold w-[80px]">Total</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {field.rows?.map((row: string, i: number) => (
                            <tr key={i} className="border-t hover:bg-muted/20">
                                {/* First Col */}
                                {firstColMode !== 'none' && (
                                    <td className="p-2 font-medium">
                                        {firstColMode === 'editable' ? (
                                            <Input
                                                value={(value && value[`row-label-${i}`]) || ''}
                                                onChange={(e) => handleRowLabelChange(i, e.target.value)}
                                                placeholder={row}
                                                className="h-8 text-sm"
                                                disabled={!onChange}
                                            />
                                        ) : (
                                            <span>{row}</span>
                                        )}
                                    </td>
                                )}

                                {/* Data Cells */}
                                {field.columns?.map((col: string, j: number) => {
                                    const cellType = field.columnTypes?.[j] || gridType; // Fallback to main type

                                    return (
                                        <td key={j} className="p-2 text-center border-l">
                                            <div className="flex justify-center">
                                                {cellType === 'radio' && (
                                                    <input
                                                        type="radio"
                                                        name={`grid-${field.id}-${i}`}
                                                        checked={(value && value[`${i}`]) === col}
                                                        onChange={() => handleRadioChange(i, col)}
                                                        className="h-4 w-4 accent-primary"
                                                        disabled={!onChange}
                                                    />
                                                )}
                                                {cellType === 'checkbox' && (
                                                    <Checkbox
                                                        checked={(value && value[`${i}-${j}`]) === true}
                                                        onCheckedChange={(checked) => handleGridChange(i, j, checked)}
                                                        disabled={!onChange}
                                                    />
                                                )}
                                                {cellType === 'number' && (
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-20 text-center mx-auto"
                                                        disabled={!onChange}
                                                        value={(value && value[`${i}-${j}`]) || ''}
                                                        onChange={(e) => handleGridChange(i, j, e.target.value)}
                                                    />
                                                )}

                                                {cellType === 'text' && (
                                                    <Input
                                                        type="text"
                                                        className="h-8 w-full min-w-[100px]"
                                                        disabled={!onChange}
                                                        value={(value && value[`${i}-${j}`]) || ''}
                                                        onChange={(e) => handleGridChange(i, j, e.target.value)}
                                                    />
                                                )}

                                                {cellType === 'select_10' && (
                                                    <select
                                                        className="h-8 w-full border rounded text-sm bg-background px-1"
                                                        disabled={!onChange}
                                                        value={(value && value[`${i}-${j}`]) || ''}
                                                        onChange={(e) => handleGridChange(i, j, e.target.value)}
                                                    >
                                                        <option value="">-</option>
                                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}

                                {/* Total Cell */}
                                {showTotal && (
                                    <td className="p-2 text-center border-l bg-muted font-bold w-[80px]">
                                        {getRowTotal(i)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    {/* Footer for Column Calculations */}
                    {(field.columnCalculations && Object.keys(field.columnCalculations).length > 0) && (
                        <tfoot className="bg-muted font-bold border-t-2">
                            <tr>
                                {/* First Col Placeholder */}
                                {firstColMode !== 'none' && <td className="p-2">Total/Média</td>}

                                {field.columns?.map((_: string, j: number) => {
                                    const calcType = field.columnCalculations?.[j];
                                    if (!calcType || calcType === 'none') return <td key={j} className="p-2 border-l"></td>;

                                    const getColTotal = () => {
                                        let sum = 0;
                                        let count = 0;
                                        field.rows?.forEach((_: any, r: number) => {
                                            const val = value && value[`${r}-${j}`];
                                            if (val !== undefined && val !== '' && val !== null) {
                                                const num = extractNumber(val.toString());
                                                sum += num;
                                                count++;
                                            }
                                        });
                                        if (calcType === 'sum') return sum;
                                        if (calcType === 'average') return count > 0 ? (sum / count).toFixed(1) : 0;
                                        return '';
                                    };

                                    return (
                                        <td key={j} className="p-2 text-center border-l text-primary">
                                            {getColTotal()}
                                        </td>
                                    );
                                })}

                                {/* Total Header Placeholder */}
                                {showTotal && <td className="p-2 border-l"></td>}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};
