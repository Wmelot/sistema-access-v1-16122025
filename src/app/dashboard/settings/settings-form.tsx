'use client';

import { ClinicSettings, updateClinicSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15);
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
};

import { CheckCircle2, XCircle } from 'lucide-react';

interface SettingsFormProps {
    initialSettings: ClinicSettings | null;
    hasGoogleIntegration: boolean;
}

export function SettingsForm({ initialSettings, hasGoogleIntegration }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Address State (controlled to allow ViaCEP updates)
    const [address, setAddress] = useState({
        street: initialSettings?.address?.street || '',
        number: initialSettings?.address?.number || '',
        complement: initialSettings?.address?.complement || '',
        neighborhood: initialSettings?.address?.neighborhood || '',
        city: initialSettings?.address?.city || '',
        state: initialSettings?.address?.state || '',
        zip: initialSettings?.address?.zip || ''
    });

    const supabase = createClient();

    async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            setLogoUrl(publicUrl);
            toast.success('Logo carregada com sucesso!');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Erro ao fazer upload da logo.');
        } finally {
            setUploading(false);
        }
    }

    async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setAddress(prev => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        zip: e.target.value // Keep formatted
                    }));
                    toast.success('Endereço encontrado!');
                } else {
                    toast.error('CEP não encontrado.');
                }
            } catch (error) {
                console.error('ViaCEP error:', error);
            }
        }
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        // Append the logo URL manually since it's state-managed
        formData.set('logo_url', logoUrl);

        try {
            const result = await updateClinicSettings(formData);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Erro inesperado ao salvar.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit}>
            {/* Hidden input to ensure logo_url is passed even if not handled by set() manually if we used default form action standard, 
            but we are intercepting in handleSubmit. Still good practice. */}
            <input type="hidden" name="logo_url" value={logoUrl} />

            <div className="grid gap-6">

                {/* Integrações do Sistema */}
                <Card>
                    <CardHeader>
                        <CardTitle>Integrações do Sistema</CardTitle>
                        <CardDescription>
                            Status das conexões globais da plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-full border shadow-sm">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24l.81-.6z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Google Calendar</p>
                                    <p className="text-xs text-muted-foreground">
                                        API conectada (Nível Sistema)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasGoogleIntegration ? (
                                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                        Ativo
                                    </div>
                                ) : (
                                    <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium border border-red-200">
                                        <XCircle className="w-3.5 h-3.5 mr-1" />
                                        Inativo
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Identidade Visual */}
                <Card>
                    <CardHeader>
                        <CardTitle>Identidade da Clínica</CardTitle>
                        <CardDescription>
                            Defina o nome e a cor principal que aparecerão nos relatórios.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome da Clínica</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={initialSettings?.name || ''}
                                required
                                placeholder="Ex: Access Fisioterapia"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="primary_color">Cor Principal (Hex)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="primary_color"
                                    name="primary_color"
                                    defaultValue={initialSettings?.primary_color || '#84c8b9'}
                                    type="color"
                                    className="w-12 h-10 p-1"
                                />
                                <Input
                                    name="primary_color_text"
                                    defaultValue={initialSettings?.primary_color || '#84c8b9'}
                                    readOnly
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Logo</Label>
                            <div className="flex items-center gap-6 border border-dashed rounded-lg p-6 justify-center bg-muted/10">
                                {logoUrl ? (
                                    <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-white shadow-sm">
                                        <Image
                                            src={logoUrl}
                                            alt="Logo Clínica"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center border rounded-md bg-muted">
                                        <span className="text-xs text-muted-foreground">Sem Logo</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Recomendado: 500x500px (PNG ou JPG)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dados Cadastrais */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dados Cadastrais</CardTitle>
                        <CardDescription>
                            Informações para contato e cabeçalho de documentos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <Input
                                id="cnpj"
                                name="cnpj"
                                defaultValue={initialSettings?.cnpj || ''}
                                placeholder="00.000.000/0000-00"
                                onChange={(e) => e.target.value = maskCNPJ(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website">Site</Label>
                            <Input
                                id="website"
                                name="website"
                                defaultValue={initialSettings?.website || ''}
                                placeholder="www.suaclinica.com.br"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email de Contato</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={initialSettings?.email || ''}
                                placeholder="contato@..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Telefone / WhatsApp</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={initialSettings?.phone || ''}
                                placeholder="(00) 00000-0000"
                                onChange={(e) => e.target.value = maskPhone(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card>
                    <CardHeader>
                        <CardTitle>Endereço</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-[140px_1fr] gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address.zip">CEP</Label>
                                <div className="relative">
                                    <Input
                                        id="address.zip"
                                        name="address.zip"
                                        value={address.zip}
                                        onChange={(e) => setAddress({ ...address, zip: maskCEP(e.target.value) })}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                    />
                                    <div className="absolute right-3 top-2.5">
                                        {/* Could put a search icon or loader here */}
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address.street">Rua</Label>
                                <Input
                                    id="address.street"
                                    name="address.street"
                                    value={address.street}
                                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address.number">Número</Label>
                                <Input
                                    id="address.number"
                                    name="address.number"
                                    value={address.number}
                                    onChange={(e) => setAddress({ ...address, number: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address.complement">Complemento</Label>
                                <Input
                                    id="address.complement"
                                    name="address.complement"
                                    value={address.complement}
                                    onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="address.neighborhood">Bairro</Label>
                                <Input
                                    id="address.neighborhood"
                                    name="address.neighborhood"
                                    value={address.neighborhood}
                                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address.city">Cidade</Label>
                                <Input
                                    id="address.city"
                                    name="address.city"
                                    value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address.state">Estado (UF)</Label>
                                <Input
                                    id="address.state"
                                    name="address.state"
                                    value={address.state}
                                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
