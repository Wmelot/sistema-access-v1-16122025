'use server'

import { getCurrentUserPermissions } from "@/lib/rbac"

export async function fetchUserPermissions() {
    return await getCurrentUserPermissions()
}
