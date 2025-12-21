import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { RadarChart } from '@/components/charts/radar-chart'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

// Component to render inside the editor
const ChartComponent = (props: any) => {
    const [chartData, setChartData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const chartId = props.node.attrs.chartId

    useEffect(() => {
        const fetchChart = async () => {
            if (!chartId) return

            const supabase = createClient()
            const { data: chart } = await supabase
                .from('chart_templates')
                .select('*')
                .eq('id', chartId)
                .single()

            if (chart) {
                // Prepare Mock Data for Preview
                const mockData = (chart.config?.axes || []).map((axis: any) => ({
                    subject: axis.label,
                    value: Math.floor(Math.random() * 5) + 5, // Random 5-10 for preview
                    fullMark: 10
                }))
                setChartData(mockData)
            }
            setLoading(false)
        }

        fetchChart()
    }, [chartId])

    return (
        <NodeViewWrapper className="report-chart-block my-4 p-4 border rounded-lg bg-slate-50 relative group">
            {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : chartData ? (
                <>
                    <div className="text-center font-bold mb-2 text-sm text-muted-foreground uppercase tracking-widest pointer-events-none">
                        Visualização do Gráfico
                    </div>
                    <RadarChart data={chartData} />
                    <div className="absolute inset-0 bg-transparent" /> {/* Overlay to prevent chart interactions stealing focus */}
                </>
            ) : (
                <div className="text-center text-red-500 py-8">Gráfico não encontrado</div>
            )}
        </NodeViewWrapper>
    )
}

export const ChartExtension = Node.create({
    name: 'reportChart',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            chartId: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'report-chart',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['report-chart', mergeAttributes(HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ChartComponent)
    },
})
