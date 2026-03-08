import { getCampaigns } from "./actions"
import { MarketingClient } from "./components/marketing-client"

export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const campaigns = await getCampaigns()

    return <MarketingClient slug={slug} campaigns={campaigns} />
}
