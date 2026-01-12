
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import { extractNumber } from '../field-utils';

interface FieldChartProps {
    field: any;
    formValues: any;
    allFields: any[];
}

export const FieldChart = ({ field, formValues, allFields }: FieldChartProps) => {
    const sourceIds = field.sourceFieldIds || (field.sourceFieldId ? [field.sourceFieldId] : []);
    if (sourceIds.length === 0) return <div className="p-4 border border-dashed rounded text-sm text-muted-foreground text-center">Gráfico: Selecione as fontes nas configurações.</div>;

    let chartData: any[] = [];
    const firstSource = (allFields || []).find((f: any) => f.id === sourceIds[0]);

    // CASE 1: Grid Source (Single Grid selected)
    if (sourceIds.length === 1 && firstSource?.type === 'grid') {
        const sourceField = firstSource;
        const sourceValues = formValues[sourceField.id] || {};
        chartData = (sourceField.rows || []).map((rowLabel: string, rIndex: number) => {
            const customLabel = sourceField.firstColEditable && sourceValues[`row-label-${rIndex}`];
            const finalLabel = customLabel || rowLabel;
            const displayLabel = finalLabel.length > 20 ? finalLabel.substring(0, 20) + '...' : finalLabel;
            const rowObj: any = { name: displayLabel, fullLabel: finalLabel };

            sourceField.columns?.forEach((colLabel: string, cIndex: number) => {
                let val = 0;
                const cellVal = sourceValues[`${rIndex}-${cIndex}`];
                const rowRadioVal = sourceValues[`${rIndex}`];

                if (sourceField.gridType === 'radio' && rowRadioVal === colLabel) {
                    val = extractNumber(colLabel);
                    rowObj['score'] = val;
                } else if (cellVal) {
                    val = extractNumber(cellVal.toString());
                    rowObj[colLabel] = val;
                }
            });
            if (sourceField.gridType === 'radio' && rowObj['score'] === undefined) rowObj['score'] = 0;
            return rowObj;
        });
    }
    // CASE 2: Multi-Source Scalar (Variables & Grids as Scalars)
    else {
        chartData = sourceIds.map((id: string) => {
            if (id === field.id) return null; // Skip self
            const src = (allFields || []).find((f: any) => f.id === id);
            if (!src) return null;

            let val = 0;

            // If Source is Grid, Sum it up
            if (src.type === 'grid') {
                const gridData = formValues[src.id] || {};
                (src.rows || []).forEach((_: any, rIndex: number) => {
                    (src.columns || []).forEach((colLabel: string, cIndex: number) => {
                        if (src.gridType === 'radio') {
                            const rowVal = gridData[`${rIndex}`];
                            if (rowVal === colLabel) {
                                const n = extractNumber(colLabel);
                                if (!isNaN(n)) val += n;
                            }
                        } else {
                            const n = extractNumber(gridData[`${rIndex}-${cIndex}`]);
                            if (!isNaN(n)) val += n;
                        }
                    });
                });
            }
            // Standard Scalar
            else {
                const rawVal = formValues[src.id];
                if (typeof rawVal === 'number') val = rawVal;
                else if (typeof rawVal === 'string') val = parseFloat(rawVal);
                if (isNaN(val)) val = 0;
            }

            return {
                name: src.label,
                fullLabel: src.label,
                score: val
            };
        }).filter((item: any) => item !== null);

        if (chartData.length === 0) {
            return <div className="p-4 border border-dashed rounded text-sm text-red-500 text-center">Nenhuma fonte válida encontrada.</div>;
        }
    }

    const ChartComponent = field.chartType === 'bar' ? BarChart :
        field.chartType === 'line' ? LineChart :
            field.chartType === 'area' ? AreaChart :
                field.chartType === 'radar' ? RadarChart : BarChart;

    const chartColor = field.chartColor || '#8884d8';

    return (
        <div className="w-full h-[300px] border rounded bg-white p-4 relative">
            <p className="text-center font-bold mb-4">{field.label}</p>

            {/* Axis Labels (Overlay) */}
            {field.yAxisLabel && <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">{field.yAxisLabel}</div>}
            {field.xAxisLabel && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">{field.xAxisLabel}</div>}

            <ResponsiveContainer width="100%" height="100%">
                <ChartComponent data={chartData}>
                    {field.chartType !== 'pie' && <CartesianGrid strokeDasharray="3 3" />}
                    {field.chartType !== 'pie' && field.chartType !== 'radar' && <XAxis dataKey="name" fontSize={10} />}
                    {field.chartType !== 'pie' && field.chartType !== 'radar' && <YAxis />}
                    {field.chartType === 'radar' && <PolarGrid />}
                    {field.chartType === 'radar' && <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />}
                    {field.chartType === 'radar' && <PolarRadiusAxis angle={30} domain={[0, 'auto']} />}
                    <Tooltip />
                    <Legend />

                    {/* Series Generation */}
                    {(sourceIds.length > 1 || firstSource?.type !== 'grid' || (firstSource?.type === 'grid' && firstSource?.gridType === 'radio')) ? (
                        field.chartType === 'radar' ? (
                            <Radar name="Pontuação" dataKey="score" stroke={chartColor} fill={chartColor} fillOpacity={0.6} />
                        ) : (
                            <Bar dataKey="score" fill={chartColor} name="Pontuação" />
                        )
                    ) : (
                        firstSource?.columns?.map((col: string, i: number) => {
                            const color = `hsl(${i * 60}, 70%, 50%)`;
                            if (field.chartType === 'radar') return <Radar key={i} name={col} dataKey={col} stroke={color} fill={color} fillOpacity={0.4} />;
                            if (field.chartType === 'bar') return <Bar key={i} dataKey={col} fill={color} />;
                            if (field.chartType === 'line') return <Line key={i} type="monotone" dataKey={col} stroke={color} />;
                            return <Area key={i} type="monotone" dataKey={col} stackId="1" stroke={color} fill={color} />;
                        })
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
};
