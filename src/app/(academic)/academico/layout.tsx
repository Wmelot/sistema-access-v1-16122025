import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Axiom | Portal Acadêmico SINAES",
    description: "Sistema institucional de gestão de evidências acadêmicas para acreditação SINAES/MEC.",
    icons: {
        icon: [
            {
                url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMicgaGVpZ2h0PSczMicgdmlld0JveD0nMCAwIDMyIDMyJz48cmVjdCB3aWR0aD0nMzInIGhlaWdodD0nMzInIHJ4PSc4JyBmaWxsPScjOEMxMzJDJy8+PGcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoNiwgNikgc2NhbGUoMC44KSc+PHBhdGggZD0nTTIgM2g2YTQgNCAwIDAgMSA0IDR2MTRhMyAzIDAgMCAwLTMtM0gyeicgZmlsbD0nbm9uZScgc3Ryb2tlPScjMzYzNjM2JyBzdHJva2Utd2lkdGg9JzIuNScnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcvPjxwYXRoIGQ9J00yMiAzaC02YTQgNCAwIDAgMC00IDR2MTRhMyAzIDAgMCAxIDMtM2g3eicgZmlsbD0nbm9uZScgc3Ryb2tlPScjMzYzNjM2JyBzdHJva2Utd2lkdGg9JzIuNScnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcvPjwvZz48L3N2Zz4=",
                type: "image/svg+xml",
            }
        ],
        apple: [
            {
                url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMicgaGVpZ2h0PSczMicgdmlld0JveD0nMCAwIDMyIDMyJz48cmVjdCB3aWR0aD0nMzInIGhlaWdodD0nMzInIHJ4PSc4JyBmaWxsPScjOEMxMzJDJy8+PGcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoNiwgNikgc2NhbGUoMC44KSc+PHBhdGggZD0nTTIgM2g2YTQgNCAwIDAgMSA0IDR2MTRhMyAzIDAgMCAwLTMtM0gyeicgZmlsbD0nbm9uZScgc3Ryb2tlPScjMzYzNjM2JyBzdHJva2Utd2lkdGg9JzIuNScnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcvPjxwYXRoIGQ9J00yMiAzaC02YTQgNCAwIDAgMC00IDR2MTRhMyAzIDAgMCAxIDMtM2g3eicgZmlsbD0nbm9uZScgc3Ryb2tlPScjMzYzNjM2JyBzdHJva2Utd2lkdGg9JzIuNScnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcvPjwvZz48L3N2Zz4=",
                type: "image/svg+xml",
            }
        ],
    },
    openGraph: {
        title: "Axiom | Portal Acadêmico SINAES",
        description: "Sistema institucional de gestão de evidências acadêmicas para acreditação SINAES/MEC.",
        images: ["/academic-og.png"], // I should probably generate or specify an image, but text is most important for now
    }
};

export default function AcademicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
