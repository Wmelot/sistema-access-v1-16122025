'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Printer,
    Plus,
    Download,
    BookOpen,
    LayoutGrid,
    List,
    Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { AcademicLogoString } from '@/components/academic/logo';

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export default function CertificadosPage() {
    const [selectedCertTemplate, setSelectedCertTemplate] = useState(1);
    const [alunoNome, setAlunoNome] = useState('');
    const [cargaHoraria, setCargaHoraria] = useState('20h');
    const [dataRealizacao, setDataRealizacao] = useState(new Date().toLocaleDateString('pt-BR'));
    const [localRealizacao, setLocalRealizacao] = useState('PUC Minas - Betim');
    const [tituloAtividade, setTituloAtividade] = useState('Projeto de Extensão Acadêmica');

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-10 font-sans">
            {/* Header (Hide on print) */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-50 print:hidden">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.history.back()} type="button" className="p-2 -ml-2 text-slate-500 hover:text-[#8C132C] transition-colors">
                            <ChevronLeft size={28} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-[#363636] tracking-tight">Gerador de Certificados</h1>
                            <p className="text-[10px] font-black text-[#8C132C] uppercase tracking-widest">Módulo Administrativo SINAES</p>
                        </div>
                    </div>
                    <Button onClick={handlePrint} className="bg-[#8C132C] hover:bg-[#5a0c1d] text-white rounded-2xl h-12 px-6 font-black gap-2 shadow-lg shadow-[#8C132C]/10 transition-all">
                        <Printer size={20} /> Imprimir / Exportar
                    </Button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 print:p-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Painel de Configuração (Escondido na impressão) */}
                    <div className="md:col-span-4 space-y-8 print:hidden">
                        <Card className="rounded-[40px] p-8 border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Título da Atividade</Label>
                                <Input
                                    value={tituloAtividade}
                                    onChange={(e) => setTituloAtividade(e.target.value)}
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Nomes dos Alunos (Um por linha)</Label>
                                <Textarea
                                    placeholder="João Silva&#10;Maria Oliveira..."
                                    className="h-32 rounded-2xl bg-slate-50 border-none font-bold p-6"
                                    value={alunoNome}
                                    onChange={(e) => setAlunoNome(e.target.value)}
                                />
                                <p className="text-[9px] text-slate-400 font-bold px-2 italic">* O sistema gerará uma folha para cada nome.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Carga Horária</Label>
                                    <Input
                                        value={cargaHoraria}
                                        onChange={(e) => setCargaHoraria(e.target.value)}
                                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Data</Label>
                                    <Input
                                        value={dataRealizacao}
                                        onChange={(e) => setDataRealizacao(e.target.value)}
                                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Local de Realização</Label>
                                <Input
                                    value={localRealizacao}
                                    onChange={(e) => setLocalRealizacao(e.target.value)}
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                                />
                            </div>
                        </Card>

                        <div className="pt-4">
                            <Label className="text-[12px] font-black uppercase text-[#8C132C] mb-4 block tracking-widest px-2">Selecione o Estilo Visual</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedCertTemplate(i)}
                                        className={cn(
                                            "aspect-[1.4/1] bg-white rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-4 shadow-sm",
                                            selectedCertTemplate === i ? "border-[#8C132C] bg-[#8C132C]/5 shadow-xl scale-105" : "border-transparent hover:border-slate-200"
                                        )}
                                    >
                                        <div className={cn("w-full h-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black", selectedCertTemplate === i ? "text-[#8C132C]" : "text-slate-300")}>
                                            ESTILO {i}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview (Onde a mágica da impressão acontece) */}
                    <div className="md:col-span-8">
                        <div className="sticky top-28 print:static">
                            <div className="print:hidden mb-4 flex items-center justify-between px-2">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Prévia em Tempo Real</h3>
                                <Badge className="bg-emerald-500 text-white border-none font-black px-3 py-1 text-[9px] uppercase">Pronto para Imprimir</Badge>
                            </div>

                            {/* Área de Impressão Dinâmica */}
                            <div className="space-y-10 print:space-y-0">
                                {alunoNome.split('\n').filter(n => n.trim() !== '').length > 0 ? (
                                    alunoNome.split('\n').filter(n => n.trim() !== '').map((nome, idx) => (
                                        <CertificateTemplate
                                            key={idx}
                                            nome={nome}
                                            titulo={tituloAtividade}
                                            data={dataRealizacao}
                                            carga={cargaHoraria}
                                            local={localRealizacao}
                                            templateId={selectedCertTemplate}
                                        />
                                    ))
                                ) : (
                                    <CertificateTemplate
                                        nome="[NOME DO ALUNO]"
                                        titulo={tituloAtividade}
                                        data={dataRealizacao}
                                        carga={cargaHoraria}
                                        local={localRealizacao}
                                        templateId={selectedCertTemplate}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: landscape;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .print-page {
                        page-break-after: always;
                    }
                    .print-page:last-child {
                        page-break-after: auto;
                    }
                }
            `}</style>
        </div>
    );
}

function CertificateTemplate({ nome, titulo, data, carga, local, templateId }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full aspect-[1.414/1] bg-white border-[12px] border-slate-100 shadow-2xl rounded-sm p-16 flex flex-col items-center relative overflow-hidden print:border-none print:shadow-none print:p-20 print:w-screen print:h-screen print-page"
        >
            {/* Template Decorativo Styles */}
            {templateId === 1 && (
                <>
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#8C132C]/5 rounded-br-[300px]" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#8C132C]/5 rounded-tl-[300px]" />
                </>
            )}
            {templateId === 2 && (
                <div className="absolute inset-8 border-[2px] border-[#8C132C]/20 rounded-lg">
                    <div className="absolute inset-4 border-[1px] border-[#8C132C]/10 rounded-sm" />
                </div>
            )}
            {templateId === 3 && (
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-slate-200 via-[#8C132C] to-slate-200" />
            )}
            {templateId === 4 && (
                <div
                    className="absolute inset-0 opacity-[0.03] grayscale mix-blend-multiply"
                    style={{
                        backgroundImage: `url(${AcademicLogoString()})`,
                        backgroundSize: '150px',
                        backgroundRepeat: 'repeat'
                    }}
                />
            )}

            <img src={AcademicLogoString()} className="h-20 object-contain mb-16 opacity-80" alt="PUC Minas Logo" />

            <div className="flex flex-col items-center text-center flex-1 max-w-4xl">
                <div className="font-serif text-[12px] uppercase tracking-[0.3em] text-slate-400 mb-6 font-bold">Certificado de Participação Acadêmica</div>

                <h2 className="font-serif text-5xl font-black text-[#363636] mb-12 uppercase tracking-tight">CERTIFICAMOS QUE</h2>

                <div className="w-48 h-1 bg-[#8C132C] mb-12 rounded-full" />

                <div className="text-4xl font-black text-[#8C132C] mb-10 tracking-tight">{nome || "[NOME DO ALUNO]"}</div>

                <p className="text-lg leading-relaxed text-slate-600 font-medium px-4">
                    Participou com êxito da atividade <strong>{titulo}</strong>, sob supervisão institucional, realizada em <strong>{data}</strong> na unidade <strong>{local}</strong>, totalizando a carga horária de <strong>{carga}</strong>.
                </p>
            </div>

            <div className="w-full flex justify-around items-end mt-20">
                <div className="flex flex-col items-center">
                    <div className="w-64 h-[1px] bg-slate-300 mb-3" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coordenação de Extensão</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-64 h-[1px] bg-slate-300 mb-3" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direção Acadêmica</div>
                </div>
            </div>

            <div className="absolute bottom-8 right-12 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                Verificado eletronicamente via SINAES / PUC Minas
            </div>
        </motion.div>
    );
}

function Badge({ children, className }: any) {
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", className)}>
            {children}
        </span>
    );
}
