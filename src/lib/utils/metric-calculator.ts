export interface MetricDefinition {
    id: string
    title: string
    target_min: number
    target_max: number
    calculation_rule: {
        type: 'average' | 'sum' | 'formula'
        details: {
            formId: string
            fields: string[] // field IDs (e.g. ['field_123', 'field_456'])
        }
    }
}

export interface FormulationData {
    [formId: string]: {
        [fieldId: string]: any
    }
}

export function calculateMetric(metric: MetricDefinition, formData: FormulationData): number {
    if (!metric.calculation_rule) return 0

    const { type, details } = metric.calculation_rule
    const { formId, fields } = details

    // If no data for this form, return 0
    if (!formData || !formData) return 0

    // 1. Extract values
    const values: number[] = []

    fields.forEach(fieldId => {
        // Handle fieldId:colIndex syntax
        const cleanId = fieldId.split(':')[0];
        const val = formData[cleanId];
        const extracted = extractValuesFromField(val, fieldId);
        values.push(...extracted);
    })

    if (values.length === 0) return 0

    // 2. Calculate based on type
    if (type === 'average') {
        const sum = values.reduce((a, b) => a + b, 0)
        return values.length > 0 ? parseFloat((sum / values.length).toFixed(2)) : 0
    }

    if (type === 'sum') {
        return values.reduce((a, b) => a + b, 0)
    }

    return 0
}

function extractValuesFromField(val: any, fieldRef?: string): number[] {
    const explicitColIndex = fieldRef?.includes(':') ? parseInt(fieldRef.split(':')[1]) : -1;
    const values: number[] = [];

    if (typeof val === 'number') {
        values.push(val)
    } else if (typeof val === 'string' && !isNaN(parseFloat(val))) {
        values.push(parseFloat(val))
    } else if (typeof val === 'object' && val !== null) {
        // Grid or other object structure
        // Grid structure: { "row-col": value, "row-label": label }
        // Keys are like "0-0", "0-1" (row-col)
        Object.keys(val).forEach(key => {
            if (key.includes('-')) {
                const parts = key.split('-');
                if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                    const colIdx = parseInt(parts[1]);
                    // If explicit column requested, filter. Else take all.
                    if (explicitColIndex === -1 || explicitColIndex === colIdx) {
                        const cellVal = val[key];
                        if (typeof cellVal === 'number') values.push(cellVal);
                        else if (typeof cellVal === 'string' && !isNaN(parseFloat(cellVal))) values.push(parseFloat(cellVal));
                    }
                }
            }
        });
    }

    return values;
}
