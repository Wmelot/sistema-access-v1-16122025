import { ProfessionalForm } from "@/app/dashboard/[slug]/professionals/components/professional-form"
import { getServices } from "@/app/dashboard/[slug]/services/actions"
import { getRoles } from "@/app/dashboard/[slug]/settings/roles/actions"
import { getProfessional, getProfessionalServices } from "@/app/dashboard/[slug]/professionals/actions"
import { getAuthenticators } from "@/app/dashboard/[slug]/security/actions"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SecuritySettings } from "@/components/security/SecuritySettings"
import { User, Shield } from "lucide-react"

export default async function MyProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const professional = await getProfessional(user.id)
    const authenticators = await getAuthenticators()

    if (!professional) {
        // Even if no professional profile, user might want to set up security?
        // But the layout assumes professional context usually.
        // Let's allow access to security even without professional profile?
        // No, let's keep consistent error for now, or just show security tab?
        // "Perfil Profissional Não Encontrado" acts as a blocker.
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <h2 className="text-xl font-semibold">Perfil Profissional Não Encontrado</h2>
                <p>Seu usuário (Master/Admin) não possui um registro de profissional vinculado.</p>
                {/* Optional: Add security settings here too if needed */}
            </div>
        )
    }

    // Only fetch these if we have a professional to show
    const services = await getServices()
    const linkedServiceIds = await getProfessionalServices(user.id)
    const roles = await getRoles()

    const professionalWithServices = {
        ...professional,
        services: linkedServiceIds
    }

    return (
        <ProfessionalForm
            professional={professionalWithServices}
            services={services || []}
            roles={roles || []}
            canManageRoles={false}
            readOnly={false}
            isCurrentUser={true}
        />
    )
}
