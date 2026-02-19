import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { updateFormSettings } from '../actions';
import { toast } from 'sonner';
import { Check, Shield, Users, Lock, Eye, Pencil, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { getRoles } from '@/app/dashboard/[slug]/settings/roles/actions';

interface FormSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateId: string;
    initialActive: boolean;
    initialAllowedRoles: string[];
    initialAccessConfig?: any; // [NEW] 
    professionals: any[];
}

export function FormSettingsDialog({
    open,
    onOpenChange,
    templateId,
    initialActive,
    initialAllowedRoles,
    initialAccessConfig,
    professionals
}: FormSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(initialActive);

    // Legacy support: allowedRoles still used for primary visibility or Master overrides
    const [allowedRoles, setAllowedRoles] = useState<string[]>(initialAllowedRoles || []);

    // [NEW] Granular Access Config (Layer 3)
    const [accessConfig, setAccessConfig] = useState<any>(initialAccessConfig || {
        roles: {},
        users: {}
    });

    const [systemRoles, setSystemRoles] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            getRoles().then(setSystemRoles).catch(console.error);
        }
    }, [open]);

    const handleSave = async () => {
        setLoading(true);
        const res = await updateFormSettings(templateId, {
            is_active: isActive,
            allowed_roles: allowedRoles,
            access_config: accessConfig // Save the granular matrix
        });
        setLoading(false);

        if (res.success) {
            toast.success("Configurações salvas com sucesso!");
            onOpenChange(false);
        } else {
            toast.error(res.error || "Erro ao salvar configurações.");
        }
    };

    const togglePermission = (type: 'roles' | 'users', id: string, permission: string) => {
        setAccessConfig((prev: any) => {
            const next = { ...prev };
            if (!next[type]) next[type] = {};
            if (!next[type][id]) next[type][id] = [];

            if (next[type][id].includes(permission)) {
                next[type][id] = next[type][id].filter((p: string) => p !== permission);
            } else {
                next[type][id] = [...next[type][id], permission];
            }
            return next;
        });
    };

    const hasPermission = (type: 'roles' | 'users', id: string, permission: string) => {
        return accessConfig[type]?.[id]?.includes(permission);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Configurações de Acesso Granular
                    </DialogTitle>
                    <DialogDescription>
                        Defina quem pode visualizar, preencher ou editar este formulário (Ativo de Conteúdo).
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="roles" className="flex-1 overflow-hidden flex flex-col mt-4">
                    <div className="px-6 flex items-center justify-between border-b pb-2">
                        <TabsList className="grid grid-cols-2 w-[300px]">
                            <TabsTrigger value="roles" className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Por Perfil
                            </TabsTrigger>
                            <TabsTrigger value="users" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Por Usuário
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">Status:</Label>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="roles" className="mt-0 space-y-4">
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4">
                                <p className="text-xs text-blue-700 leading-relaxed italic">
                                    <strong>Dica:</strong> Permissões dadas ao perfil (ex: Fisioterapeuta)
                                    serão aplicadas a todos os membros desse grupo.
                                </p>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="text-left p-3 font-semibold">Perfil</th>
                                            <th className="text-center p-3 font-semibold w-20">Ver</th>
                                            <th className="text-center p-3 font-semibold w-20">Lançar</th>
                                            <th className="text-center p-3 font-semibold w-20">Editar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {systemRoles.map(role => (
                                            <tr key={role.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3">
                                                    <p className="font-medium">{role.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{role.organization_id ? 'Clínica' : 'Sistema'}</p>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Checkbox
                                                        checked={hasPermission('roles', role.id, 'view')}
                                                        onCheckedChange={() => togglePermission('roles', role.id, 'view')}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Checkbox
                                                        checked={hasPermission('roles', role.id, 'fill')}
                                                        onCheckedChange={() => togglePermission('roles', role.id, 'fill')}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Checkbox
                                                        checked={hasPermission('roles', role.id, 'edit')}
                                                        onCheckedChange={() => togglePermission('roles', role.id, 'edit')}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="mt-0 space-y-4">
                            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 mb-4">
                                <p className="text-xs text-amber-700 leading-relaxed italic">
                                    <strong>Atenção:</strong> Permissões individuais têm prioridade sobre as permissões de grupo.
                                </p>
                            </div>

                            <div className="border rounded-lg divide-y">
                                {professionals.map(pro => (
                                    <div key={pro.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                                                {pro.photo_url ? (
                                                    <img src={pro.photo_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold">{pro.full_name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{pro.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{pro.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Ver</Label>
                                                <Checkbox
                                                    checked={hasPermission('users', pro.id, 'view')}
                                                    onCheckedChange={() => togglePermission('users', pro.id, 'view')}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Lançar</Label>
                                                <Checkbox
                                                    checked={hasPermission('users', pro.id, 'fill')}
                                                    onCheckedChange={() => togglePermission('users', pro.id, 'fill')}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Editar</Label>
                                                <Checkbox
                                                    checked={hasPermission('users', pro.id, 'edit')}
                                                    onCheckedChange={() => togglePermission('users', pro.id, 'edit')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="p-6 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        {loading && <Check className="h-4 w-4 animate-spin" />}
                        Salvar Matriz de Acesso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
