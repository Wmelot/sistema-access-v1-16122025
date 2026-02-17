'use server'

import { createAdminClient } from "@/lib/supabase/server"
import { generateStrategicAnalysis } from "@/lib/ai/gemini"

export async function getStrategicMetrics() {
    const supabase = await createAdminClient()

    // 1. Fetch Clinics & Plans
    const { data: clinics } = await supabase
        .from('organizations')
        .select(`
            id, 
            name, 
            status, 
            created_at,
            plan_configs (name, price_monthly)
        `)
        .eq('status', 'active')

    // 2. Fetch Activity (Audit Logs) for the last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: logs } = await supabase
        .from('audit_logs' as any)
        .select('organization_id, created_at')
        .gte('created_at', fourteenDaysAgo.toISOString())

    // 3. Process Activity Trends
    const activityPerClinic: Record<string, { current: number, previous: number }> = {}
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    logs?.forEach((log: any) => {
        if (!log.organization_id) return
        if (!activityPerClinic[log.organization_id]) {
            activityPerClinic[log.organization_id] = { current: 0, previous: 0 }
        }

        const logDate = new Date(log.created_at)
        if (logDate >= sevenDaysAgo) {
            activityPerClinic[log.organization_id].current++
        } else {
            activityPerClinic[log.organization_id].previous++
        }
    })

    // 4. Summarize for AI
    const summary = clinics?.map((c: any) => ({
        name: c.name,
        plan: c.plan_configs?.name,
        revenue: c.plan_configs?.price_monthly,
        activity: activityPerClinic[c.id] || { current: 0, previous: 0 },
        trend: activityPerClinic[c.id] ?
            ((activityPerClinic[c.id].current - activityPerClinic[c.id].previous) / (activityPerClinic[c.id].previous || 1) * 100).toFixed(0) + '%'
            : '0%'
    }))

    const totalMRR = clinics?.reduce((acc: number, c: any) => acc + (c.plan_configs?.price_monthly || 0), 0) || 0

    return {
        clinics: summary || [],
        totalMRR,
        lastUpdate: new Date().toISOString()
    }
}

export async function getAIStrategicInsight(metrics: any) {
    try {
        if (!metrics || metrics.clinics.length === 0) {
            return { error: "Não há dados suficientes de clínicas ativas para realizar uma análise estratégica." }
        }
        const insight = await generateStrategicAnalysis(metrics)
        return { insight }
    } catch (error: any) {
        console.error("AI Strategic Error:", error)
        return { error: `Erro na IA: ${error.message || 'Falha na comunicação com o motor Gemini Pro'}` }
    }
}
