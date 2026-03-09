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
            <div className="min-h-[400px]">
                {children}
            </div>
        </div>
    );
}
