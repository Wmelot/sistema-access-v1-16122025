
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { FormItem } from '../utils';

interface LogicEditorProps {
    field: FormItem;
    allFields: FormItem[];
    onChange: (updates: Partial<FormItem>) => void;
}

export const LogicEditor = ({ field, allFields, onChange }: LogicEditorProps) => {
    // Flatten fields for selection (simple list of potential dependencies)
    // We might want to filter out the current field itself to avoid recursion, 
    // although generic "allFields" might be tree, so we need to flatten it.

    const flattenFields = (items: FormItem[]): FormItem[] => {
        let flat: FormItem[] = [];
        items.forEach(item => {
            flat.push(item);
            if (item.children) {
                flat = [...flat, ...flattenFields(item.children)];
            }
        });
        return flat;
    };

    const flatFields = flattenFields(allFields).filter(f => f.id !== field.id);

    const [visibilityRules, setVisibilityRules] = useState(field.visibilityRules || {
        action: 'show',
        logicOperator: 'AND',
        conditions: []
    });

    const [calculation, setCalculation] = useState(field.calculation || {
        formula: '',
        targetWidgetId: ''
    });

    // Update local state when field changes (e.g. if switching fields)
    useEffect(() => {
        setVisibilityRules(field.visibilityRules || {
            action: 'show',
            logicOperator: 'AND',
            conditions: []
        });
        setCalculation(field.calculation || {
            formula: '',
            targetWidgetId: ''
        });
    }, [field]);

    const handleSaveVisibility = (newRules: any) => {
        setVisibilityRules(newRules);
        onChange({ visibilityRules: newRules });
    };

    const handleSaveCalculation = (newCalc: any) => {
        setCalculation(newCalc);
        onChange({ calculation: newCalc });
    };

    const addCondition = () => {
        const newRules = {
            ...visibilityRules,
            conditions: [...visibilityRules.conditions, { fieldId: '', operator: 'eq', value: '' }]
        };
        handleSaveVisibility(newRules);
    };

    const removeCondition = (index: number) => {
        const newConditions = [...visibilityRules.conditions];
        newConditions.splice(index, 1);
        handleSaveVisibility({
            ...visibilityRules,
            conditions: newConditions
        });
    };

    const updateCondition = (index: number, key: string, value: any) => {
        const newConditions = [...visibilityRules.conditions];
        newConditions[index] = { ...newConditions[index], [key]: value };
        handleSaveVisibility({
            ...visibilityRules,
            conditions: newConditions
        });
    };

    return (
        <div className="space-y-6">
            {/* Visibility Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Regras de Visibilidade - (Visibility)</h3>
                    <Button variant="ghost" size="sm" onClick={addCondition}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Regra
                    </Button>
                </div>

                {visibilityRules.conditions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Este campo está sempre visível.</p>
                ) : (
                    <div className="space-y-2 p-3 border rounded-md bg-muted/10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">Ação:</span>
                            <Select
                                value={visibilityRules.action}
                                onValueChange={(val: any) => handleSaveVisibility({ ...visibilityRules, action: val })}
                            >
                                <SelectTrigger className="w-[100px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="show">Mostrar</SelectItem>
                                    <SelectItem value="hide">Esconder</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm">Se:</span>
                            <Select
                                value={visibilityRules.logicOperator}
                                onValueChange={(val: any) => handleSaveVisibility({ ...visibilityRules, logicOperator: val })}
                            >
                                <SelectTrigger className="w-[80px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AND">TODAS</SelectItem>
                                    <SelectItem value="OR">QUALQUER</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm">as condições forem verdadeiras.</span>
                        </div>

                        {visibilityRules.conditions.map((cond, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Select
                                    value={cond.fieldId}
                                    onValueChange={(val) => updateCondition(idx, 'fieldId', val)}
                                >
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue placeholder="Campo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {flatFields.map(f => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.label || f.type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={cond.operator}
                                    onValueChange={(val) => updateCondition(idx, 'operator', val)}
                                >
                                    <SelectTrigger className="w-[100px] h-8 text-xs">
                                        <SelectValue placeholder="Op" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="eq">Igual a</SelectItem>
                                        <SelectItem value="neq">Diferente de</SelectItem>
                                        <SelectItem value="gt">Maior que</SelectItem>
                                        <SelectItem value="lt">Menor que</SelectItem>
                                        <SelectItem value="contains">Contém</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    className="h-8 text-xs flex-1"
                                    placeholder="Valor"
                                    value={cond.value}
                                    onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                                />

                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeCondition(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Calculation Section - Only for supported fields? Or all? User said "Soma das respostas... deve aparecer no Widget" */}
            {/* Typically only 'calculated' or 'number' fields hold a calculation result. */}
            {/* But any field could potentially 'push' logic? No, calculations usually 'pull'. */}
            {/* Let's allow it for 'calculated' type primarily, but logic engine could be generic. */}
            {/* If the current field is 'calculated' or 'number', show this section. */}
            {['calculated', 'number', 'score_display'].includes(field.type) && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Cálculo (Math)</h3>
                    <p className="text-xs text-muted-foreground">
                        Use IDs dos campos: {flatFields.map(f => f.id).join(', ')}
                    </p>
                    <div className="space-y-2">
                        <Label>Fórmula</Label>
                        <Input
                            value={calculation.formula}
                            onChange={(e) => handleSaveCalculation({ ...calculation, formula: e.target.value })}
                            placeholder="Ex: field_abc + field_xyz * 2"
                        />
                        <p className="text-xs text-muted-foreground">Supported: +, -, *, /, (, )</p>
                    </div>
                </div>
            )}
        </div>
    );
};
