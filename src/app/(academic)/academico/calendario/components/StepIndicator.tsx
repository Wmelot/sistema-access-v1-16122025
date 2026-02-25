'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useSyllabus } from './SyllabusContext';

export function StepIndicator() {
    const { step } = useSyllabus();

    return (
        <div className="flex items-center justify-center mb-12 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500",
                        step === i ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20 scale-110" :
                            step > i ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                                "bg-slate-100 text-slate-400"
                    )}>
                        {step > i ? <CheckCircle2 size={18} /> : i}
                    </div>
                    {i < 4 && (
                        <div className="w-14 h-1 mx-2 bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                                className={cn(
                                    "absolute inset-0 bg-emerald-500 transition-all duration-700",
                                    step > i ? "w-full" : "w-0"
                                )}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
