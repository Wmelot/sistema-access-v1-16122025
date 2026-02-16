"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export const ShoeScale = ({ label, value, onChange, options, tooltip }: { label: string, value: any, onChange: (val: string) => void, options: { val: string, label: string }[], tooltip?: string }) => {
    return (
        <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-white hover:shadow-sm">
            <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
                {tooltip && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-slate-300 hover:text-indigo-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-[11px] bg-slate-900 text-white border-slate-800">
                                {tooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
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
