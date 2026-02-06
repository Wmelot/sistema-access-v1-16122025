'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Check
} from 'lucide-react';
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
        descricao: '→ Objetivo principal;\n→ Linha de pesquisa do curso com a qual se articula (se aplicável);\n→ Participação de estudantes de graduação (nome do(s) discente(s));\n→ Relevância para a Fisioterapia, para o context local (Betim/Região Metropolitana) ou para o SUS;\n→ Resultados principais ou produtos gerados.',
        impacto: '→ Informar se houve publicação de artigo, resumo, livro ou capítulo de livro (informar o DOI se houver);\n→ Comprovante de submissão a evento científico (se apresentado);\n→ Registros fotográficos de participação em eventos científicos;\n→ Links para mídias sociais institucionais (se houver registro público).'
    },
    EXTENSÃO: {
        titulo: 'Ex: "Oficinas de Prevenção de Quedas para Idosos – Parceria com UBS Jardim Teresópolis"',
        descricao: '→ Objetivo social da ação;\n→ Metodologia (ex: oficinas, triagens, grupos educativos, campanhas);\n→ Número de alunos envolvidos;\n→ Parceiros externos envolvidos;\n→ Como se articula com o PPC do curso e com as necessidades do território;',
        impacto: '→ Destacar o impacto social da ação no público externos, no docente e discente;\n→ Registros fotográficos de participação.'
    }
};

const DEFAULT_TYPES = {
    ENSINO: ['Ata de Aula', 'Simulação Clínica', 'Projeto Integrador', 'Sala de Aula Invertida', 'Estudo de Caso'],
    PESQUISA: ['Projeto de pesquisa (FIP, PIBIC, PIC-IV)', 'Orientação de TCC', 'Prática investigativa em UC'],
    EXTENSÃO: ['Projeto de extensão (edital ou extra edital)', 'Atividades vinculadas às UCs', 'Evento de extensão']
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
                toast.success("Relato MEC formalizado com sucesso!");
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
                    Encantar MEC (Nota 5)
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

export default function NovoRegistroAcademico() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const extraFilesRef = useRef<HTMLInputElement>(null);
    const [categoria, setCategoria] = useState<string>("PESQUISA");
    const [isAddingType, setIsAddingType] = useState(false);
    const [newType, setNewType] = useState("");
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const { register, handleSubmit, control, watch, setValue, getValues } = useForm({
        defaultValues: {
            titulo: "",
            docente: "Warley de Melo Oliveira",
            disciplina_nome: "Fisioterapia Cardiovascular",
            periodo: "8º período",
            semestre: "2º semestre",
            ano: "2025",
            tipo: "Projeto de pesquisa (FIP, PIBIC, PIC-IV)",
            descricao: "",
            impacto: "",
            links: [""],
            eixos: [] as string[],
            descricaoIntegracao: "",
            legenda: ""
        }
    });

    const links = watch("links");
    const selectedEixos = watch("eixos");
    const descricaoIntegracao = watch("descricaoIntegracao");

    useEffect(() => {
        const fetchUserName = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
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
        fetchUserName();

        if (categoria) {
            setAvailableTypes(DEFAULT_TYPES[categoria as keyof typeof DEFAULT_TYPES] || []);
        }
    }, [categoria, setValue]);

    const onAddType = () => {
        if (!newType.trim()) return;
        setAvailableTypes([...availableTypes, newType.trim()]);
        setValue("tipo", newType.trim());
        setNewType("");
        setIsAddingType(false);
        toast.success("Novo tipo adicionado.");
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
    const compressImage = (file: File, maxWidth = 1600, quality = 0.9): Promise<string> => {
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

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const onSubmit = async (data: any) => {
        const toastId = toast.loading("Salvando na Nuvem (Supabase)...");

        try {
            // 1. Processar Imagem Principal (Compressão)
            let finalImage = "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop";

            if (selectedFiles.length > 0) {
                // Tenta pegar a primeira imagem para ser a capa
                const imageFile = selectedFiles.find(f => f.type.startsWith('image/'));
                if (imageFile) {
                    try {
                        finalImage = await compressImage(imageFile);
                    } catch (e) {
                        console.error("Erro compressão, usando original convertida");
                        // Fallback: tentar converter para base64 direto se compressão falhar
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

            const newEv = {
                ...data,
                disciplina: `${data.disciplina_nome} – ${data.periodo} – ${data.semestre} de ${data.ano}`,
                categoria: categoria,
                data: new Date().toLocaleDateString('pt-BR'),
                img: finalImage,
                professor: data.docente || "Warley de Melo Oliveira"
            };

            // 2. Salvar REALMENTE no Supabase (Await)
            await saveEvidence(newEv);

            // 3. Atualizar Cache Local (Apenas sucesso)
            const savedEvs = localStorage.getItem('axiom_evidencias');
            const currentEvs = savedEvs ? JSON.parse(savedEvs) : [];
            const updatedEvs = [newEv, ...currentEvs];
            localStorage.setItem('axiom_evidencias', JSON.stringify(updatedEvs));

            toast.dismiss(toastId);
            toast.success("Confirmado: Salvo na Nuvem com Sucesso!");

            setTimeout(() => {
                window.location.href = "/academico?tab=gallery";
            }, 800);

        } catch (error: any) {
            console.error("Erro FATAL ao salvar:", error);
            toast.dismiss(toastId);

            const hasImages = selectedFiles.some(f => f.type.startsWith('image/'));

            if (hasImages) {
                Swal.fire({
                    title: 'Falha ao Enviar',
                    text: 'Não conseguimos salvar na nuvem agora. Deseja salvar as fotos na sua Galeria do celular para não perdê-las?',
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
                toast.error("Erro de Conexão. Verifique sua internet e clique em salvar novamente.");
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
                        <span className="text-[9px] font-black text-[#8C132C] uppercase tracking-tighter">Pontifícia Universidade Católica</span>
                        <h1 className="text-sm font-bold text-[#363636] tracking-tight">Portal de Evidências SINAES</h1>
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

                    <div className="print:hidden">
                        <div
                            onClick={handleCameraClick}
                            className="bg-gradient-to-r from-[#8C132C] to-[#5a0c1d] rounded-[32px] p-8 shadow-xl text-white active:scale-95 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-[#8C132C]/20"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center border border-white/20">
                                    <Camera size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Capturar Evidência</h2>
                                    <p className="text-white/60 text-xs font-black uppercase tracking-widest italic">Fotos ou Vídeos para SINAES</p>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                                capture="environment"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <Card className="rounded-[48px] border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-10 space-y-10 print:shadow-none print:p-0 print:rounded-none">

                        {/* Info Básica - PRINT FORMAT (TABELA FOTO 3) */}
                        <div className="print:block hidden w-full">
                            <table className="w-full border-collapse border-2 border-black text-[12px]">
                                <tbody>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black w-1/4 uppercase">Título do registro:</td>
                                        <td className="p-4 border-2 border-black font-bold text-sm italic">"{watch("titulo") || "Ex: Efeitos da cinesioterapia respiratória..."}"</td>
                                    </tr>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black uppercase">Docente responsável:</td>
                                        <td className="p-4 border-2 border-black">
                                            <div className="text-[10px] uppercase font-bold opacity-70 mb-1">Nome(s) completo(s):</div>
                                            <div className="font-black text-sm">{watch("docente")}</div>
                                        </td>
                                    </tr>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black uppercase">Disciplina e período/ano de aplicação:</td>
                                        <td className="p-4 border-2 border-black font-bold text-sm">
                                            {watch("disciplina_nome")} – {watch("periodo")} – {watch("semestre")} de {watch("ano")}
                                        </td>
                                    </tr>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black uppercase">Tipo de atividade:</td>
                                        <td className="p-4 border-2 border-black font-black text-sm">{watch("tipo")}</td>
                                    </tr>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black uppercase align-top">Descrição sucinta:</td>
                                        <td className="p-4 border-2 border-black align-top min-h-[220px] whitespace-pre-wrap leading-relaxed text-[12px]">
                                            {watch("descricao") || "-"}
                                        </td>
                                    </tr>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black uppercase align-top">Resultados principais:</td>
                                        <td className="p-4 border-2 border-black align-top min-h-[160px] whitespace-pre-wrap leading-relaxed text-[12px]">
                                            {watch("impacto") || "-"}
                                        </td>
                                    </tr>
                                    <tr className="page-break-inside-avoid">
                                        <td className="bg-slate-100 p-4 font-black border-2 border-black uppercase text-[11px]">Houve integração com ensino ou pesquisa?</td>
                                        <td className="p-4 border-2 border-black">
                                            <div className="flex gap-10 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-5 h-5 border-2 border-black rounded-sm flex items-center justify-center", selectedEixos.length > 0 ? "bg-black" : "bg-white")}>
                                                        {selectedEixos.length > 0 && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <span className="font-black uppercase text-[12px]">Sim</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-5 h-5 border-2 border-black rounded-sm flex items-center justify-center", selectedEixos.length === 0 ? "bg-black" : "bg-white")}>
                                                        {selectedEixos.length === 0 && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <span className="font-black uppercase text-[12px]">Não</span>
                                                </div>
                                            </div>
                                            {selectedEixos.length > 0 && (
                                                <div className="mt-2 text-[11px] leading-tight text-slate-800 italic border-l-4 border-slate-200 pl-3">
                                                    <span className="font-bold not-italic font-sans mb-1 block">Descrição da integração:</span>
                                                    {descricaoIntegracao || "Se houve integração com ensino ou pesquisa descrever brevemente..."}
                                                </div>
                                            )}
                                            {!selectedEixos.length && (
                                                <div className="mt-2 text-[11px] font-bold text-slate-400 italic">
                                                    Não houve integração reportada nesta atividade.
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
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

                            <div className="space-y-3">
                                <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Legenda / Resumo do Comprovante</Label>
                                <Input
                                    {...register("legenda")}
                                    placeholder="Ex: Foto da palestra no auditório principal..."
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:ring-4 focus:ring-[#8C132C]/5 font-bold px-8 transition-all"
                                />
                            </div>

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
                                <div className="space-y-3">
                                    <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Disciplina / Matéria</Label>
                                    <Input {...register("disciplina_nome")} className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8 focus:ring-[#8C132C]/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Período</Label>
                                        <Input {...register("periodo")} placeholder="Ex: 8º período" className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8" />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Semestre</Label>
                                        <Select onValueChange={(val) => setValue("semestre", val)} defaultValue={getValues("semestre")}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="1º semestre" className="font-bold">1º Semestre</SelectItem>
                                                <SelectItem value="2º semestre" className="font-bold">2º Semestre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[#363636] font-black text-xs uppercase tracking-[0.2em] opacity-50 px-2">Ano</Label>
                                        <Select onValueChange={(val) => setValue("ano", val)} defaultValue={getValues("ano")}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {['2023', '2024', '2025', '2026', '2027'].map(year => (
                                                    <SelectItem key={year} value={year} className="font-bold">{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                    </Card>

                    <Button
                        type="submit"
                        className="w-full h-20 rounded-[32px] bg-[#363636] hover:bg-black text-white font-black text-xl shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95 print:hidden"
                    >
                        Finalizar e Salvar Registro Acadêmico
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
                    </div>
                    <DialogFooter>
                        <Button onClick={onAddType} className="bg-[#8C132C] text-white rounded-2xl w-full h-14 font-black">Adicionar à Lista</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
