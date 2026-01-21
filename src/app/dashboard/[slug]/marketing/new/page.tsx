import { NewCampaignWizard } from "../components/new-campaign-wizard"

export default function NewCampaignPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nova Campanha</h1>
                <p className="text-muted-foreground">
                    Importe contatos e configure seu envio em massa.
                </p>
            </div>
            <NewCampaignWizard />
        </div>
    )
}
