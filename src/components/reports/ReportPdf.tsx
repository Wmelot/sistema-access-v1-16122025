import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Polygon, Polyline, Line, Circle, Image as PdfImage } from '@react-pdf/renderer';

// Styles matching the modern look (similar to Photos 3 & 4)
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 50,
        fontFamily: 'Helvetica', // Standard font
        fontSize: 10,
        color: '#333333'
    },
    chartSection: {
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
        height: 200,
        width: '100%'
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        color: '#374151'
    },
    headerContainer: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    headerLeft: {
        flexDirection: 'column'
    },
    companyName: {
        fontSize: 18,
        color: '#111827',
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'Helvetica-Bold'
    },
    reportTitle: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    headerRight: {
        fontSize: 10,
        color: '#9CA3AF'
    },
    patientSection: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 4,
        marginBottom: 30
    },
    sectionLabel: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    patientName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        fontFamily: 'Helvetica-Bold'
    },
    contentContainer: {
        flex: 1
    },
    // Markdown Styles
    h1: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 5,
        fontFamily: 'Helvetica-Bold'
    },
    h2: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 15,
        marginBottom: 8,
        fontFamily: 'Helvetica-Bold'
    },
    h3: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#4B5563',
        marginTop: 10,
        marginBottom: 5,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold'
    },
    paragraph: {
        fontSize: 10,
        lineHeight: 1.5,
        marginBottom: 8,
        textAlign: 'justify',
        color: '#4B5563'
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 4,
        paddingLeft: 10
    },
    bullet: {
        width: 15,
        fontSize: 10,
        color: '#1fae9b'
    },
    listItemContent: {
        flex: 1,
        fontSize: 10,
        lineHeight: 1.5,
        color: '#4B5563'
    },
    bold: {
        fontWeight: 'bold',
        color: '#111827',
        fontFamily: 'Helvetica-Bold'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pageNumber: {
        fontSize: 8,
        color: '#9CA3AF'
    },
    branding: {
        fontSize: 8,
        color: '#9CA3AF',
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold'
    },
    signatureContainer: {
        marginTop: 50,
        alignItems: 'center',
        marginBottom: 20
    },
    signatureLine: {
        width: 200,
        borderTopWidth: 1,
        borderTopColor: '#D1D5DB',
        marginBottom: 8
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#111827',
        fontFamily: 'Helvetica-Bold'
    },
    signatureRole: {
        fontSize: 9,
        color: '#6B7280'
    }
});

interface ReportPdfProps {
    title: string;
    content: string;
    patientName: string;
    professionalName: string;
    date: string;
    // New Rich Data Props
    patientAge?: string;
    painLevel?: number; // EVA 0-10
    painDuration?: string;
    mainComplaint?: string;
    painMapData?: { x: number, y: number, view: 'anterior' | 'posterior' | 'feet' }[];
    shoeInfo?: {
        weight?: string;
        drop?: string;
        stack?: string;
        flexibility?: string;
        minimalismIndex?: number;
    };
    examImages?: {
        plantigraphy2D?: string;
        plantigraphy3D?: string;
    };
    radarData?: { subject: string; A: number; fullMark: number }[];
    dfiData?: { phase: string; left: string; right: string }[];
}

// Simple parser to handle basic Markdown syntax
const MarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n');

    return (
        <View>
            {lines.map((line, index) => {
                const cleanLine = line.trim();

                if (!cleanLine) return <View key={index} style={{ height: 8 }} />;

                // Headings
                if (cleanLine.startsWith('# ')) {
                    return <Text key={index} style={styles.h1}>{cleanLine.replace('# ', '')}</Text>;
                }
                if (cleanLine.startsWith('## ')) {
                    return <Text key={index} style={styles.h2}>{cleanLine.replace('## ', '')}</Text>;
                }
                if (cleanLine.startsWith('### ')) {
                    return <Text key={index} style={styles.h3}>{cleanLine.replace('### ', '')}</Text>;
                }

                // List Items
                if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
                    const text = cleanLine.substring(2);
                    return (
                        <View key={index} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.listItemContent}>{parseBold(text)}</Text>
                        </View>
                    );
                }

                // Normal Paragraph
                return (
                    <Text key={index} style={styles.paragraph}>
                        {parseBold(cleanLine)}
                    </Text>
                );
            })}
        </View>
    );
};

// Helper to parse **bold** text within a string
const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
    });
};

// --- CHART COMPONENTS ---

const RadarChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const size = 200;
    const center = size / 2;
    const radius = 80;
    const levels = 5;

    const getCoordinates = (value: number, index: number, total: number, maxRadius: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const x = center + Math.cos(angle) * (value / 100) * maxRadius;
        const y = center + Math.sin(angle) * (value / 100) * maxRadius;
        return { x, y };
    };

    const gridPoints = Array.from({ length: levels }).map((_, levelIndex) => {
        const levelRadius = (radius / levels) * (levelIndex + 1);
        return data.map((_, i) => {
            const { x, y } = getCoordinates(100, i, data.length, levelRadius);
            return `${x},${y}`;
        }).join(' ');
    });

    const dataPoints = data.map((d, i) => {
        const { x, y } = getCoordinates(d.A || 0, i, data.length, radius);
        return `${x},${y}`;
    }).join(' ');

    return (
        <View style={styles.chartSection} wrap={false}>
            <Text style={styles.chartTitle}>Gráfico de Radar (Performance)</Text>
            <Svg height={size} width={size}>
                {gridPoints.map((points, i) => (
                    <Polygon key={i} points={points} stroke="#E5E7EB" strokeWidth={1} fill="none" />
                ))}
                {data.map((_, i) => {
                    const { x, y } = getCoordinates(100, i, data.length, radius);
                    return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={1} />; // Fixed self closing
                })}
                <Polygon points={dataPoints} fill="rgba(31, 174, 155, 0.2)" stroke="#1fae9b" strokeWidth={2} />
                {data.map((d, i) => {
                    const { x, y } = getCoordinates(d.A || 0, i, data.length, radius);
                    return <Circle key={i} cx={x} cy={y} r={3} fill="#1fae9b" />;
                })}
                {data.map((d, i) => {
                    const { x, y } = getCoordinates(120, i, data.length, radius);
                    let textAnchor: "middle" | "end" | "start" = "middle";
                    if (x < center - 10) textAnchor = "end";
                    if (x > center + 10) textAnchor = "start";
                    return (
                        <Text key={i} x={x} y={y} textAnchor={textAnchor} style={{ fontSize: 8, fill: "#374151" }}>
                            {d.subject}
                        </Text>
                    );
                })}
            </Svg>
        </View>
    );
};

const DfiChart = ({ data }: { data: { phase: string; left: string; right: string }[] }) => {
    if (!data || data.length === 0) return null;

    const width = 300;
    const height = 150;
    const padding = 30;
    const phases = data.map(d => d.phase);

    // Map string values to numbers if needed, or assume they are numeric strings
    const parseVal = (v: string) => parseFloat(v) || 0;

    // Scale: Y axis usually -5 to +5 or similar for DFI? 
    // Template says 0=Neutral, Neg=Supinated, Pos=Pronated.
    // Let's assume range -10 to 10 for safety, or auto-scale? 
    // Let's stick to a fixed visual range for consistency: -10 to +10.
    const maxY = 10;
    const minY = -10;
    const range = maxY - minY;

    const getX = (i: number) => padding + (i * ((width - 2 * padding) / (phases.length - 1)));
    const getY = (val: number) => height - padding - (((val - minY) / range) * (height - 2 * padding));

    const leftPoints = data.map((d, i) => `${getX(i)},${getY(parseVal(d.left))}`).join(' ');
    const rightPoints = data.map((d, i) => `${getX(i)},${getY(parseVal(d.right))}`).join(' ');

    return (
        <View style={{ ...styles.chartSection, height: 180, marginBottom: 30 }} wrap={false}>
            <Text style={styles.chartTitle}>Classificação Dinâmica dos Pés (DFI)</Text>
            <Svg width={width} height={height}>
                {/* Grid Lines (Neutral 0, +5, -5) */}
                <Line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4 4" />
                <Text x={width - padding + 5} y={getY(0) + 3} style={{ fontSize: 6, fill: "#9CA3AF" }}>Neutro</Text>

                <Line x1={padding} y1={getY(5)} x2={width - padding} y2={getY(5)} stroke="#E5E7EB" strokeWidth={1} />
                <Text x={width - padding + 5} y={getY(5) + 3} style={{ fontSize: 6, fill: "#E5E7EB" }}>Pron (+)</Text>

                <Line x1={padding} y1={getY(-5)} x2={width - padding} y2={getY(-5)} stroke="#E5E7EB" strokeWidth={1} />
                <Text x={width - padding + 5} y={getY(-5) + 3} style={{ fontSize: 6, fill: "#E5E7EB" }}>Sup (-)</Text>

                {/* X Axis Labels */}
                {data.map((d, i) => (
                    <Text key={i} x={getX(i)} y={height - 10} textAnchor="middle" style={{ fontSize: 8, fill: "#374151" }}>
                        {d.phase}
                    </Text>
                ))}

                {/* Left Foot (Blue) */}
                <Polyline points={leftPoints} stroke="#3B82F6" strokeWidth={2} fill="none" />
                {data.map((d, i) => (
                    <Circle key={`L${i}`} cx={getX(i)} cy={getY(parseVal(d.left))} r={3} fill="#3B82F6" />
                ))}

                {/* Right Foot (Red/Orange) */}
                <Polyline points={rightPoints} stroke="#EF4444" strokeWidth={2} fill="none" />
                {data.map((d, i) => (
                    <Circle key={`R${i}`} cx={getX(i)} cy={getY(parseVal(d.right))} r={3} fill="#EF4444" />
                ))}
            </Svg>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, backgroundColor: '#3B82F6', borderRadius: 4, marginRight: 4 }} />
                    <Text style={{ fontSize: 8, color: '#4B5563' }}>Esquerdo</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, marginRight: 4 }} />
                    <Text style={{ fontSize: 8, color: '#4B5563' }}>Direito</Text>
                </View>
            </View>
        </View>
    );
};

const PainMapSection = ({ points }: { points: any[] }) => {
    if (!points || points.length === 0) return null;

    // Group by view
    const anteriorPoints = points.filter(p => p.view === 'anterior');
    const posteriorPoints = points.filter(p => p.view === 'posterior');
    const feetPoints = points.filter(p => p.view === 'feet');

    const renderMap = (subPoints: any[], title: string, imgSrc: string) => {
        if (!subPoints || subPoints.length === 0) return null;
        return (
            <View style={{ width: '30%', alignItems: 'center' }}>
                <Text style={{ fontSize: 9, marginBottom: 4, fontWeight: 'bold' }}>{title}</Text>
                <View style={{ position: 'relative', width: 100, height: 200 }}>
                    <PdfImage src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <Svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
                        {subPoints.map((p, i) => (
                            <Circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r="3"
                                fill="rgba(239, 68, 68, 0.6)" // Red with opacity
                                stroke="red"
                                strokeWidth="1"
                            />
                        ))}
                    </Svg>
                </View>
            </View>
        );
    };

    return (
        <View style={{ marginTop: 20, marginBottom: 20 }}>
            <Text style={styles.h2}>Mapeamento da Dor</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {renderMap(anteriorPoints, "Vista Anterior", "/assets/body_map_clean.png")}
                {renderMap(posteriorPoints, "Vista Posterior", "/assets/body_map_clean.png")}
                {renderMap(feetPoints, "Pés", "/assets/foot_map_clean.png")}
            </View>
        </View>
    );
};

const ShoeSection = ({ info }: { info: any }) => {
    if (!info) return null;
    return (
        <View style={{ marginTop: 20, marginBottom: 20 }}>
            <Text style={styles.h2}>Análise de Calçados</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 }}>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Peso</Text>
                    <Text style={{ fontSize: 12, color: '#1fae9b', marginTop: 2 }}>{info.weight || '-'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Drop</Text>
                    <Text style={{ fontSize: 12, color: '#1fae9b', marginTop: 2 }}>{info.drop || '-'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Altura (Stack)</Text>
                    <Text style={{ fontSize: 12, color: '#1fae9b', marginTop: 2 }}>{info.stack || '-'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Índice Minimalista</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1fae9b', marginTop: 2 }}>{info.minimalismIndex ? `${info.minimalismIndex}%` : '-'}</Text>
                </View>
            </View>
        </View>
    );
};

const ExamImagesSection = ({ images }: { images: any }) => {
    if (!images || (!images.plantigraphy2D && !images.plantigraphy3D)) return null;
    return (
        <View style={{ marginTop: 20, marginBottom: 20 }}>
            <Text style={styles.h2}>Exame Físico (Plantigrafia)</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                {images.plantigraphy2D && (
                    <View style={{ alignItems: 'center', width: '45%' }}>
                        <PdfImage src={images.plantigraphy2D} style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 4 }} />
                        <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>2D</Text>
                    </View>
                )}
                {images.plantigraphy3D && (
                    <View style={{ alignItems: 'center', width: '45%' }}>
                        <PdfImage src={images.plantigraphy3D} style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 4 }} />
                        <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>3D</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export const ReportPdf = ({
    title, content, patientName, professionalName, date,
    radarData, dfiData, patientAge, mainComplaint, painLevel, painDuration,
    painMapData, shoeInfo, examImages
}: ReportPdfProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <Text style={styles.companyName}>Sistema Access</Text>
                    <Text style={styles.reportTitle}>{title}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.headerRight}>{date}</Text>
                    {professionalName && <Text style={{ fontSize: 9, color: '#374151', marginTop: 2 }}>Ft. {professionalName}</Text>}
                </View>
            </View>

            {/* Expanded Patient Info */}
            <View style={styles.patientSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View>
                        <Text style={styles.sectionLabel}>Paciente</Text>
                        <Text style={styles.patientName}>{patientName} {patientAge && `| ${patientAge}`}</Text>
                    </View>
                    {painLevel !== undefined && (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.sectionLabel}>Nível de Dor (EVA)</Text>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1fae9b' }}>{painLevel}/10</Text>
                        </View>
                    )}
                </View>
                {mainComplaint && (
                    <View style={{ marginBottom: 4 }}>
                        <Text style={styles.sectionLabel}>Queixa Principal</Text>
                        <Text style={{ fontSize: 10, color: '#374151' }}>{mainComplaint}</Text>
                    </View>
                )}
                {painDuration && (
                    <View>
                        <Text style={styles.sectionLabel}>Duração</Text>
                        <Text style={{ fontSize: 10, color: '#374151' }}>{painDuration}</Text>
                    </View>
                )}
            </View>

            {/* Radar Chart */}
            {radarData && radarData.length > 0 && (
                <RadarChart data={radarData} />
            )}

            {/* DFI Chart */}
            {dfiData && dfiData.length > 0 && (
                <DfiChart data={dfiData} />
            )}

            {/* Pain Map */}
            <PainMapSection points={painMapData || []} />

            {/* Shoe Analysis */}
            <ShoeSection info={shoeInfo} />

            {/* Exam Images */}
            <ExamImagesSection images={examImages} />

            {/* Text Content */}
            <View style={styles.contentContainer}>
                <MarkdownRenderer content={content} />
            </View>

            {/* Footer Signature */}
            <View style={styles.signatureContainer}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>{professionalName}</Text>
                <Text style={styles.signatureRole}>Fisioterapeuta</Text>
            </View>

            {/* Page Footer */}
            <View style={styles.footer} fixed>
                <Text style={styles.branding}>Gerado pelo Sistema Access</Text>
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `Página ${pageNumber} de ${totalPages}`
                )} />
            </View>
        </Page>
    </Document>
);
