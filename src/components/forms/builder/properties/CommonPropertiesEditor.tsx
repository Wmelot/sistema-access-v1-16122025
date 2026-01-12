import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Type, HelpCircle, LayoutGrid, AlertCircle, FileText } from 'lucide-react';
import { LogicEditor } from './LogicEditor';

interface CommonPropertiesEditorProps {
    field: any;
    allFields?: any[]; // Allow optional for now to avoid breaking if not passed immediately
    onUpdate: (key: string, value: any) => void;
}

export const CommonPropertiesEditor = ({ field, allFields = [], onUpdate }: CommonPropertiesEditorProps) => {

    // Helper to determine if field supports placeholder
    const supportsPlaceholder = ['text', 'textarea', 'number', 'email', 'phone', 'date'].includes(field.type);

    return (
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="logic">Lógica</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                {/* Main Identity */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                        <Type className="w-4 h-4" />
                        <span>Identificação</span>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase font-bold">Título do Campo (Label)</Label>
                        <Input
                            value={field.label || ''}
                            onChange={(e) => onUpdate('label', e.target.value)}
                            placeholder="Ex: Nome Completo"
                        />
                    </div>

                    {supportsPlaceholder && (
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Texto Fantasma (Placeholder)</Label>
                            <Input
                                value={field.placeholder || ''}
                                onChange={(e) => onUpdate('placeholder', e.target.value)}
                                placeholder="Ex: Digite seu nome..."
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase font-bold">Texto de Ajuda</Label>
                        <Input
                            value={field.helpText || ''}
                            onChange={(e) => onUpdate('helpText', e.target.value)}
                            placeholder="Ex: Instruções para o usuário..."
                        />
                    </div>
                </div>

                {/* Layout & Behavior */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                        <LayoutGrid className="w-4 h-4" />
                        <span>Layout & Comportamento</span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase font-bold">Largura no Formulário</Label>
                        <div className="flex bg-muted p-1 rounded-md">
                            {[
                                { val: 'full', label: '100%', icon: '⬛' },
                                { val: '1/2', label: '50%', icon: 'db' },
                                { val: '1/3', label: '33%', icon: 'tr' },
                                { val: '1/4', label: '25%', icon: 'qt' },
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => onUpdate('width', opt.val)}
                                    className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${(field.width === opt.val || (!field.width && opt.val === 'full'))
                                        ? 'bg-white shadow text-primary font-bold'
                                        : 'text-muted-foreground hover:bg-white/50'
                                        }`}
                                    title={`Largura ${opt.label}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border p-3 rounded-md bg-slate-50">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Obrigatório</Label>
                            <p className="text-xs text-muted-foreground">Impede envio se vazio</p>
                        </div>
                        <Switch
                            checked={field.required || false}
                            onCheckedChange={(checked) => onUpdate('required', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between border p-3 rounded-md bg-slate-50">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Oculto</Label>
                            <p className="text-xs text-muted-foreground">Esconde o campo (bom para lógica)</p>
                        </div>
                        <Switch
                            checked={field.hidden || false}
                            onCheckedChange={(checked) => onUpdate('hidden', checked)}
                        />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="logic" className="animate-in slide-in-from-right-2 duration-300">
                <LogicEditor
                    field={field}
                    allFields={allFields}
                    onChange={(updates) => {
                        // LogicEditor returns object of updates, we separate them
                        Object.keys(updates).forEach(key => {
                            onUpdate(key, (updates as any)[key]);
                        });
                    }}
                />
            </TabsContent>
        </Tabs>
    );
};
