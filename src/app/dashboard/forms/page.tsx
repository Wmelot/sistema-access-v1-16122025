"use client";

import PalmilhaAccessForm from "@/features/pbe/components/PalmilhaAccessForm";

export default function FormsGalleryPage() {
    // A page agora renderiza DIRETAMENTE o container principal do formulário,
    // que já possui o dropdown de navegação e a lógica de troca de contexto.
    return <PalmilhaAccessForm patientId="sandbox-mode" />;
}
