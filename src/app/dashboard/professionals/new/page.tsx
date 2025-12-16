import { ProfessionalForm } from "../components/professional-form"
import { getServices } from "@/app/dashboard/services/actions"
import { getRoles } from "../../settings/roles/actions"
import { hasPermission } from "@/lib/rbac"

export default async function NewProfessionalPage() {
    const services = await getServices()
    const roles = await getRoles()
    const canManageRoles = await hasPermission('roles.manage')

    return <ProfessionalForm services={services || []} roles={roles || []} canManageRoles={canManageRoles} />
}
