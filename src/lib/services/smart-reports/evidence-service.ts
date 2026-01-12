
import evidenceDb from './evidence/database.json';

export interface KnowledgeBaseEntry {
    titulo: string;
    tipo_estudo: string; // 'Diretriz Clínica (CPG)', 'Revisão Sistemática', 'RCT'
    autor: string;
    ano: string;
    nota_qualidade: string;
    doi_link: string;
    resumo_educativo: string;
    pontos_chave: string[];
}

interface EvidenceEntry {
    keywords: string[];
    evidence: string;
    source: string;
    base_conhecimento?: KnowledgeBaseEntry[];
}

export class EvidenceService {
    private db: { entries: EvidenceEntry[] };

    constructor() {
        this.db = evidenceDb;
    }

    public findEvidence(contextText: string): EvidenceEntry | null {
        if (!contextText) return null;

        const lowerText = contextText.toLowerCase();

        // Simple keyword matching - finds the first entry with a matching keyword
        // In a real AI system, this would be a vector search / embedding match
        for (const entry of this.db.entries) {
            for (const keyword of entry.keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    return entry;
                }
            }
        }

        return null; // No evidence found
    }
}

export const evidenceService = new EvidenceService();
