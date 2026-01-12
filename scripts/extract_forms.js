const fs = require('fs');
const path = require('path');

// Helper to extract fields from code
function extractPhysicalFields(content) {
    const fields = [];

    // Regex for useState initializations for Physical Form sections
    const stateRegex = /const\s+\[(\w+),\s+set\w+\]\s+=\s+useState\(.*(?:initialData\?\.\w+\s+\|\|\s*)?({[\s\S]*?})\)/g;

    let match;
    while ((match = stateRegex.exec(content)) !== null) {
        const stateName = match[1];
        const stateBody = match[2];

        // Parse the body to find keys and comments/types?
        // Simple line parsing
        const lines = stateBody.split('\n');
        lines.forEach(line => {
            const keyMatch = line.match(/(\w+):/);
            if (keyMatch) {
                const key = keyMatch[1];
                // Heuristic for label and type
                let type = 'text';
                let label = key.charAt(0).toUpperCase() + key.slice(1);

                // Try to guess from context or value
                if (line.includes("''")) type = 'text';
                if (line.includes("0")) type = 'number';
                if (line.includes("[]")) type = 'multiselect';
                if (line.includes("male")) { type = 'select'; label = "Gender"; }

                // Comments as label? // 'male' | 'female'
                const comment = line.match(/\/\/ (.*)/);
                if (comment) label = comment[1].trim();

                if (key !== 'entries' && key !== 'items') { // Skip collection roots
                    fields.push({
                        id: `${stateName}.${key}`,
                        label: label,
                        type: type,
                        section: stateName.charAt(0).toUpperCase() + stateName.slice(1) // Section from state name
                    });
                }
            }
        });
    }
    return fields;
}

function extractBiomechanicsFields(content) {
    const fields = [];
    // Find DEFAULT_DATA
    const match = content.match(/const DEFAULT_DATA = ({[\s\S]*?^    })/m);
    if (match) {
        const body = match[1];
        const lines = body.split('\n');
        let currentSection = 'General';

        lines.forEach(line => {
            if (line.trim().startsWith('//')) return;

            // Nested objects as sections?
            if (line.includes(': {')) {
                const secMatch = line.match(/(\w+): {/);
                if (secMatch) currentSection = secMatch[1];
            }

            const keyMatch = line.match(/(\w+):/);
            if (keyMatch) {
                const key = keyMatch[1];
                let type = 'text';
                // Simple heuristics
                if (line.includes("''")) type = 'text';
                if (line.includes("0")) type = 'number';
                if (line.includes("[]")) type = 'multiselect';

                fields.push({
                    id: key, // Should be nested path ideally
                    label: key, // Better humanizing needed
                    type: type,
                    section: currentSection
                });
            }
        });
    }
    return fields;
}

const outFile = 'extracted_legacy_forms.json';
const forms = [];

// 1. Physical Assessment
try {
    const physicalPath = 'legacy_dump/src/components/assessments/physical-assessment-form.tsx';
    if (fs.existsSync(physicalPath)) {
        const content = fs.readFileSync(physicalPath, 'utf8');
        const fields = extractPhysicalFields(content);
        forms.push({
            title: 'Avaliação Física Avançada',
            description: 'Migrated from Legacy Component',
            fields: fields
        });
        console.log(`Extracted Physical: ${fields.length} fields`);
    }
} catch (e) { console.error('Physical extraction failed', e); }

// 2. Biomechanics
try {
    const bioPath = 'legacy_dump/src/components/assessments/biomechanics-form.tsx';
    if (fs.existsSync(bioPath)) {
        const content = fs.readFileSync(bioPath, 'utf8');
        const fields = extractBiomechanicsFields(content);
        forms.push({
            title: 'Palmilha Biomecânica 2.0',
            description: 'Migrated from Legacy Component',
            fields: fields
        });
        console.log(`Extracted Biomechanics: ${fields.length} fields`);
    }
} catch (e) { console.error('Biomechanics extraction failed', e); }

// 3. Smart Assessment (PBE)
try {
    const pbePath = 'src/components/assessments/smart-assessment-form.tsx';
    if (fs.existsSync(pbePath)) {
        const content = fs.readFileSync(pbePath, 'utf8');
        const fields = extractBiomechanicsFields(content); // Re-use DEFAULT_DATA parser as structure is similar

        // Post-process to add nested Red Flags manually if not captured
        // The parser captures top-level keys. RedFlags is an object.
        // We might want to flatten it or just keep it as is.

        forms.push({
            title: 'Avaliação Clínica PBE',
            description: 'Smart Assessment with AI & Red Flags',
            fields: fields
        });
        console.log(`Extracted PBE: ${fields.length} fields`);
    }
} catch (e) { console.error('PBE extraction failed', e); }

fs.writeFileSync(outFile, JSON.stringify(forms, null, 2));

console.log('Saved extraction to ' + outFile);
