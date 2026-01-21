"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, LogIn, Pencil, Trash2 } from "lucide-react";
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

interface Organization {
    id: string;
    name: string;
    plan: string | null;
    created_at: string | null;
    slug?: string; // Add slug to interface for edit
}

interface TenantsListProps {
    organizations: Organization[];
}

export function TenantsList({ organizations }: TenantsListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Delete State
    const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [isSwitching, setIsSwitching] = useState(false);
    const router = useRouter();

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (org: Organization) => {
        setEditingOrg(org);
        setIsFormOpen(true);
    };

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

            // Client Side Redirect
            toast.success("Acesso autorizado!");
            // router.refresh(); 
            // router.push('/dashboard');
            window.location.href = '/dashboard'; // Force full reload to bypass any cached redirects

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao trocar de organização");
            setIsSwitching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Clínicas Parceiras</h1>
                    <p className="text-zinc-500">Gerencie todos os tenants ativos na plataforma.</p>
                </div>
                <CreateTenantForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    initialData={editingOrg}
                    trigger={
                        <Button onClick={handleCreate} className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Clínica
                        </Button>
                    }
                />
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Todas as Clínicas</CardTitle>
                        <div className="relative w-64">
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
                            {filteredOrgs && filteredOrgs.length > 0 ? (
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
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-zinc-900">{org.name}</span>
                                                    {/* <span className="text-xs text-zinc-500">ID: ...{org.id.slice(-4)}</span> */}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium border-zinc-200 bg-white text-zinc-700 capitalize shadow-sm">
                                                {org.plan || 'Free'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 text-sm">
                                            {formatDate(org.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                Ativo
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(org); }}
                                                    title="Excluir Clínica"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="h-4 w-[1px] bg-zinc-200 mx-1" />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1.5 text-zinc-600 hover:text-zinc-900"
                                                    onClick={(e) => { e.stopPropagation(); handleLogin(org.id); }}
                                                    disabled={isSwitching}
                                                >
                                                    <LogIn className="h-3.5 w-3.5 mr-1" />
                                                    Login
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `/admin/tenants/${org.id}`;
                                                    }}
                                                >
                                                    <span className="sr-only">Editar</span>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
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
                </CardContent>
            </Card>

            {deleteOrg && (
                <DeleteTenantModal
                    open={isDeleteOpen}
                    onOpenChange={setIsDeleteOpen}
                    orgName={deleteOrg.name}
                    orgId={deleteOrg.id}
                    onSuccess={() => {
                        // Optional: trigger refresh if needed, usually revalidatePath handles it
                        setDeleteOrg(null);
                    }}
                />
            )}
        </div>
    );
}


