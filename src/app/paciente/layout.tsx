import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Meu Acompanhamento | Axiom Health",
    description: "Seu portal de acompanhamento fisioterapêutico personalizado",
    themeColor: "#ec4899",
    appleWebApp: {
        capable: true,
        title: "Meu Acompanhamento",
        statusBarStyle: "default",
    },
    manifest: "/patient-manifest.json",
};

export default function PatientPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
