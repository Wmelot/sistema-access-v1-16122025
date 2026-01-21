
'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Settings2 } from "lucide-react"
import { WidgetDefinition, WidgetID } from "./registry"

interface ManageWidgetsDialogProps {
    allWidgets: WidgetDefinition[]
    enabledWidgets: WidgetID[]
    onToggle: (id: WidgetID, enabled: boolean) => void
}

export function ManageWidgetsDialog({ allWidgets, enabledWidgets, onToggle }: ManageWidgetsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Gerenciar Widgets
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Personalizar Painel</DialogTitle>
                    <DialogDescription>
                        Ative ou desative os widgets que você deseja ver na tela inicial.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {allWidgets.map((widget) => {
                        const isEnabled = enabledWidgets.includes(widget.id)
                        const Icon = widget.icon
                        return (
                            <div key={widget.id} className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{widget.title}</p>
                                        <p className="text-xs text-muted-foreground">{widget.description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => onToggle(widget.id, checked)}
                                />
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
