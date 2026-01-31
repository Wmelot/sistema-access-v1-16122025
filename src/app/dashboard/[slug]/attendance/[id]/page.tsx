import { getAttendanceData, startAttendance } from "@/actions/attendance"
import { notFound } from "next/navigation"
import { AttendanceClient } from "../attendance-client"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AttendancePage({ params }: { params: Promise<{ id: string, slug: string }> }) {
    const { id, slug } = await params
    const supabase = await createClient()

    try {
        const data = await getAttendanceData(id, slug)
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id

        // Filter templates based on visibility rules
        const filteredTemplates = (data.templates || []).filter((t: any) => {
            if (!t) return false
            // 1. Check if active (undefined is considered true for legacy)
            if (t.is_active === false) return false

            // 2. Check restricted roles
            if (t.allowed_roles && Array.isArray(t.allowed_roles) && t.allowed_roles.length > 0) {
                // If roles are defined, user MUST be in the list
                if (!userId || !t.allowed_roles.includes(userId)) return false
            }

            return true
        })

        return (
            <AttendanceClient
                appointment={data.appointment}
                patient={data.patient}
                templates={filteredTemplates}
                preferences={data.preferences || []}
                existingRecord={data.existingRecord}
                history={data.history || []}
                assessments={data.assessments || []}
                paymentMethods={data.paymentMethods || []}
                professionals={data.professionals || []}
            />
        )
    } catch (e: any) {
        console.error("Error loading attendance page:", e)
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-xl shadow-sm border">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar prontuário</h2>
                <p className="text-gray-500 mb-6 max-w-md">{e?.message || "Ocorreu um problema ao buscar os dados deste atendimento."}</p>
                <Link href={`/dashboard/${slug}/schedule`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Voltar para Agenda
                </Link>
            </div>
        )
    }
}
