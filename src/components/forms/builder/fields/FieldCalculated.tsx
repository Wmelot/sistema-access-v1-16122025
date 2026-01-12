
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import { extractNumber } from '../field-utils';

interface FieldCalculatedProps {
    field: any;
    formValues: any;
    allFields: any[];
    isPreview: boolean;
}

export const FieldCalculated = ({ field, formValues, allFields, isPreview }: FieldCalculatedProps) => {
    let displayValue = '';

    if (isPreview) {
        try {
            if (field.calculationType === 'custom' && field.variableMap && field.formula) {
                // Custom Formula Logic
                const variables: Record<string, number> = {};
                field.variableMap.forEach((v: any) => {
                    const val = formValues[v.targetId];
                    const num = extractNumber(typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : ''));
                    variables[v.letter] = num;
                });

                let formulaStr = field.formula.toUpperCase();
                Object.keys(variables).forEach(letter => {
                    const regex = new RegExp(`\\b${letter}\\b`, 'g');
                    formulaStr = formulaStr.replace(regex, variables[letter].toString());
                });

                // Validate and Sanitize
                const sanitized = formulaStr.replace(/[^0-9+\-*\/().\s<>=!?^:|&]/g, '');

                // eslint-disable-next-line no-new-func
                const result = new Function('return ' + sanitized)();
                displayValue = isNaN(result) ? "Erro" :
                    (Number.isInteger(result) ? result.toString() : result.toFixed(1));
            } else if (['sum', 'average'].includes(field.calculationType)) {
                // Sum / Average (+ Scaling) Logic
                let sum = 0;
                let count = 0;
                const missingLabels: string[] = [];

                (field.targetIds || []).forEach((tid: string) => {
                    const targetField = (allFields || []).find((f: any) => f.id === tid);

                    // HANDLE GRID SUMMATION
                    if (targetField && targetField.type === 'grid') {
                        const gridRows = targetField.rows || [];
                        const gridCols = targetField.columns || [];

                        gridRows.forEach((_: any, rIndex: number) => {
                            gridCols.forEach((colLabel: string, cIndex: number) => {
                                // Check Radio Grid Logic
                                if (targetField.gridType === 'radio') {
                                    const rowVal = formValues[`${rIndex}`]; // Radio stores value by row index
                                    // Actually formValues keys for grid likely flat or object?
                                    // In RenderField standard logic we assume formValues has direct access or we look up nested.
                                    // However, in FieldGrid we assumed value is an object.
                                    // But formValues passed to FieldCalculated is the GLOBAL form values?
                                    // Yes.
                                    // For Grid, the global form values usually store the grid value as an object under `targetField.id`.
                                    const gridData = formValues[targetField.id] || {};

                                    if (targetField.gridType === 'radio') {
                                        const rowVal = gridData[`${rIndex}`];
                                        if (rowVal === colLabel) {
                                            const num = extractNumber(colLabel);
                                            if (!isNaN(num)) {
                                                sum += num;
                                                count++;
                                            }
                                        }
                                    } else {
                                        // Standard Input Grid
                                        const valStr = gridData[`${rIndex}-${cIndex}`];
                                        const val = parseFloat(valStr);
                                        if (!isNaN(val)) {
                                            sum += val;
                                            count++;
                                        }
                                    }
                                }
                            });
                        });
                    }
                    // HANDLE SCALAR
                    else {
                        const val = parseFloat(formValues[tid]);
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        } else if (field.strictMode) {
                            // Find label for missing field
                            const missingField = (allFields || []).find((f: any) => f.id === tid);
                            if (missingField) missingLabels.push(missingField.label);
                        }
                    }
                });

                if (field.strictMode && missingLabels.length > 0) {
                    displayValue = `Pendente: ${missingLabels.join(', ')}`;
                } else {
                    let rawResult = 0;
                    if (field.calculationType === 'average') {
                        rawResult = count > 0 ? sum / count : 0;
                    } else {
                        rawResult = sum;
                    }

                    // Scaling Logic (0-10)
                    if (field.enableScaling && field.originalMax !== undefined) {
                        const min = field.originalMin || 0;
                        const max = field.originalMax;
                        const range = max - min;

                        if (range !== 0) {
                            // Normalization Formula: ((Value - Min) / Range) * 10
                            rawResult = ((rawResult - min) / range) * 10;
                        }
                    }

                    displayValue = rawResult.toFixed(1);
                }
            } else if (field.calculationType === 'minimalist_index' || (field.label && field.label.toLowerCase().includes('minima'))) {
                // [NEW] Minimalist Index Logic for Preview
                const scores = (field.targetIds || []).map((tid: string) => {
                    const val = parseFloat(formValues[tid]);
                    return isNaN(val) ? 0 : val;
                });
                const total = scores.reduce((a: number, b: number) => a + b, 0);
                // Formula: (Sum / 30) * 100
                const percent = (total / 30) * 100;
                displayValue = Math.min(100, Math.max(0, percent)).toFixed(0) + "%";
            } else if (field.calculationType === 'imc') {
                // IMC Logic
                const weightId = (field.targetIds || [])[0];
                const heightId = (field.targetIds || [])[1];
                if (weightId && heightId) {
                    const w = parseFloat(formValues[weightId]) || 0;
                    const h = parseFloat(formValues[heightId]) || 0;
                    const hM = h > 3 ? h / 100 : h;
                    if (w > 0 && hM > 0) {
                        displayValue = (w / (hM * hM)).toFixed(2);
                    }
                }
            } else {
                displayValue = "Configuração incompleta";
            }
        } catch (e) {
            console.error("Calculation Error", e);
            displayValue = "Erro na fórmula";
        }
    }

    return (
        <div className="grid gap-2">
            <Label>{field.label} {field.calculationType === 'imc' && <span className="text-xs text-muted-foreground">(IMC)</span>}</Label>
            <div className="relative">
                <Input
                    disabled
                    value={displayValue}
                    placeholder={isPreview ? "Aguardando valores..." : "Resultado..."}
                    className={`bg-muted pl-10 font-bold text-primary ${isPreview ? 'text-lg' : ''}`}
                />
                <Calculator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
            {!isPreview && <p className="text-xs text-muted-foreground">Calculado automaticamente no preenchimento.</p>}
        </div>
    );
};
