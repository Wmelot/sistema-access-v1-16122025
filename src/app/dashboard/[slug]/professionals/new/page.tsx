import { ProfessionalForm } from "../components/professional-form"
import { getServices } from "@/app/dashboard/[slug]/services/actions"
import { getRoles } from "../../settings/roles/actions"
import { hasPermission } from "@/lib/rbac"

export default async function NewProfessionalPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const services = await getServices()
    const roles = await getRoles(slug)
    const canManageRoles = await hasPermission('roles.manage')

    return <ProfessionalForm services={services || []} roles={roles || []} canManageRoles={canManageRoles} />
}
