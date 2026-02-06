'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

export const AcademicLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
    return (
        <div className={`bg-[#8C132C] rounded-2xl flex items-center justify-center p-2 ${className}`}>
            <BookOpen className="text-[#363636]" size="100%" />
        </div>
    );
};

export const AcademicLogoString = () => {
    // Retorna a URL do Brasão Oficial para melhor estética nos relatórios impressos
    return "https://portal.pucminas.br/main/images/brasao_puc_minas.png";
};
