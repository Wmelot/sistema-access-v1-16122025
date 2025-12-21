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
        // Attempt to find value in the specific form's data
        // The formData structure passed here usually aggregates all forms
        // But typically we look into a specific form's answers object.

        // Assuming formData is keyed by fieldId broadly or we need to look it up.
        // For this specific implementation, let's assume formData is a flat map of FieldID -> Value
        // OR it's the structure from `patient_forms`.

        const val = formData[fieldId]

        if (typeof val === 'number') {
            values.push(val)
        } else if (typeof val === 'string' && !isNaN(parseFloat(val))) {
            values.push(parseFloat(val))
        }
    })

    if (values.length === 0) return 0

    // 2. Calculate based on type
    if (type === 'average') {
        const sum = values.reduce((a, b) => a + b, 0)
        return parseFloat((sum / values.length).toFixed(2))
    }

    if (type === 'sum') {
        return values.reduce((a, b) => a + b, 0)
    }

    return 0
}
