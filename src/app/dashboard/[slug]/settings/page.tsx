import { redirect } from 'next/navigation';

export default async function SettingsPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ tab?: string }>
}) {
    const { slug } = await params;
    const { tab } = await searchParams;

    // Legacy support: redirect ?tab=X to /settings/X
    if (tab) {
        if (tab === 'general') redirect(`/dashboard/${slug}/settings/general`);
        if (tab === 'integrations') redirect(`/dashboard/${slug}/settings/integrations`);
        if (tab === 'reports') redirect(`/dashboard/${slug}/settings/reports`);
        if (tab === 'intelligence') redirect(`/dashboard/${slug}/settings/intelligence`);
        if (tab === 'users') redirect(`/dashboard/${slug}/settings/users`);
        if (tab === 'roles') redirect(`/dashboard/${slug}/settings/roles`);
    }

    // Default redirect to general settings
    redirect(`/dashboard/${slug}/settings/general`);
}
