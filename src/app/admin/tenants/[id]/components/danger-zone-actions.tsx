'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteTenantModal } from "../../components/delete-tenant-modal";

interface DangerZoneActionsProps {
    orgId: string;
    orgName: string;
}

export function DangerZoneActions({ orgId, orgName }: DangerZoneActionsProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Excluir Organização
            </Button>

            <DeleteTenantModal
                open={open}
                onOpenChange={setOpen}
                orgId={orgId}
                orgName={orgName}
            />
        </>
    );
}
