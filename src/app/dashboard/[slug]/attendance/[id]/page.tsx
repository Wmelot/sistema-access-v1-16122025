import { getAttendanceData, startAttendance } from "@/actions/attendance"
import { notFound } from "next/navigation"
import { AttendanceClient } from "../attendance-client"
import { createClient } from "@/lib/supabase/server"
import { canAccessAsset } from "@/lib/rbac"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import RemoteMobileView from "../components/RemoteMobileView"

export default async function AttendancePage({ params, searchParams }: {
    params: Promise<{ id: string, slug: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id, slug } = await params
    const resolvedSearchParams = await searchParams
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()

        // [SAFETY] Always require login, especially for Remote Mode
        if (!user) {
            // Better: use redirect with the current URL as callback
            redirect(`/login?callbackUrl=/dashboard/${slug}/attendance/${id}`);
        }

        const data = await getAttendanceData(id, slug)
        const userId = user.id
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId!).single()
        const userRole = profile?.role

        // Filter templates based on Layer 3 visibility rules (Fill Permission)
        const templatesWithAccess = await Promise.all(
            (data.templates || []).map(async (t: any) => {
                if (!t || t.is_active === false) return null;
                const canFill = await canAccessAsset(t, 'fill');
                return canFill ? t : null;
            })
        );
        const filteredTemplates = templatesWithAccess.filter(Boolean);

        // Check if the request is for a remote mobile view
        const isRemoteMobileView = resolvedSearchParams.remote === 'true';

        if (isRemoteMobileView) {
            // This block is for the RemoteMobileView, which is typically a separate component
            // but the instruction implies a change here.
            // Assuming `data.appointment` is available and contains `id` and `organizations?.slug`
            const appointment = data.appointment; // Assuming data.appointment is available
            const PBE5_ID = 'pbe-5' // Define PBE5_ID here for RemoteMobileView context

            return (
                <div className="min-h-screen bg-gray-900 text-white">
                    {/* Header */}
                    <header className="px-6 pt-safe-top py-6 flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={() => {
                            // Return to the desktop view of the EXACT same record
                            window.location.href = `/dashboard/${slug}/attendance/${id}`;
                        }} className="rounded-full h-10 w-10 bg-white/10 text-white hover:bg-white/20">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        {/* Add other header elements if needed */}
                    </header>
                    {/* Render RemoteMobileView content here, or redirect to a dedicated remote view component */}
                    <div className="flex-1 overflow-hidden">
                        <RemoteMobileView
                            patient={data.patient}
                            appointment={data.appointment}
                            currentRecord={data.existingRecord}
                            templateId={data.existingRecord?.template_id || PBE5_ID}
                            onUpdate={() => { }} // Not needed for the SSR wrapper if it's just a view
                            onSave={async () => { }} // Not needed here
                            onClose={() => {
                                window.location.href = `/dashboard/${slug}/attendance/${id}`;
                            }}
                        />
                    </div>
                </div>
            );
        }

        const PBE5_ID = 'pbe-5'

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
