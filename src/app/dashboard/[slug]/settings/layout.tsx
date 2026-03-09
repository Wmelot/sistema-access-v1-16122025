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
            <SettingsNav slug={slug} />
            <div className="min-h-[400px]">
                {children}
            </div>
        </div>
    );
}
