'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Mic,
    Sparkles,
    ChevronLeft,
    Plus,
    Trash2,
    Wand2,
    Loader2,
    X,
    Square,
    Link as LinkIcon,
    Paperclip,
    Printer,
    FileText,
    FileCheck,
    Check,
    Star,
    Calendar as CalendarIcon
} from 'lucide-react';
import { fetchAcademicData } from '@/lib/academic-sync';
import { DateInput } from '@/components/ui/date-input';
import { AcademicLogo, AcademicLogoString } from '@/components/academic/logo';
import { saveEvidence } from '@/lib/academic-sync';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuantumLoader } from '@/components/ui/quantum-loader';
import Swal from 'sweetalert2';

// --- CONFIGURAÇÕES SINAES ---
const PLACEHOLDERS = {
    ENSINO: {
        titulo: 'Ex: "Uso de simulação clínica para ensino de reabilitação cardíaca"',
        descricao: '→ Objetivo da atividade;\n→ Metodologia utilizada (ex: sala de aula invertida, estudo de caso, simulação, projeto integrador);\n→ Envolvimento dos estudantes (individual, em grupo, com comunidade?).',
        impacto: '→ Melhoria no desempenho dos alunos (comparação antes/depois, se possível);\n→ Feedback qualitativo dos estudantes (ex: trecho de relato do discente);\n→ Reconhecimento institucional (prêmio, menção em evento, etc.);\n→ Adaptação curricular posterior com base na experiência.'
    },
    PESQUISA: {
        titulo: 'Ex: "Efeitos da cinesioterapia respiratória em idosos pós-AVC"',
        descricao: '→ Objetivo principal;\n→ Linha de pesquisa do curso com a qual se articula (se aplicável);\n→ Participação de estudantes de graduação (nome do(s) discente(s));\n→ Relevância para a Fisioterapia, para o context local (Betim/Região Metropolitana) ou para o SUS.',
        impacto: '→ Informar se houve publicação de artigo, resumo, livro ou capítulo de livro (informar o DOI se houver);\n→ Comprovante de submissão a evento científico (se apresentado);\n→ Registros fotográficos de participação em eventos científicos.'
    },
    EXTENSÃO: {
        titulo: 'Ex: "Oficinas de Prevenção de Quedas para Idosos – Parceria com UBS Jardim Teresópolis"',
        descricao: '→ Objetivo social da ação;\n→ Metodologia (ex: oficinas, triagens, grupos educativos, campanhas);\n→ Número de alunos envolvidos;\n→ Parceiros externos envolvidos;\n→ Como se articula com o PPC do curso e com as necessidades do território;',
        impacto: '→ Destacar o impacto social da ação no público externos, no docente e discente;\n→ Número de pessoas beneficiadas direta e indiretamente pela atividade;'
    }
};

const DEFAULT_TYPES = {
    ENSINO: ['Ata de Aula', 'Simulação Clínica', 'Projeto Integrador', 'Sala de Aula Invertida', 'Estudo de Caso', 'Júri Simulado', 'Seminário Clínico'].sort(),
    PESQUISA: ['Projeto de pesquisa (FIP)', 'Projeto de pesquisa (PIBIC)', 'Projeto de pesquisa (PIC-IV)', 'Orientação de TCC', 'Prática investigativa em UC'].sort(),
    EXTENSÃO: ['Projeto de extensão (edital)', 'Projeto de extensão (extra edital)', 'Atividades vinculadas às UCs', 'Evento de extensão', 'Atividades vinculadas à UCs extensionistas'].sort()
};

// Componente AIAssistantBox com Gemini Transcribe
const AIAssistantBox = ({
    label,
    value,
    onChange,
    placeholder,
    category,
    fieldKey
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder?: string,
    category: string,
    fieldKey: string
}) => {
    const [isImproving, setIsImproving] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [suggestion, setSuggestion] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
                transcribeAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            toast.info("Gravando rascunho acadêmico...");
        } catch (err) {
            toast.error("Não foi possível acessar o microfone.");
        }
    };

    const transcribeAudio = async (blob: Blob) => {
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append('file', blob, 'audio.mp3');
        formData.append('isAcademic', 'true');

        try {
            const res = await fetch('/api/openai/transcribe', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.text) {
                onChange(value ? `${value} ${data.text}` : data.text);
                toast.success("Relatório configurado com sucesso!");
            }
        } catch (error) {
            toast.error("Erro na transcrição por IA.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const improveWithAI = async () => {
        if (!value || value.length < 10) {
            toast.error("Escreva um rascunho um pouco maior para a IA analisar.");
            return;
        }

        setIsImproving(true);
        try {
            const res = await fetch('/api/academic/improve', {
                method: 'POST',
                body: JSON.stringify({ text: value, field: label, category })
            });
            const data = await res.json();
            if (data.improvedText) {
                setSuggestion(data.improvedText);
                setShowComparison(true);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            toast.error("Erro ao conectar com a IA: " + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    return (
        <div className="space-y-3 relative group">
            <div className="flex items-center justify-between">
                <Label className="text-[#363636] font-bold text-sm tracking-tight">{label}</Label>
                <button
                    type="button"
                    onClick={improveWithAI}
                    disabled={isImproving || !category}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#8C132C] hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {isImproving ? <Loader2 className="animate-spin w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                    Asistente de escrita
                </button>
            </div>

            <div className="relative">
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-[140px] bg-slate-50 border-slate-100 focus:border-[#8C132C] focus:ring-[#8C132C]/10 transition-all rounded-2xl resize-none text-sm leading-relaxed placeholder:text-slate-400 whitespace-pre-wrap"
                />

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleRecording}
                        disabled={isTranscribing}
                        className={cn(
                            "p-2 rounded-full shadow-sm transition-all",
                            isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white text-slate-400 hover:text-[#8C132C]",
                            isTranscribing && "opacity-50 cursor-wait"
                        )}
                    >
                        {isTranscribing ? <Loader2 className="animate-spin" size={16} /> : (isRecording ? <Square size={16} /> : <Mic size={16} />)}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showComparison && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#363636] p-6 rounded-[24px] text-white shadow-2xl z-20 border border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-yellow-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Versão Sênior SINAES (Nota 5)</h4>
                            </div>
                            <button onClick={() => setShowComparison(false)} className="text-slate-500 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-[13px] leading-relaxed mb-6 font-medium text-slate-100 bg-white/5 p-4 rounded-xl italic">"{suggestion}"</p>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => { onChange(suggestion); setShowComparison(false); }}
                                className="bg-[#8C132C] text-white hover:bg-[#5a0c1d] font-black text-xs h-10 px-6 rounded-full shadow-lg"
                            >
                                Substituir Texto Atual
                            </Button>
                            <Button onClick={() => setShowComparison(false)} variant="ghost" className="text-[10px] font-black uppercase text-slate-400">Descartar</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function NovoRegistroAcademicoForm() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const extraFilesRef = useRef<HTMLInputElement>(null);
    const [categoria, setCategoria] = useState<string>("PESQUISA");
    const [isAddingType, setIsAddingType] = useState(false);
    const [newType, setNewType] = useState("");
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [evidencias, setEvidencias] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    const { register, handleSubmit, control, watch, setValue, getValues } = useForm({
        defaultValues: {
            titulo: "",
            docente: "Warley de Melo Oliveira",
            disciplina_nome: "Fisioterapia Cardiovascular",
            periodo: "8º",
            semestre: "2º semestre",
            ano: "2025",
            tipo: "Projeto de pesquisa (PIBIC)",
            descricao: "",
            impacto: "",
            links: [""],
            eixos: [] as string[],
            descricaoIntegracao: "",
            legenda: "",
            data_atividade: new Date().toISOString().split('T')[0],
            relevancia: 0
        }
    });

    const relevancia = watch("relevancia");

    const links = watch("links");
    const selectedEixos = watch("eixos");
    const descricaoIntegracao = watch("descricaoIntegracao");

    useEffect(() => {
        const loadData = async () => {
            const dataLoad = await fetchAcademicData();
            if (dataLoad.evidencias) {
                setEvidencias(dataLoad.evidencias);
            }

            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) localStorage.setItem('axiom_sinaes_user_email', user.email);
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (prof?.full_name) {
                    setValue("docente", prof.full_name);
                } else if (user.email) {
                    setValue("docente", user.email.split('@')[0]);
                }
            }
        };
        loadData();
    }, [setValue]);

    // --- EDIT MODE: carregar dados do registro existente ---
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && evidencias.length > 0) {
            const ev = evidencias.find((e: any) => e.id === editId);
            if (ev) {
                setEditingId(editId);
                setValue('titulo', ev.titulo || '');
                setValue('docente', ev.professor || ev.docente || '');
                setValue('descricao', ev.descricao || '');
                setValue('impacto', ev.impacto || '');
                setValue('legenda', ev.legenda || '');
                setValue('disciplina_nome', ev.disciplina_nome || ev.disciplina || '');
                setValue('periodo', ev.periodo || '');
                setValue('semestre', ev.semestre || '');
                setValue('ano', ev.ano || '');
                setValue('tipo', ev.activity_type || ev.tipo || '');
                setValue('data_atividade', ev.evidence_date || ev.data_atividade || '');
                setValue('eixos', ev.integration_axes || ev.eixos || []);
                setValue('descricaoIntegracao', ev.integration_description || ev.descricaoIntegracao || '');
                setValue('relevancia', ev.relevance || ev.relevancia || 0);
                if (ev.categoria) setCategoria(ev.categoria.toUpperCase());
                toast.info('Modo Edição: altere o que desejar e salve.', { duration: 4000 });
            }
        }
    }, [searchParams, evidencias, setValue]);

    useEffect(() => {
        if (categoria) {
            const defaultTypes = DEFAULT_TYPES[categoria as keyof typeof DEFAULT_TYPES] || [];
            const dbTypes = evidencias
                .filter(ev => ev.categoria?.toUpperCase() === categoria.toUpperCase())
                .map(ev => ev.activity_type || ev.tipo)
                .filter(t => t && !defaultTypes.includes(t));

            const allTypes = Array.from(new Set([...defaultTypes, ...dbTypes])).sort((a, b) => a.localeCompare(b));
            setAvailableTypes(allTypes);
        }
    }, [categoria, evidencias]);

    const onAddType = () => {
        if (!newType.trim()) return;
        const normalized = newType.trim();
        const existing = availableTypes.find(t => t.toLowerCase() === normalized.toLowerCase());

        if (existing) {
            setValue("tipo", existing);
            toast.info(`Tipo "${existing}" já existe e foi selecionado.`);
        } else {
            setAvailableTypes(prev => [...prev, normalized].sort((a, b) => a.localeCompare(b)));
            setValue("tipo", normalized);
            toast.success("Novo tipo adicionado.");
        }

        setNewType("");
        setIsAddingType(false);
    };

    const handleCameraClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            toast.success(`${files.length} arquivo(s) anexado(s) com sucesso.`);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getIntegrationText = () => {
        if (!selectedEixos || selectedEixos.length === 0) return "Não houve integração reportada.";
        const eixosStr = selectedEixos.map(e => e.toLowerCase()).join(" e ");
        return `Esta atividade apresentou integração entre ${categoria?.toLowerCase() || 'a categoria selecionada'} e as áreas de ${eixosStr}.`;
    };

    // Utilitário de Compressão Local (Otimizado para Dossiê Impresso e Web)
    const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Redimensionamento inteligente preservando proporção
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((maxWidth / width) * height);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxWidth) {
                            width = Math.round((maxWidth / height) * width);
                            height = maxWidth;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    // Melhorar qualidade de interpolação
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }

                    // Preservar PNG se o usuário subir PNG (para transparência)
                    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                    let currentQuality = quality;
                    let finalDataUrl = canvas.toDataURL(mimeType, currentQuality);

                    // Se ainda estiver muito grande (> 2MB), comprime mais agressivamente (ignora PNG nesse caso para forçar limite)
                    if (finalDataUrl.length > 2 * 1024 * 1024) {
                        finalDataUrl = canvas.toDataURL('image/jpeg', 0.4);
                    }

                    // Log de otimização para debug
                    const originalSize = (file.size / 1024 / 1024).toFixed(2);
                    const newSize = (Math.round((finalDataUrl.length * 3) / 4) / 1024 / 1024).toFixed(2);
                    console.log(`Otimização: ${originalSize}MB -> ${newSize}MB`);

                    resolve(finalDataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const onSubmit = async (data: any) => {
        if (isSaving) return;
        setIsSaving(true);
        const toastId = toast.loading("Salvando na Nuvem (Supabase)...");

        try {
            // 1. Processar Imagem Principal (Compressão)
            let finalImage = "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop";

            if (selectedFiles.length > 0) {
                const imageFile = selectedFiles.find(f => f.type.startsWith('image/'));
                if (imageFile) {
                    try {
                        // Comprimir para no máximo 1000px de largura para garantir payload leve
                        finalImage = await compressImage(imageFile, 1000, 0.6);
                    } catch (e) {
                        console.error("Erro compressão, usando original convertida");
                        finalImage = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(imageFile);
                        });
                    }
                }
            } else if (data.img) {
                finalImage = data.img;
            }

            // Lógica de Título Inteligente (IA ou Padrão)
            let finalTitulo = data.titulo;
            if (!finalTitulo || finalTitulo.trim() === "") {
                try {
                    // Tentar gerar via IA baseado no contexto
                    const aiRes = await fetch('/api/academic/improve', {
                        method: 'POST',
                        body: JSON.stringify({
                            text: `Gerar um título técnico curto (máximo 10 palavras) para um registro de ${categoria} com base nisto: Descrição: ${data.descricao} Impacto: ${data.impacto}`,
                            field: 'Título',
                            category: categoria
                        })
                    });
                    const aiData = await aiRes.json();
                    if (aiData.improvedText) {
                        finalTitulo = aiData.improvedText.replace(/^"|"$/g, '');
                    } else {
                        throw new Error("IA falhou");
                    }
                } catch (e) {
                    // Fallback para o padrão anterior se a IA falhar
                    const primeiroNome = (data.docente || "Docente").split(' ')[0];
                    finalTitulo = `[${categoria}]_${primeiroNome}_${data.ano}`;
                }
            }

            // 2. Preparar Payload SINAES
            const payload = {
                id: editingId || (window as any).crypto?.randomUUID() || Math.random().toString(36).substring(2),
                ...data,
                periodo: data.periodo?.includes("período") ? data.periodo : `${data.periodo} período`,
                titulo: finalTitulo,
                img: finalImage,
                categoria: categoria.toUpperCase(),
                activity_type: data.tipo,
                evidence_date: data.data_atividade,
                integration_axes: data.eixos || [],
                integration_description: data.descricaoIntegracao || getIntegrationText(),
                relevance: data.relevancia
            };

            // 2. Salvar LOCALMENTE primeiro (Segurança contra perda de dados)
            try {
                const savedEvs = localStorage.getItem('axiom_evidencias');
                const currentEvs = savedEvs ? JSON.parse(savedEvs) : [];
                localStorage.setItem('axiom_evidencias', JSON.stringify([payload, ...currentEvs]));
            } catch (e) { console.warn("Erro ao salvar persistência local"); }

            // 3. Salvar REALMENTE no Supabase com Timeout manual para UI não travar
            const savePromise = saveEvidence(payload);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));

            await Promise.race([savePromise, timeoutPromise]);

            toast.dismiss(toastId);
            toast.success("Confirmado: Salvo na Nuvem!");

            setTimeout(() => {
                window.location.href = "/academico?tab=gallery";
            }, 800);

        } catch (error: any) {
            console.error("Erro no salvamento:", error);
            setIsSaving(false);
            toast.dismiss(toastId);

            let errorTitle = 'Falha ao Enviar';
            let errorText = 'Não conseguimos salvar na nuvem agora.';

            // Extrair mensagem de erro detalhada se disponível
            if (error.message) {
                errorText += `\n\nDetalhe Técnico: ${error.message}`;
            }

            if (error.message === "Timeout") {
                toast.warning("Sincronização lenta... Mas salvamos localmente para você!");
                setTimeout(() => {
                    window.location.href = "/academico?tab=gallery";
                }, 2000);
                return;
            }

            const hasImages = selectedFiles.some(f => f.type.startsWith('image/'));

            if (hasImages) {
                Swal.fire({
                    title: errorTitle,
                    text: errorText + ' Deseja salvar as fotos na sua Galeria do celular para não perdê-las?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, salvar fotos',
                    cancelButtonText: 'Tentar Novamente',
                    confirmButtonColor: '#8C132C'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        for (const f of selectedFiles) {
                            if (f.type.startsWith('image/')) {
                                // Tenta usar a API de compartilhamento nativa (melhor para iPhone/Android)
                                if (navigator.share && navigator.canShare && navigator.canShare({ files: [f] })) {
                                    try {
                                        await navigator.share({
                                            files: [f],
                                            title: 'SINAES Evidência',
                                            text: 'Foto capturada para o Dossiê SINAES',
                                        });
                                    } catch (shareErr) {
                                        // Se o usuário cancelar ou der erro, tenta o download tradicional
                                        const url = URL.createObjectURL(f);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `SINAES_DOC_${Date.now()}.jpg`;
                                        a.click();
                                    }
                                } else {
                                    // Fallback para download simples se não houver o Share API
                                    const url = URL.createObjectURL(f);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `SINAES_DOC_${Date.now()}.jpg`;
                                    a.click();
                                }
                            }
                        }
                        toast.success("Pronto! Verifique sua galeria.");
                    }
                });
            } else {
                Swal.fire({
                    title: 'Erro Crítico',
                    text: errorText,
                    icon: 'error',
                    confirmButtonColor: '#363636'
                });
            }
        }
    };

    const currentPlaceholders = (categoria ? (PLACEHOLDERS[categoria as keyof typeof PLACEHOLDERS] || {}) : {}) as any;

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24 print:bg-white print:pb-0 font-sans">
            {/* Header Institucional (Hide on print) */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-50 print:hidden">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => window.history.back()} type="button" className="p-2 -ml-2 text-slate-500 hover:text-[#8C132C]">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-[#8C132C] uppercase tracking-tighter">Pontifícia Universidade Católica de Minas Gerais - Betim</span>
                        <h1 className="text-sm font-bold text-[#363636] tracking-tight">{editingId ? 'Editando Registro de Atividade' : 'Portal de Registro de Atividades'}</h1>
                    </div>
                    <button onClick={handlePrint} type="button" className="p-2 text-[#8C132C] hover:scale-110 transition-transform">
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* PRINT-ONLY HEADER (FOTO 3 STYLE) */}
            <div className="hidden print:flex flex-col items-center mb-6 pt-2">
                <img
                    src={AcademicLogoString()}
                    alt="Logo"
                    className="h-28 mb-4 object-contain"
                />
                <div className="text-sm font-black text-[#004A8F] uppercase tracking-[0.15em] text-center">Pontifícia Universidade Católica de Minas Gerais</div>
                <h1 className="text-xl font-black text-black uppercase mt-4 text-center">
                    REGISTRO DAS ATIVIDADES DE {categoria || 'ACADÊMICAS'}
                </h1>
                <p className="text-[14px] font-bold text-black mt-2 text-center border-b-4 border-black pb-3 w-full uppercase">CURSO FISIOTERAPIA / BETIM</p>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8 print:py-0 print:max-w-full">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Botão Capturar Evidência Removido por Redundância */}

                    <Card className="rounded-[48px] border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-10 space-y-10 print:shadow-none print:p-0 print:rounded-none">

                        {/* NOVO FORMATO DE RELATÓRIO EM CARDS (MAIS PREMIUM E FLEXÍVEL) */}
                        <div className="print:block hidden w-full space-y-6">
                            {/* Card: Título */}
                            <div className="bg-slate-50 border-2 border-black p-8 rounded-[32px] page-break-inside-avoid">
                                <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-3">Título do Registro / Prática</div>
                                <div className="text-2xl font-black text-black leading-tight italic">"{watch("titulo") || "---"}"</div>
                            </div>

                            {/* Grid de Informações Rápidas */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="border-2 border-black p-6 rounded-[28px] page-break-inside-avoid flex flex-col justify-center">
                                    <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-2">Docente Responsável</div>
                                    <div className="text-sm font-black text-black uppercase tracking-tight">{watch("docente")}</div>
                                </div>
                                <div className="border-2 border-black p-6 rounded-[28px] page-break-inside-avoid flex flex-col justify-center">
                                    <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-2">Disciplina / Aplicação</div>
                                    <div className="text-sm font-bold text-black tracking-tight">{watch("disciplina_nome")} – {watch("periodo")?.includes("período") ? watch("periodo") : `${watch("periodo")} período`}</div>
                                </div>
                            </div>

                            {/* Card: Tipo e Referência */}
                            <div className="border-2 border-black p-6 rounded-[28px] page-break-inside-avoid">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-2">Tipo de Atividade</div>
                                        <div className="text-sm font-black text-black uppercase">{watch("tipo")}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-2">Referência Temporal</div>
                                        <div className="text-sm font-black text-black uppercase">{watch("semestre")} • {watch("data_atividade")?.split('-').reverse().join('/')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Descrição Sucinta */}
                            <div className="border-2 border-black p-10 rounded-[40px] page-break-inside-avoid min-h-[200px]">
                                <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-6">Descrição das Atividades Realizadas</div>
                                <div className="text-[13px] leading-relaxed text-black whitespace-pre-wrap font-medium">
                                    {watch("descricao") || "Nenhuma descrição detalhada fornecida pelo docente responsável."}
                                </div>
                            </div>

                            {/* Card: Impacto e Resultados */}
                            <div className="bg-slate-50 border-2 border-black p-10 rounded-[40px] page-break-inside-avoid min-h-[160px]">
                                <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-6">Resultados Acadêmicos e Impacto no SINAES</div>
                                <div className="text-[13px] leading-relaxed text-black whitespace-pre-wrap font-medium">
                                    {watch("impacto") || "Sem registros de impacto ou resultados consolidados até o momento."}
                                </div>
                            </div>

                            {/* Card: Integração SINAES */}
                            <div className="border-2 border-black p-10 rounded-[40px] page-break-inside-avoid">
                                <div className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.2em] mb-6">Integração Coerente (Ensino / Pesquisa / Extensão)</div>
                                <div className="flex gap-12 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-7 h-7 border-[3px] border-black rounded-xl flex items-center justify-center", selectedEixos.length > 0 ? "bg-black" : "bg-white")}>
                                            {selectedEixos.length > 0 && <Check size={18} className="text-white stroke-[3px]" />}
                                        </div>
                                        <span className="font-black uppercase text-[11px] tracking-wider">Houve integração reportada</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-7 h-7 border-[3px] border-black rounded-xl flex items-center justify-center", selectedEixos.length === 0 ? "bg-black" : "bg-white")}>
                                            {selectedEixos.length === 0 && <Check size={18} className="text-white stroke-[3px]" />}
                                        </div>
                                        <span className="font-black uppercase text-[11px] tracking-wider">Atividade Isolada</span>
                                    </div>
                                </div>
                                {selectedEixos.length > 0 && (
                                    <div className="bg-white p-8 rounded-[24px] border-l-[12px] border-black italic text-[12px] leading-relaxed shadow-sm">
                                        <span className="font-black not-italic block mb-3 uppercase tracking-[0.2em] text-[10px] text-[#8C132C]">Justificativa do Eixo Integrador:</span>
                                        {descricaoIntegracao || "Nenhuma justificativa detalhada foi inserida."}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* UI INTERATIVA (VISIBLE ONLY ON SCREEN) */}
                        <div className="grid grid-cols-1 gap-8 print:hidden">
                            <div className="space-y-3">
                                <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Título do Registro / Prática</Label>
                                <Input
                                    {...register("titulo")}
                                    placeholder={currentPlaceholders.titulo}
                                    className="h-16 rounded-3xl border-slate-100 bg-slate-50 focus:ring-4 focus:ring-[#8C132C]/5 font-bold text-lg px-8 transition-all"
                                />
                            </div>

                            {/* Campo Legenda ocultado conforme solicitação do usuário */}
                            {/* 
                            <div className="space-y-3">
                                <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Legenda / Resumo do Comprovante</Label>
                                <Input
                                    {...register("legenda")}
                                    placeholder="Ex: Foto da palestra no auditório principal..."
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:ring-4 focus:ring-[#8C132C]/5 font-bold px-8 transition-all"
                                />
                            </div> 
                            */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-3 w-full">
                                    <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Categoria SINAES</Label>
                                    <Select value={categoria} onValueChange={setCategoria}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-[#8C132C] px-8 w-full overflow-hidden">
                                            <SelectValue placeholder="Selecione..." className="truncate" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            <SelectItem value="ENSINO" className="font-bold py-3">Ensino</SelectItem>
                                            <SelectItem value="PESQUISA" className="font-bold py-3">Pesquisa</SelectItem>
                                            <SelectItem value="EXTENSÃO" className="font-bold py-3">Extensão</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3 w-full">
                                    <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Tipo de Atividade</Label>
                                    <Select value={watch("tipo")} onValueChange={(val) => val === 'new' ? setIsAddingType(true) : setValue("tipo", val)}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8 w-full overflow-hidden">
                                            <SelectValue placeholder="Selecione..." className="truncate block max-w-full" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            {availableTypes.map(t => <SelectItem key={t} value={t} className="py-3 font-medium">{t}</SelectItem>)}
                                            <SelectItem value="new" className="text-[#8C132C] font-black py-3 hover:bg-[#8C132C]/5 transition-colors">+ Novo Tipo Customizado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Docente(s) Responsável(is)</Label>
                                <Input {...register("docente")} className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8" />
                            </div>

                            <div className="space-y-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.5fr] gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Disciplina / Matéria</Label>
                                        <Input {...register("disciplina_nome")} className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8 focus:ring-[#8C132C]/10" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2 text-center">Período</Label>
                                        <Input {...register("periodo")} placeholder="Ex: 8º" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-4 text-center" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Semestre de Referência</Label>
                                        <Select onValueChange={(val) => setValue("semestre", val)} defaultValue={getValues("semestre")}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8 focus:ring-4 focus:ring-[#8C132C]/5 transition-all">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="1º semestre" className="font-bold">1º Semestre</SelectItem>
                                                <SelectItem value="2º semestre" className="font-bold">2º Semestre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Data da Atividade</Label>
                                        <Controller
                                            name="data_atividade"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="relative">
                                                    <DateInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                                    />
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Textos Assistidos - UI INTERATIVA */}
                        <div className="space-y-10 print:hidden">
                            <Controller
                                name="descricao"
                                control={control}
                                render={({ field }) => (
                                    <AIAssistantBox
                                        label="Descrição Sucinta"
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder={currentPlaceholders.descricao}
                                        category={categoria}
                                        fieldKey="description"
                                    />
                                )}
                            />

                            <Controller
                                name="impacto"
                                control={control}
                                render={({ field }) => (
                                    <AIAssistantBox
                                        label="Resultados e Impacto"
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder={currentPlaceholders.impacto}
                                        category={categoria}
                                        fieldKey="impact"
                                    />
                                )}
                            />
                        </div>

                        {/* Links e Anexos - UI INTERATIVA */}
                        <div className="space-y-8 pt-10 border-t border-slate-100 print:hidden">
                            <div className="space-y-4">
                                <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 px-2">
                                    <LinkIcon size={16} className="text-[#8C132C]" />
                                    Links Estratégicos (Instagram / DOI / Drive)
                                </Label>
                                <div className="space-y-3">
                                    {links.map((link, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <Input
                                                value={link}
                                                onChange={(e) => {
                                                    const newLinks = [...links];
                                                    newLinks[idx] = e.target.value;
                                                    setValue("links", newLinks);
                                                }}
                                                placeholder="https://..."
                                                className="rounded-[20px] bg-slate-50 border-none h-14 px-8 font-medium focus:ring-4 focus:ring-[#8C132C]/5 transition-all shadow-inner"
                                            />
                                            {idx === links.length - 1 && (
                                                <Button type="button" variant="outline" size="icon" onClick={() => setValue("links", [...links, ""])} className="h-14 w-14 rounded-2xl border-none bg-[#8C132C]/5 text-[#8C132C] hover:bg-[#8C132C]/10 transition-all">
                                                    <Plus size={20} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 px-2">
                                    <Paperclip size={16} className="text-[#8C132C]" />
                                    Arquivos de Evidência (Atas, Planos, Certificados)
                                </Label>
                                <div
                                    onClick={() => extraFilesRef.current?.click()}
                                    className="border-4 border-dashed border-slate-100 rounded-[40px] p-10 text-center hover:border-[#8C132C]/20 hover:bg-slate-50/50 transition-all cursor-pointer group shadow-inner"
                                >
                                    <FileText className="mx-auto text-slate-200 mb-4 group-hover:scale-110 group-hover:text-[#8C132C]/20 transition-all" size={48} />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Clique para enviar os documentos complementares</p>
                                    <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">PDF, DOCX E IMAGENS EM ALTA RESOLUÇÃO</p>
                                    <input
                                        ref={extraFilesRef}
                                        type="file"
                                        onChange={handleFileChange}
                                        multiple
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,image/*"
                                    />
                                </div>
                                {selectedFiles.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {selectedFiles.map((f, i) => (
                                            <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileCheck size={14} className="text-emerald-500" />
                                                    <span className="text-[10px] font-bold truncate max-w-[100px]">{f.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i));
                                                        }}
                                                        className="ml-auto text-slate-300 hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-1 px-2 rounded-lg w-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const url = URL.createObjectURL(f);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = f.name;
                                                        a.click();
                                                    }}
                                                >
                                                    Baixar Cópia
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Integração SINAES - UI INTERATIVA */}
                        {categoria && (
                            <div className="pt-10 border-t border-slate-100 print:hidden">
                                <Label className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 px-2">Houve integração com outros eixos SINAES?</Label>
                                <div className="flex flex-wrap gap-4 mt-6">
                                    {['ENSINO', 'PESQUISA', 'EXTENSÃO'].filter(c => c !== categoria).map(eixo => (
                                        <Controller
                                            key={eixo}
                                            name="eixos"
                                            control={control}
                                            render={({ field }) => {
                                                const isChecked = field.value?.includes(eixo);
                                                return (
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-4 px-6 py-4 rounded-[24px] border transition-all cursor-pointer group active:scale-95 shadow-sm",
                                                            isChecked ? "bg-[#8C132C]/10 border-[#8C132C]/20" : "bg-slate-50 border-transparent hover:border-[#8C132C]/10"
                                                        )}
                                                        onClick={() => {
                                                            const currentValues = field.value || [];
                                                            const next = isChecked
                                                                ? currentValues.filter((x: string) => x !== eixo)
                                                                : [...currentValues, eixo];
                                                            field.onChange(next);
                                                        }}
                                                    >
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all",
                                                            isChecked ? "bg-[#8C132C] border-[#8C132C]" : "bg-white border-slate-200"
                                                        )}>
                                                            {isChecked && <Check size={14} className="text-white" />}
                                                        </div>
                                                        <Label className={cn("text-xs uppercase font-black cursor-pointer tracking-widest transition-colors", isChecked ? "text-[#8C132C]" : "text-slate-500 group-hover:text-[#8C132C]")}>
                                                            Integração com {eixo.toLowerCase()}
                                                        </Label>
                                                    </div>
                                                );
                                            }}
                                        />
                                    ))}
                                </div>

                                {selectedEixos.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-6 space-y-3"
                                    >
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-[#8C132C]">Descreva brevemente a integração (Ensino/Pesquisa/Extensão)</Label>
                                        <Textarea
                                            {...register("descricaoIntegracao")}
                                            placeholder="Ex: Os alunos de graduação participaram ativamente da coleta de dados como parte integrante da UC de Prática Integrativa..."
                                            className="min-h-[100px] bg-white border-[#8C132C]/20 rounded-2xl italic font-medium"
                                        />
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Campo de Relevância / Estrelas (Mover para o final como solicitado) */}
                        <div className="space-y-6 pt-10 border-t border-slate-100 print:hidden">
                            <div className="px-2">
                                <Label className="text-[#8C132C] font-black text-xs uppercase tracking-[0.2em]">Índice de Relevância Institucional</Label>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                                    Classifique este registro em relação à sua produção total. Estrelas à esquerda indicam registros rotineiros, à direita os de alto impacto.
                                </p>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 p-8 rounded-[36px] border border-slate-100">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rotineiro</span>
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map((index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setValue("relevancia", index)}
                                            className={cn(
                                                "transition-all duration-300 transform hover:scale-125",
                                                relevancia >= index ? "text-yellow-500 scale-110" : "text-slate-200"
                                            )}
                                        >
                                            <Star
                                                size={48}
                                                className={cn(
                                                    "transition-all",
                                                    relevancia >= index ? "fill-yellow-500" : "fill-none text-slate-200"
                                                )}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-right">Alto Impacto</span>
                            </div>
                        </div>
                    </Card>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className={cn(
                            "w-full h-20 rounded-[32px] text-white font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl",
                            isSaving ? "bg-slate-400 cursor-not-allowed" : "bg-[#363636] hover:bg-black active:scale-[0.98]"
                        )}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <FileCheck size={28} />
                                Finalizar e Salvar Registro Acadêmico
                            </>
                        )}
                    </Button>

                    {/* FOOTER OFICIAL (FOTO 3 STYLE) */}
                    <div className="hidden print:flex flex-col items-center mt-12 text-center text-[8px] text-[#2D3748] border-t border-slate-200 pt-6 space-y-1">
                        <div className="font-black text-[#718096] uppercase mb-1">Curso de Fisioterapia - Betim</div>
                        <div className="max-w-md">Av. Arthur Bernardes, 1081 Prédio 7| Angola | 32604-115 | Betim | Minas Gerais | Brasil</div>
                        <div className="font-bold">Tel.: (31) 3544-6852 | coordfisiobtm@pucminas.br</div>
                        <div className="mt-4 italic opacity-50">Documento gerado eletronicamente no Portal Axiom SINAES em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</div>
                    </div>
                </form>
            </main>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: auto;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    table {
                        page-break-inside: auto;
                        border-collapse: collapse !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto;
                    }
                    td {
                        border: 2px solid black !important;
                    }
                    .bg-slate-100 {
                        background-color: #f1f5f9 !important;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tfoot {
                        display: table-footer-group;
                    }
                    img {
                        max-width: 100% !important;
                        display: block;
                    }
                }
            `}</style>

            {/* MODAL NOVO TIPO */}
            <Dialog open={isAddingType} onOpenChange={setIsAddingType}>
                <DialogContent className="rounded-[32px] p-8 border-none">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl">Novo Tipo de Atividade</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Nome da Atividade</Label>
                        <Input
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            placeholder="Digite o novo tipo..."
                            className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                        />

                        {newType.length > 1 && (
                            <div className="space-y-3 mt-4">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Baseado nos existentes:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(availableTypes || [])
                                        .filter(t => t.toLowerCase().includes(newType.toLowerCase()) && t.toLowerCase() !== newType.toLowerCase())
                                        .slice(0, 5)
                                        .map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setNewType(t)}
                                                className="px-3 py-1.5 bg-slate-50 hover:bg-[#8C132C]/5 text-slate-500 hover:text-[#8C132C] rounded-xl text-[10px] font-bold transition-all border border-slate-100 hover:border-[#8C132C]/20"
                                            >
                                                {t}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={onAddType} className="bg-[#8C132C] text-white rounded-2xl w-full h-14 font-black">Adicionar à Lista</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Loader em Tela Cheia para Salvamento */}
            <AnimatePresence>
                {isSaving && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md"
                    >
                        <QuantumLoader />
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8 text-lg font-black text-[#8C132C] uppercase tracking-[0.3em]"
                        >
                            Salvando Evidência
                        </motion.p>
                        <p className="mt-2 text-sm font-medium text-slate-400">Sincronizando com a nuvem PUC Minas...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function NovoRegistroAcademico() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-[#FDFDFD]"><QuantumLoader size="60" color="#8C132C" /></div>}>
            <NovoRegistroAcademicoForm />
        </Suspense>
    );
}
