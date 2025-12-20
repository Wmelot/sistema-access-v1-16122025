"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string | React.ReactNode
    onConfirm: () => void | Promise<void>
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive" | "warning"
    isLoading?: boolean
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title = "Confirmar Ação",
    description,
    onConfirm,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
    isLoading = false
}: ConfirmationDialogProps) {
    const handleConfirm = async () => {
        await onConfirm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {variant === "destructive" || variant === "warning" ? (
                            <AlertTriangle className={cn("h-5 w-5", variant === "destructive" ? "text-destructive" : "text-amber-500")} />
                        ) : (
                            <Info className="h-5 w-5 text-blue-500" />
                        )}
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                </DialogHeader>
                <div className="py-4">
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </div>
                </div>
                <DialogFooter className="flex-row justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "warning" ? "default" : variant}
                        className={cn(variant === "warning" && "bg-amber-500 hover:bg-amber-600 text-white")}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processando..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
