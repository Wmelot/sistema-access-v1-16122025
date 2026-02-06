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
    // Retorna a versão em SVG base64 para uso em tags img ou favicon se necessário
    const bookIconSvg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
            <rect width='32' height='32' rx='8' fill='#8C132C'/>
            <g transform='translate(6, 6) scale(0.8)'>
                <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' fill='none' stroke='#363636' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>
                <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' fill='none' stroke='#363636' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>
            </g>
        </svg>
    `.trim();
    return `data:image/svg+xml;base64,${btoa(bookIconSvg)}`;
};
