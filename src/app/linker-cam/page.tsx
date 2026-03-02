import React from 'react';

export default function LinkerCamPage() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <h1 className="text-white text-2xl font-black mb-4">Axiom Linker Cam</h1>
            <p className="text-slate-400 text-center max-w-sm mb-8">
                Em breve, esta tela se conectará diretamente à câmera do seu celular para gravar vídeos e enviá-los em tempo real para o computador.
            </p>

            {/* TODO (Passo 2 - Implementação da Câmera):
                - Usar <Webcam> puxando a câmera traseira (environment).
                - Escutar `window.addEventListener("deviceorientation", ...)` para ler a inclinação beta/gamma.
                - Mostrar um guiador visual na tela (uma "bolha" de nível ou cruz) que só libera o botão GRAVAR
                  se o celular estiver em 90 graus exatos (vertical perfeita) nos eixos, visando **evitar o efeito paralax**.
            */}
            <div className="border border-dashed border-slate-700 rounded-2xl p-6 bg-slate-800/50 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-700 animate-pulse mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-500" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Módulo em Construção</span>
            </div>
        </div>
    );
}
