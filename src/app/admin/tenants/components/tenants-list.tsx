"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, LogIn, Pencil, Trash2, RefreshCcw } from "lucide-react";
import { restoreTenant } from "../actions";
import { toast } from "sonner";

import { CreateTenantForm } from "../create-tenant-form";
import { formatDate } from "@/lib/utils/date";
import { switchOrganization } from "../actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteTenantModal } from "./delete-tenant-modal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Organization {
    id: string;
    name: string;
    plan: string | null;
    created_at: string | null;
    slug?: string;
    status?: string;
}

interface TenantsListProps {
    organizations: Organization[];
}

export function TenantsList({ organizations }: TenantsListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [isSwitching, setIsSwitching] = useState(false);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');

    const filteredOrgs = organizations
        .filter(org => {
            const status = org.status || 'active';
            if (activeTab === 'trash') {
                return status === 'deleted';
            }
            return status !== 'deleted';
        })
        .filter(org => org.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleRestore = async (id: string) => {
        const res = await restoreTenant(id);
        if (res.success) {
            toast.success("Clínica restaurada com sucesso!");
            router.refresh();
        } else {
            toast.error("Erro ao restaurar clínica");
        }
    }

    const handleDeleteClick = (org: Organization) => {
        setDeleteOrg(org);
        setIsDeleteOpen(true);
    };

    const handleCreate = () => {
        setEditingOrg(null);
        setIsFormOpen(true);
    };

    const handleLogin = async (orgId: string) => {
        setIsSwitching(true);
        toast.info("Acessando clínica...", { duration: 2000 });
        try {
            const result = await switchOrganization(orgId);
            if (result && !result.success) {
                throw new Error(result.error);
            }
            toast.success("Acesso autorizado!");
            window.location.href = '/dashboard';
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao trocar de organização");
            setIsSwitching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Clínicas Parceiras</h1>
                    <p className="text-zinc-500 text-sm">Gerencie todos os tenants ativos na plataforma.</p>
                </div>
                <CreateTenantForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    initialData={editingOrg}
                    trigger={
                        <Button onClick={handleCreate} className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Clínica
                        </Button>
                    }
                />
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="pb-3 border-b px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Desktop Tabs */}
                        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="hidden md:block">
                            <TabsList>
                                <TabsTrigger value="active" className="text-xs">Ativas</TabsTrigger>
                                <TabsTrigger value="trash" className="text-xs flex items-center gap-2">
                                    Lixeira
                                    {organizations.filter((o: any) => o.status === 'deleted').length > 0 && (
                                        <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                            {organizations.filter((o: any) => o.status === 'deleted').length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Mobile Select (Dropdown style) */}
                        <div className="md:hidden w-full">
                            <Select value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Ativas</SelectItem>
                                    <SelectItem value="trash">Lixeira ({organizations.filter((o: any) => o.status === 'deleted').length})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Buscar clínica..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Nome</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Data Criação</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrgs.length > 0 ? (
                                    filteredOrgs.map((org) => (
                                        <TableRow
                                            key={org.id}
                                            className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                                            onClick={() => window.location.href = `/admin/tenants/${org.id}`}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-indigo-100">
                                                        {org.name[0]}
                                                    </div>
                                                    <span className="text-sm font-semibold text-zinc-900">{org.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white text-zinc-700 capitalize">
                                                    {org.plan || 'Free'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-sm">
                                                {formatDate(org.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={org.status === 'deleted'
                                                    ? "bg-red-50 text-red-700 border-red-100"
                                                    : org.status === 'suspended'
                                                        ? "bg-amber-50 text-amber-700 border-amber-100"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                }>
                                                    {org.status === 'deleted' ? 'Excluído' : org.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {activeTab === 'trash' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-100"
                                                            onClick={() => handleRestore(org.id)}
                                                        >
                                                            <RefreshCcw className="h-3.5 w-3.5" />
                                                            Restaurar
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-700"
                                                                onClick={() => handleDeleteClick(org)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-xs"
                                                                onClick={() => handleLogin(org.id)}
                                                                disabled={isSwitching}
                                                            >
                                                                <LogIn className="h-3.5 w-3.5 mr-1" />
                                                                Login
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-zinc-400"
                                                                onClick={() => window.location.href = `/admin/tenants/${org.id}`}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                            Nenhuma clínica encontrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Responsive List (Cards-style) */}
                    <div className="md:hidden divide-y divide-zinc-100">
                        {filteredOrgs.length > 0 ? (
                            filteredOrgs.map((org) => (
                                <div key={org.id} className="p-4 space-y-4 active:bg-zinc-50 transition-colors"
                                    onClick={() => window.location.href = `/admin/tenants/${org.id}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold ring-1 ring-indigo-100">
                                                {org.name[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900">{org.name}</span>
                                                <span className="text-xs text-zinc-500">{org.plan || 'Free'} • {formatDate(org.created_at)}</span>
                                            </div>
                                        </div>
                                        <Badge className={org.status === 'deleted'
                                            ? "bg-red-50 text-red-700 border-red-100"
                                            : org.status === 'suspended'
                                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        }>
                                            {org.status === 'deleted' ? 'Excluído' : org.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                        {activeTab === 'trash' ? (
                                            <Button
                                                variant="outline"
                                                className="w-full text-emerald-600 border-emerald-100"
                                                onClick={() => handleRestore(org.id)}
                                            >
                                                <RefreshCcw className="h-4 w-4 mr-2" />
                                                Restaurar
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
                                                    onClick={() => handleLogin(org.id)}
                                                    disabled={isSwitching}
                                                >
                                                    <LogIn className="h-4 w-4 mr-2" />
                                                    Acessar
                                                </Button>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => window.location.href = `/admin/tenants/${org.id}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 text-red-500 border-red-100"
                                                        onClick={() => handleDeleteClick(org)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-zinc-500">
                                Nenhuma clínica encontrada.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {deleteOrg && (
                <DeleteTenantModal
                    open={isDeleteOpen}
                    onOpenChange={setIsDeleteOpen}
                    orgName={deleteOrg.name}
                    orgId={deleteOrg.id}
                    onSuccess={() => {
                        setDeleteOrg(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}


