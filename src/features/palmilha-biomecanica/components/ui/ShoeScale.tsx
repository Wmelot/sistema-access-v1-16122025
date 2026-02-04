"use client";

import { cn } from "@/lib/utils";

export const ShoeScale = ({ label, value, onChange, options }: { label: string, value: any, onChange: (val: string) => void, options: { val: string, label: string }[] }) => {
    return (
        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-white hover:shadow-sm">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {options.map((opt) => (
                    <button
                        key={opt.val}
                        type="button"
                        onClick={() => onChange(opt.val)}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border shadow-sm",
                            String(value) === String(opt.val)
                                ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-slate-900/20"
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                        )}
                        title={opt.label}
                    >
                        {opt.val}
                    </button>
                ))}
            </div>
            {/* Find label of selected */}
            <div className="h-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight animate-in fade-in">
                    {options.find(o => String(o.val) === String(value))?.label}
                </span>
            </div>
        </div>
    );
};
