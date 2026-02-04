"use client";

import { cn } from "@/lib/utils";
import { checkStatus } from "@/utils/clinical-references";

export const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;

    // Se "empty" mas queremos mostrar algo placeholders, ok. Mas aqui assumimos form-group.
    if (isEmpty) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;

    // Lógica Centralizada (Brain)
    const status = checkStatus(type as any, v);

    // Fallback se não encontrar
    if (!status) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">N/A</div>;

    return <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};
