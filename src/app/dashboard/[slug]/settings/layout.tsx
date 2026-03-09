import { ManagementHeader } from "@/components/dashboard/management-header";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <div className="container mx-auto py-6 max-w-6xl space-y-6">
            <ManagementHeader
                slug={slug}
                title="Configurações do Sistema"
                description="Central de controle da sua clínica."
            />

            <div className="flex flex-col gap-6">
                <SettingsNav slug={slug} />
                <div className="min-h-[400px]">
                    {children}
                </div>
            </div>
        </div>
    );
}
