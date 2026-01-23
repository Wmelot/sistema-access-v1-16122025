'use client';

import { ClinicSettings, updateClinicSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Loader2, Crop as CropIcon, RotateCw as RotateIcon, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { canvasPreview } from '@/lib/utils/canvasPreview'
import { CheckCircle2, XCircle } from 'lucide-react';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// Helper to center crop initially
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop({
            unit: '%',
            width: 90,
        }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight,
    )
}

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

interface SettingsFormProps {
    initialSettings: ClinicSettings | null;
    hasGoogleIntegration: boolean;
    isMaster?: boolean;
    slug: string; // [NEW]
}

export function SettingsForm({ initialSettings, hasGoogleIntegration, isMaster = false, slug }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);

    // Logo States
    const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || '');
    const [documentLogoUrl, setDocumentLogoUrl] = useState(initialSettings?.document_logo_url || '');
    const [primaryColor, setPrimaryColor] = useState(initialSettings?.primary_color || '#84c8b9');

    // Cropper State
    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(1) // New state
    const [activeLogoType, setActiveLogoType] = useState<'main' | 'document'>('main')
    const [processingCrop, setProcessingCrop] = useState(false)

    // Refs
    const imgRef = useRef<HTMLImageElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentFileInputRef = useRef<HTMLInputElement>(null);
    const addressNumberRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

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

    // --- SWEET ALERT HELPERS ---
    const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning', confirmBtnText = 'OK') => {
        MySwal.fire({
            title,
            text,
            icon,
            confirmButtonText: confirmBtnText,
            confirmButtonColor: primaryColor,
            background: '#fff',
            color: '#333',
            iconColor: icon === 'success' ? primaryColor : undefined,
            customClass: {
                popup: 'rounded-xl shadow-xl border border-gray-100',
                confirmButton: 'rounded-lg px-6 py-2 font-medium',
            }
        })
    }

    // --- CROPPER HANDLERS ---
    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'document') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null)
                setActiveLogoType(type)

                // Set default aspect ratio based on type
                if (type === 'main') {
                    setAspectRatio(1) // Square for system logo
                } else {
                    setAspectRatio(undefined) // Free for documents
                }

                setCropDialogOpen(true)
            })
            reader.readAsDataURL(file)
            e.target.value = ''
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        if (aspectRatio) {
            setCrop(centerAspectCrop(width, height, aspectRatio))
        } else {
            setCrop(centerCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 }, width, height))
        }
    }

    // Effect to update crop when aspect Ratio changes
    useEffect(() => {
        if (imgRef.current && aspectRatio) {
            const { width, height } = imgRef.current
            setCrop(centerAspectCrop(width, height, aspectRatio))
        }
    }, [aspectRatio])

    const handleCropConfirm = async () => {
        if (!imgRef.current || !completedCrop) return

        setProcessingCrop(true)
        try {
            const canvas = document.createElement('canvas')
            await canvasPreview(imgRef.current, canvas, completedCrop)

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Falha ao gerar imagem")

                // Upload directly to Supabase Storage with Tenant Isolation
                const fileExt = 'png'
                // [SLUG PREFIX] for proper isolation as requested
                const fileName = `${slug}/${activeLogoType}-logo-${Date.now()}.${fileExt}`
                const filePath = `${fileName}`

                // Try 'logos' bucket first
                let bucketName = 'logos'
                let { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, blob)

                // Fallback Logic
                if (uploadError && (uploadError.message.includes("Bucket not found") || (uploadError as any).error === "Bucket not found")) {
                    console.warn("Bucket 'logos' not found. Trying 'avatars'...")
                    bucketName = 'avatars'
                    const { error: retryError } = await supabase.storage
                        .from(bucketName)
                        .upload(filePath, blob)

                    if (retryError) {
                        throw new Error(`Erro de Storage: ${retryError.message}. Verifique se o bucket 'logos' ou 'avatars' existe.`)
                    }
                    uploadError = null
                } else if (uploadError) {
                    throw uploadError
                }

                const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath)

                if (activeLogoType === 'main') {
                    setLogoUrl(publicUrl)
                } else {
                    setDocumentLogoUrl(publicUrl)
                }

                showAlert('Sucesso!', 'Logo atualizada com sucesso.', 'success')
                setCropDialogOpen(false)
            }, 'image/png')

        } catch (error: any) {
            console.error('Error cropping/uploading:', error)
            showAlert('Erro', `Erro ao processar imagem: ${error.message || 'Erro desconhecido'}`, 'error')
        } finally {
            setProcessingCrop(false)
        }
    }

    // --- FORM SUBMIT ---
    async function handleSubmit(formData: FormData) {
        setLoading(true);
        // Append manually
        formData.set('logo_url', logoUrl);
        formData.set('document_logo_url', documentLogoUrl);
        if (slug) formData.set('slug', slug); // [NEW] Tenant Context
        // Address fields handled by default FormData behavior since inputs have names,
        // but we controlled them so their values are in DOM.

        try {
            const result = await updateClinicSettings(formData);
            if (result.success) {
                showAlert('Tudo certo!', result.message, 'success')
            } else {
                showAlert('Atenção', result.message, 'warning')
            }
        } catch (error: any) {
            console.error('CRITICAL FRONTEND ERROR:', error);
            // Using a very distinct message to prove the code updated
            showAlert('Erro Crítico', `Falha ao salvar: ${error.message || JSON.stringify(error)}`, 'error')
        } finally {
            setLoading(false);
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
                    setTimeout(() => addressNumberRef.current?.focus(), 100);
                } else {
                    toast.error('CEP não encontrado.');
                }
            } catch (error) {
                console.error('ViaCEP error:', error);
            }
        }
    }

    return (
        <form action={handleSubmit}>
            <input type="hidden" name="logo_url" value={logoUrl} />
            <input type="hidden" name="document_logo_url" value={documentLogoUrl} />
            <input type="hidden" name="slug" value={slug} /> {/* Ensure Slug is sent */}

            <div className="grid gap-6">

                {/* --- CROP DIALOG --- */}
                <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
                    <DialogContent className="max-w-xl sm:max-w-[700px] max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Ajustar Logo ({activeLogoType === 'main' ? 'Sistema' : 'Documentos'})</DialogTitle>
                            <DialogDescription>
                                Recorte a área desejada da imagem.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 min-h-0 overflow-auto bg-zinc-900 rounded-lg p-4 flex items-center justify-center">
                            {imageSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={aspectRatio}
                                    className="max-h-[60vh]"
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Crop me"
                                        src={imageSrc}
                                        onLoad={onImageLoad}
                                        style={{ maxHeight: '60vh', objectFit: 'contain' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        {/* Aspect Ratio Controls */}
                        <div className="flex justify-center gap-2 pt-4">
                            <Button
                                type="button"
                                variant={aspectRatio === 1 ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setAspectRatio(1)}
                            >
                                Quadrado (1:1)
                            </Button>
                            <Button
                                type="button"
                                variant={aspectRatio === 4 / 3 ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setAspectRatio(4 / 3)}
                            >
                                4:3
                            </Button>
                            <Button
                                type="button"
                                variant={aspectRatio === 16 / 9 ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setAspectRatio(16 / 9)}
                            >
                                16:9
                            </Button>
                            <Button
                                type="button"
                                variant={aspectRatio === undefined ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setAspectRatio(undefined)}
                            >
                                Livre
                            </Button>
                        </div>

                        <div className="text-center text-xs text-muted-foreground mt-2">
                            Arraste os cantos da caixa de seleção para ajustar o corte.
                        </div>

                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            <Button variant="ghost" type="button" onClick={() => setCropDialogOpen(false)}>Cancelar</Button>
                            <Button type="button" onClick={handleCropConfirm} disabled={processingCrop}>
                                {processingCrop ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Confirmar Recorte
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Identidade Visual - MASTER ONLY */}
                {/* Identidade Visual - MASTER ONLY */}
                {isMaster && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Identidade da Clínica</CardTitle>
                            <CardDescription>
                                Defina as cores e logos que aparecerão no sistema e nos relatórios.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        name="primary_color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1 font-mono uppercase"
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

                                {/* LOGO PRINCIPAL */}
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-2">
                                        Logo do Sistema
                                        <span className="text-xs font-normal text-muted-foreground">(Quadrada)</span>
                                    </Label>
                                    <div className="flex flex-col items-center gap-4 border border-dashed rounded-lg p-6 bg-muted/10 h-full justify-center">
                                        {logoUrl ? (
                                            <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-white shadow-sm group">
                                                <Image
                                                    src={logoUrl}
                                                    alt="Logo Clínica"
                                                    fill
                                                    className="object-contain p-2 rounded-md"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 flex items-center justify-center border rounded-md bg-muted">
                                                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={(e) => handleLogoSelect(e, 'main')}
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={processingCrop}
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* LOGO DOCUMENTOS */}
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-2">
                                        Logo para Documentos
                                        <span className="text-xs font-normal text-muted-foreground">(Relatórios, Atestados)</span>
                                    </Label>
                                    <div className="flex flex-col items-center gap-4 border border-dashed rounded-lg p-6 bg-muted/10 h-full justify-center">
                                        {documentLogoUrl ? (
                                            <div className="relative w-48 h-32 border rounded-md overflow-hidden bg-white shadow-sm">
                                                <Image
                                                    src={documentLogoUrl}
                                                    alt="Logo Documentos"
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-48 h-32 flex items-center justify-center border rounded-md bg-muted">
                                                <span className="text-xs text-muted-foreground text-center px-4">
                                                    Se não definida, será usada a logo do sistema.
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={documentFileInputRef}
                                                onChange={(e) => handleLogoSelect(e, 'document')}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => documentFileInputRef.current?.click()}
                                                disabled={processingCrop}
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                {documentLogoUrl ? 'Alterar Logo Doc' : 'Enviar Logo Doc'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                )}

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
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="pix_key">Chave PIX (para Cobranças)</Label>
                            <Input
                                id="pix_key"
                                name="pix_key"
                                defaultValue={initialSettings?.pix_key || ''}
                                placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
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
                                    ref={addressNumberRef}
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
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
