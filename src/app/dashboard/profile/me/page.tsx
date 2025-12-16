import { ProfessionalForm } from "@/app/dashboard/professionals/components/professional-form"
import { getServices } from "@/app/dashboard/services/actions"
import { getRoles } from "@/app/dashboard/settings/roles/actions"
import { getProfessional, getProfessionalServices } from "@/app/dashboard/professionals/actions"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MyProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const professional = await getProfessional(user.id)

    if (!professional) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <h2 className="text-xl font-semibold">Perfil Profissional Não Encontrado</h2>
                <p>Seu usuário (Master/Admin) não possui um registro de profissional vinculado.</p>
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
            readOnly={true}
        />
    )
}
