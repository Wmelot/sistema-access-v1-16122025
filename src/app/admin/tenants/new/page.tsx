import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function NewTenantPage() {
    async function createTenant(formData: FormData) {
        'use server'

        const name = formData.get('name') as string
        const plan = formData.get('plan') as string
        const primaryColor = formData.get('color') as string || '#000000'

        const supabase = await createClient()

        // 1. Create Organization
        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name,
                plan,
                primary_color: primaryColor
            })
            .select() // RLS might block return if not set up right, but we have the override now
            .single()

        if (error) {
            console.error('Error creating tenant:', error)
            throw new Error('Failed to create tenant')
        }

        redirect('/admin/tenants')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Nova Clínica</h1>
                <p className="text-zinc-500">Cadastre um novo tenant no ecossistema Axiom.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados da Organização</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createTenant} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Clínica</Label>
                            <Input id="name" name="name" placeholder="Ex: Clínica Saúde Total" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan">Plano</Label>
                                <Select name="plan" defaultValue="free">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free (Gratuito)</SelectItem>
                                        <SelectItem value="pro">Pro (Profissional)</SelectItem>
                                        <SelectItem value="enterprise">Enterprise (Ilimitado)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Cor Primária</Label>
                                <Input id="color" name="color" type="color" className="h-10 w-full p-1" defaultValue="#000000" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" type="button">Cancelar</Button>
                            <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">
                                Criar Clínica
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
