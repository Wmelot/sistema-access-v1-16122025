import { ProfessionalForm } from "../components/professional-form"
import { getServices } from "@/app/dashboard/services/actions"
import { getRoles } from "../../settings/roles/actions"
import { hasPermission } from "@/lib/rbac"
import { getProfessional, getProfessionalServices } from "../actions"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function EditProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const professional = await getProfessional(id)
    if (!professional) {
        notFound()
    }

    const services = await getServices()
    const linkedServiceIds = await getProfessionalServices(id)
    const roles = await getRoles()
    const canManageRoles = await hasPermission('roles.manage')

    // Check if current user is the profile owner
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isCurrentUser = user?.id === id

    // Merge linked services into professional object for the form
    const professionalWithServices = {
        ...professional,
        services: linkedServiceIds
    }

    return <ProfessionalForm
        professional={professionalWithServices}
        services={services || []}
        roles={roles || []}
        canManageRoles={canManageRoles}
        isCurrentUser={isCurrentUser}
    />
}
