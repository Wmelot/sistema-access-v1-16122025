"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraftsDialog } from "./DraftsDialog";
import { DraftCountBadge } from "./DraftCountBadge";

interface DraftsModalButtonProps {
    isCollapsed?: boolean;
    className?: string;
}

export function DraftsModalButton({ isCollapsed, className }: DraftsModalButtonProps) {
    const [open, setOpen] = useState(false);
    const { slug } = useParams<{ slug: string }>();

    return (
        <>
            <div className={cn("px-3 py-1", className)}>
                <Button
                    onClick={() => setOpen(true)}
                    variant="ghost"
                    className={cn(
                        "w-full bg-white text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all relative flex items-center shadow-sm group",
                        isCollapsed ? "px-0 justify-center h-10 w-10 rounded-xl" : "justify-start gap-3 h-11 px-4 rounded-2xl text-left"
                    )}
                    title={isCollapsed ? "Rascunhos Rápidos" : undefined}
                >
                    <div className={cn(
                        "flex items-center justify-center rounded-lg h-6 w-6 shrink-0 bg-slate-100 text-slate-500 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600",
                        isCollapsed ? "bg-white border-slate-200 text-slate-400 rounded-xl h-8 w-8" : ""
                    )}>
                        <PenTool className={cn(isCollapsed ? "h-5 w-5" : "h-3.5 w-3.5")} strokeWidth={isCollapsed ? 2 : 3} />
                    </div>

                    {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                            <span className="text-[13px] tracking-tight">Rascunhos</span>
                            <DraftCountBadge />
                        </div>
                    )}
                </Button>
            </div>

            <DraftsDialog
                open={open}
                onOpenChange={setOpen}
                slug={slug}
            />
        </>
    );
}
