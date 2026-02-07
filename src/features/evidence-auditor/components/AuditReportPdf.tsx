import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    systemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    reportDate: {
        fontSize: 9,
        color: '#94A3B8',
    },
    titleSection: {
        marginBottom: 25,
    },
    originalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 1.3,
    },
    translatedTitle: {
        fontSize: 12,
        color: '#4F46E5',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    citationBox: {
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 6,
        border: '1px solid #F1F5F9',
    },
    citationText: {
        fontSize: 8,
        fontFamily: 'Courier',
        color: '#64748B',
    },
    verdictContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    verdictCard: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
    },
    verdictLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    verdictValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#64748B',
        marginBottom: 8,
        marginTop: 15,
        borderLeft: '3px solid #4F46E5',
        paddingLeft: 8,
    },
    explanation: {
        fontSize: 11,
        lineHeight: 1.6,
        color: '#334155',
        marginBottom: 20,
        textAlign: 'justify',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    gridItem: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 8,
    },
    gridLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94A3B8',
        marginBottom: 3,
    },
    gridValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    conclusionBox: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    authorConclusion: {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    realConclusion: {
        backgroundColor: '#EEF2FF',
        border: '1px solid #C7D2FE',
        padding: 12,
        borderRadius: 10,
    },
    conclusionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    conclusionText: {
        fontSize: 10,
        lineHeight: 1.5,
        color: '#1E293B',
    },
    recommendationCard: {
        backgroundColor: '#0F172A',
        padding: 20,
        borderRadius: 15,
        marginTop: 20,
    },
    recommendationLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 10,
    },
    recommendationText: {
        fontSize: 13,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 1.6,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: '1px solid #F1F5F9',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 8,
        color: '#94A3B8',
    },
    pedroSection: {
        marginTop: 20,
        backgroundColor: '#FCFBFA',
        padding: 15,
        borderRadius: 12,
        border: '1px solid #F3E8D6',
    },
    pedroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottom: '1px solid #F3E8D6',
        paddingBottom: 10,
    },
    pedroMainTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#92400E',
    },
    pedroTotalScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    pedroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pedroItem: {
        width: '100%',
        marginBottom: 5,
        padding: 6,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    itemTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#334155',
        flex: 1,
    },
    itemStatus: {
        fontSize: 8,
        fontWeight: 'bold',
    },
    itemJustification: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#64748B',
        lineHeight: 1.4,
    },
});

interface AuditReportPdfProps {
    data: any;
    date: string;
}

export const AuditReportPdf = ({ data, date }: AuditReportPdfProps) => {
    const isSpin = data.spin_detected;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.systemName}>Axiom PBE Auditor</Text>
                    <Text style={styles.reportDate}>{date}</Text>
                </View>

                <View style={styles.titleSection}>
                    <Text style={styles.originalTitle}>{data.original_title}</Text>
                    <Text style={styles.translatedTitle}>{data.translated_title}</Text>
                    <View style={styles.citationBox}>
                        <Text style={styles.citationText}>CITAÇÃO: {data.citation}</Text>
                    </View>
                </View>

                <View style={styles.verdictContainer}>
                    <View style={[styles.verdictCard, {
                        borderColor: isSpin ? '#FCA5A5' : '#86EFAC',
                        backgroundColor: isSpin ? '#FEF2F2' : '#F0FDF4'
                    }]}>
                        <Text style={[styles.verdictLabel, { color: isSpin ? '#B91C1C' : '#15803D' }]}>Verdict</Text>
                        <Text style={[styles.verdictValue, { color: isSpin ? '#B91C1C' : '#15803D' }]}>
                            {isSpin ? 'Alto Risco de Viés' : 'Evidência Confiável'}
                        </Text>
                    </View>
                    <View style={[styles.verdictCard, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}>
                        <Text style={[styles.verdictLabel, { color: '#64748B' }]}>Score de Qualidade</Text>
                        <Text style={[styles.verdictValue, { color: '#0F172A' }]}>{data.verdict_score}/5</Text>
                    </View>
                    <View style={[styles.verdictCard, {
                        borderColor: data.bias_risk === 'Low' ? '#86EFAC' : data.bias_risk === 'Moderate' ? '#FDE68A' : '#FCA5A5',
                        backgroundColor: data.bias_risk === 'Low' ? '#F0FDF4' : data.bias_risk === 'Moderate' ? '#FFFBEB' : '#FEF2F2'
                    }]}>
                        <Text style={[styles.verdictLabel, { color: '#64748B' }]}>Risco de Viés</Text>
                        <Text style={[styles.verdictValue, { color: '#1E293B' }]}>
                            {data.bias_risk === 'Low' ? 'Baixo' : data.bias_risk === 'Moderate' ? 'Moderado' : 'Alto'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Justificativa Metodológica</Text>
                <Text style={styles.explanation}>{data.explanation}</Text>

                {data.pedro_review && (
                    <View style={styles.pedroSection}>
                        <View style={styles.pedroHeader}>
                            <View>
                                <Text style={styles.pedroMainTitle}>Revisor Escala PEDro</Text>
                                <Text style={{ fontSize: 7, color: '#92400E', marginTop: 2 }}>Qualidade Metodológica RCT</Text>
                            </View>
                            <Text style={styles.pedroTotalScore}>
                                {data.pedro_review.total_score} / 10
                            </Text>
                        </View>
                        <View style={styles.pedroGrid}>
                            {data.pedro_review.criteria.map((c: any, i: number) => (
                                <View key={i} style={[styles.pedroItem, { borderLeft: `3px solid ${c.result ? '#10B981' : '#E2E8F0'}` }]}>
                                    <View style={styles.itemHeader}>
                                        <Text style={styles.itemTitle}>Item {c.item}: {c.description}</Text>
                                        <Text style={[styles.itemStatus, { color: c.result ? '#10B981' : '#94A3B8' }]}>
                                            {c.result ? 'PONTO' : 'NÃO'}
                                        </Text>
                                    </View>
                                    <Text style={styles.itemJustification}>"{c.justification}"</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Metadados do Periódico</Text>
                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Revista</Text>
                        <Text style={styles.gridValue}>{data.journal_info.name}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Fator de Impacto</Text>
                        <Text style={styles.gridValue}>{data.journal_info.impact_factor || 'N/A'}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Predatória</Text>
                        <Text style={[styles.gridValue, { color: data.journal_info.is_predatory ? '#EF4444' : '#10B981' }]}>
                            {data.journal_info.is_predatory ? 'SIM (Cuidado)' : 'NÃO'}
                        </Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Tipo de Estudo</Text>
                        <Text style={styles.gridValue}>{data.study_type}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Conclusão Contrastada</Text>
                <View style={styles.conclusionBox}>
                    <View style={styles.authorConclusion}>
                        <Text style={[styles.conclusionTitle, { color: '#64748B' }]}>Conclusão dos Autores</Text>
                        <Text style={styles.conclusionText}>{data.author_conclusion}</Text>
                    </View>
                    <View style={styles.realConclusion}>
                        <Text style={[styles.conclusionTitle, { color: '#4F46E5' }]}>Achados Reais (PBE Auditor)</Text>
                        <Text style={[styles.conclusionText, { fontWeight: 'bold' }]}>{data.real_conclusion}</Text>
                    </View>
                </View>

                <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationLabel}>Recomendação Clínica Final</Text>
                    <Text style={styles.recommendationText}>{data.recommendation}</Text>
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerLabel}>Gerado por Axiom Intelligence</Text>
                    <Text style={styles.footerLabel} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
};
