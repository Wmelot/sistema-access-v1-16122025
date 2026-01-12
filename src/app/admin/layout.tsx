import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./components/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Security Check: Is this user the Super Admin (Axiom Central)?
    // Master Org ID: 00000000-0000-0000-0000-000000000001
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, full_name, photo_url')
        .eq('id', user.id)
        .single();

    if (profile?.organization_id !== '00000000-0000-0000-0000-000000000001') {
        // Not a Master User -> Kick to Clinic Dashboard
        redirect("/dashboard");
    }

    const currUser = {
        name: profile.full_name || user.email,
        avatarUrl: profile.photo_url,
        email: user.email
    };

    return (
        <div className="flex min-h-screen w-full bg-zinc-50">
            <AdminSidebar currentUser={currUser} />
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
