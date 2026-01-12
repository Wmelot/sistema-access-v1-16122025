
import { FormItem } from '../components/forms/builder/utils';

export const useVisibility = (field: FormItem, allFields: FormItem[], formValues: Record<string, any>) => {
    // If no rules, always visible
    if (!field.visibilityRules || !field.visibilityRules.conditions || field.visibilityRules.conditions.length === 0) {
        return true;
    }

    const { action, logicOperator, conditions } = field.visibilityRules;

    // Helper to evaluate one condition
    const evaluateCondition = (cond: { fieldId: string, operator: string, value: any }) => {
        const targetValue = formValues[cond.fieldId];
        // Retrieve target field type to handle conversions? (e.g. number vs string)
        // For now, loose comparison or simple string/number logic

        switch (cond.operator) {
            case 'eq': return targetValue == cond.value;
            case 'neq': return targetValue != cond.value;
            case 'gt': return Number(targetValue) > Number(cond.value);
            case 'lt': return Number(targetValue) < Number(cond.value);
            case 'contains': return String(targetValue || '').includes(cond.value);
            default: return false;
        }
    };

    // Evaluate all
    const results = conditions.map(evaluateCondition);

    let isMatch = false;
    if (logicOperator === 'AND') {
        isMatch = results.every(r => r);
    } else { // OR
        isMatch = results.some(r => r);
    }

    // Action handling
    // If action is 'show', then match means visible (true).
    // If action is 'hide', then match means hidden (false).
    if (action === 'show') return isMatch;
    if (action === 'hide') return !isMatch;

    return true;
};

export const evaluateFormula = (formula: string, formValues: Record<string, any>): number => {
    if (!formula) return 0;

    // 1. Replace field_{id} with values
    // Regex to find field_UUID (assuming ids are UUIDs or simple strings?)
    // User interface might give us 'field_abc', but actually we probably need to parse by IDs.
    // However, IDs are UUIDs. 'field_UUID' might be hard to type.
    // Maybe we replace ANY string that looks like an ID present in formValues?
    // Or we use a specific syntax like `{{UUID}}`?
    // For MVP, let's assume the user (LogicEditor) uses the ID directly or we use a simple text replacement logic 
    // where variables are field IDs.

    // Robust approach: Tokenize by operators (+, -, *, /, (, )) and treat rest as variables.

    try {
        // Simple regex replace for IDs found in formValues keys
        // BUT IDs might be substrings of each other? UUIDs are usually distinct length.
        // Let's iterate all formValues keys and replace them in the string? 
        // That's O(N) but safe.

        let processedFormula = formula;

        // We need to be careful not to replace parts of other variables.
        // UUIDs are quite unique.

        // Sort keys by length desc to avoid prefix issues?
        const keys = Object.keys(formValues);

        // Actually, we can just use a regex like /([a-zA-Z0-9_\-]+)/g and check if it exists in formValues.

        processedFormula = processedFormula.replace(/[a-zA-Z0-9_\-]+/g, (match) => {
            if (formValues.hasOwnProperty(match)) {
                let val = formValues[match];
                // Convert to number
                val = parseFloat(val);
                if (isNaN(val)) val = 0;
                return val.toString();
            }
            // If it's a number literal, leave it
            if (!isNaN(parseFloat(match))) return match;

            // If unknown variable, return 0 (safe mode)
            return '0';
        });

        // 2. Evaluate
        // DANGEROUS: eval(). 
        // Alternative: Function constructor? Still dangerous?
        // For a local app / MVP, Function() is often used but risky if user input is malicious.
        // But here the input is "formula" defined by the ADMIN (Warley). 
        // We can sanitize to only allow digits, operators, parens.

        const sanitized = processedFormula.replace(/[^0-9+\-*/().\s]/g, '');

        // eslint-disable-next-line no-new-func
        return new Function('return ' + sanitized)();

    } catch (e) {
        console.error("Formula Eval Error", e);
        return 0;
    }
};
