
import {
    GeneratedReport,
    ReportBlueprint,
    SmartReportInput,
    ReportSection,
    ReportWidget
} from './types';
import physioDefault from './blueprints/physio-default.json';
import { evidenceService } from './evidence-service';
import { calculateRadarData, calculateSmartRecommendation } from './legacy-logic';

import palmilhaV2 from './blueprints/palmilha-v2.json';

// Helper to safely get nested data
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, obj);
}

export class ReportGenerator {

    public async generate(input: SmartReportInput, blueprintId: string = 'physio_default_v1'): Promise<GeneratedReport> {
        // 0. INJECT LEGACY LOGIC (Palmilha V2 Requirement)
        if (!input.data.calculated) { input.data.calculated = {}; }
        try {
            input.data.calculated.radar = calculateRadarData(input.data);
            input.data.calculated.shoeRecommendation = calculateSmartRecommendation(input.data.patientProfile, input.data.painPoints);
        } catch (e) { console.error("Legacy Logic Error", e); }

        // 1. Load Blueprint
        let blueprint: ReportBlueprint;
        if (blueprintId === 'REPORT_PALMILHA_V2') {
            blueprint = palmilhaV2 as unknown as ReportBlueprint;
        } else {
            blueprint = physioDefault as any;
        }

        // If we had multiple blueprints, we would select here.
        // if (blueprintId !== blueprint.id) throw new Error("Blueprint not found");

        const generatedSections = await Promise.all(blueprint.sections.map(section => this.processSection(section, input)));

        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                blueprintUsed: blueprint.name
            },
            patientInfo: {
                id: input.patientId,
                name: input.data.paciente?.nome || input.data.patientName || "Paciente Não Identificado",
                age: input.data.paciente?.idade || input.data.patientAge
            },
            sections: generatedSections
        };
    }

    private async processSection(section: ReportSection, input: SmartReportInput) {
        const processedWidgets = await Promise.all(section.widgets.map(widget => this.processWidget(widget, input)));

        return {
            title: section.title,
            layout: section.layout,
            content: processedWidgets
        };
    }

    private async processWidget(widget: ReportWidget, input: SmartReportInput) {
        let content: any = null;
        let finalTitle = widget.title;

        // Resolve Data
        if (widget.dataSourcePath) {
            const rawValue = getNestedValue(input.data, widget.dataSourcePath);
            content = rawValue;
        }

        // Widget-Specific Logic
        if (widget.type === 'evidence_box') {
            // content here is likely the diagnosis string, e.g. "Lombociatalgia"
            if (typeof content === 'string') {
                const evidence = evidenceService.findEvidence(content);
                if (evidence) {
                    content = {
                        diagnosis: content,
                        evidenceText: evidence.evidence,
                        source: evidence.source,
                        level: 'A' // Mock Level
                    };
                } else {
                    // Fallback if no evidence found
                    content = {
                        diagnosis: content,
                        evidenceText: "Não foram encontradas diretrizes específicas para este termo na base de dados.",
                        source: "N/A"
                    };
                }
            }
        }

        if (widget.type === 'highlight_box' && widget.rules) {
            // Evaluate Rules against Data
            // content here might be the whole data object or handled within rules
            const activeHighlights = [];
            for (const rule of widget.rules) {
                const fieldValue = getNestedValue(input.data, rule.field); // Assuming data path is relative to root input.data for rules
                let match = false;

                if (rule.condition === '>') match = Number(fieldValue) > Number(rule.value);
                if (rule.condition === '<') match = Number(fieldValue) < Number(rule.value);
                if (rule.condition === '==') match = String(fieldValue) == String(rule.value);
                if (rule.condition === '!=') match = String(fieldValue) != String(rule.value);

                if (match) {
                    activeHighlights.push({
                        text: rule.text,
                        color: rule.color
                    });
                }
            }
            content = activeHighlights;
        }

        if (widget.type === 'prescription_block') {
            // AUTO-GENERATION LOGIC (Palmilha requirement)
            if (!content || (typeof content === 'object' && !content.elementos_selecionados)) {
                const diagnosis = getNestedValue(input.data, 'diagnostic.hypothesis') || "Condição não especificada";
                const status = getNestedValue(input.data, 'triage_data.dor_eva') > 7 ? "Fase Aguda" : "Fase Crônica";

                content = {
                    elementos_selecionados: [], // Empty list
                    tipo_material: "EVA Soft (Conforto)",
                    justificativa_auto: `Sugestão Gerada por IA:\nPara o diagnóstico de ${diagnosis} (${status}), recomenda-se uma palmilha com foco em acomodação e redistribuição de pressão. A ausência de elementos específicos sugere uma abordagem conservadora inicial.`
                };
            }
        }

        return {
            id: widget.id,
            type: widget.type,
            title: finalTitle,
            data: content,
            config: widget.config
        };
    }
}

export const reportGenerator = new ReportGenerator();
