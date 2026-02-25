'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Printer,
    Download,
    Calendar as CalendarIcon,
    Library,
    Award,
    ShieldCheck,
    FileSignature
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyllabus } from './SyllabusContext';
import { cn } from "@/lib/utils";
import { PRINT_STYLES } from './types';

export default function PrintPreview() {
    const {
        showPreviewModal, setShowPreviewModal,
        visibleColumns, setVisibleColumns,
        printFontSize, setPrintFontSize,
        orientation, setOrientation,
        handlePrint,
        handleExportSyllabus,
        printRef,
        selectedTemplate,
        courseName,
        selectedLogo,
        theoryLocation,
        practiceLocation,
        totalNeededHours,
        fullSchedule,
        books,
        assessments,
        totalPoints
    } = useSyllabus();

    return (
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
            <DialogContent className="max-w-[1400px] sm:max-w-[90vw] rounded-[48px] p-0 border-none overflow-hidden max-h-[96vh] flex flex-col bg-white">
                {/* Header do Modal */}
                <div className="bg-[#F8F9FA] px-10 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-[#363636]">Visualização Estratégica</DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Configure o estilo visual antes de exportar</DialogDescription>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2 no-print" />

                    <div className="flex gap-2 no-print">
                        {[
                            { id: 'data', label: 'Data' },
                            { id: 'dia', label: 'Dia' },
                            { id: 'conteudo', label: 'Conteúdo' },
                            { id: 'references', label: 'Referências' },
                            { id: 'atividade', label: 'Atividade' },
                            { id: 'pontos', label: 'Pontos' }
                        ].map(col => (
                            <button
                                key={col.id}
                                onClick={() => setVisibleColumns(visibleColumns.includes(col.id) ? visibleColumns.filter(c => c !== col.id) : [...visibleColumns, col.id])}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all",
                                    visibleColumns.includes(col.id) ? "bg-[#8C132C]/5 border-[#8C132C]/20 text-[#8C132C]" : "bg-white border-slate-50 text-slate-300"
                                )}
                            >
                                {col.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2 no-print" />

                    <div className="flex bg-slate-50 p-1 rounded-2xl no-print">
                        {[
                            { id: 'small', label: 'P', size: 'text-[9px]' },
                            { id: 'medium', label: 'M', size: 'text-[11px]' },
                            { id: 'large', label: 'G', size: 'text-[13px]' }
                        ].map(fs => (
                            <button
                                key={fs.id}
                                onClick={() => setPrintFontSize(fs.id as any)}
                                className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all",
                                    printFontSize === fs.id ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-300 hover:text-slate-500"
                                )}
                                title={`Fonte ${fs.label}`}
                            >
                                {fs.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-10 w-px bg-slate-100 mx-2 no-print" />

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setOrientation('portrait')}
                            className={cn(
                                "px-6 h-10 rounded-xl text-[10px] font-black uppercase transition-all",
                                orientation === 'portrait' ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Vertical
                        </button>
                        <button
                            onClick={() => setOrientation('landscape')}
                            className={cn(
                                "px-6 h-10 rounded-xl text-[10px] font-black uppercase transition-all",
                                orientation === 'landscape' ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Horizontal
                        </button>
                    </div>

                    <div className="h-10 w-px bg-slate-200 mx-1 no-print" />

                    <Button variant="outline" onClick={handlePrint} className="h-12 rounded-xl border-slate-200 text-slate-500 font-black uppercase text-[10px] gap-2 no-print">
                        <Printer size={16} /> Imprimir / PDF
                    </Button>
                    <Button onClick={handleExportSyllabus} className="h-12 rounded-xl bg-[#8C132C] text-white font-black uppercase text-[10px] gap-2 shadow-lg shadow-[#8C132C]/10 no-print">
                        <Download size={16} /> Exportar JSON
                    </Button>
                </div>

                {/* Área de Preview com Templates - SIMULAÇÃO A4 */}
                <div className="flex-1 overflow-y-auto p-12 bg-slate-400/20 flex justify-center scroll-smooth backdrop-blur-sm">
                    <div ref={printRef} className={cn(
                        "bg-white shadow-[0_40px_100px_rgba(0,0,0,0.2)] relative print-area border border-slate-100 flex flex-col h-auto mb-20",
                        orientation === 'portrait' ? "w-[210mm] min-h-[297mm] p-[16mm] sm:p-[20mm]" : "w-[297mm] min-h-[210mm] p-[12mm] sm:p-[15mm]",
                        selectedTemplate === 1 && "border-t-[20px] border-[#8C132C]",
                        selectedTemplate === 2 && "font-serif border-[1px] border-slate-200",
                        selectedTemplate === 3 && "rounded-[48px] px-24 border-none shadow-2xl",
                        selectedTemplate === 4 && "border-l-[40px] border-[#363636]"
                    )} style={{
                        zoom: printFontSize === 'small' ? 0.75 : printFontSize === 'medium' ? 0.85 : 1,
                        height: 'fit-content' // Garante que cresce com o conteúdo
                    }}>
                        <style>{PRINT_STYLES(orientation, printFontSize)}</style>

                        {/* Extract and Number References */}
                        {(() => {
                            const usedBids = Array.from(new Set(fullSchedule.flatMap(row => row.bibliographyIds || [])));
                            const numberedRefs = usedBids.map((bid, i) => ({ id: bid, number: i + 1, book: books.find(b => b.id === bid) })).filter(r => r.book);

                            return (
                                <>
                                    {/* Template Header */}
                                    <header className="mb-12 relative">
                                        <div className="flex justify-between items-start mb-10 gap-8">
                                            <div className="space-y-4 flex-1 min-w-0">
                                                <Badge className={cn(
                                                    "bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5",
                                                    selectedTemplate === 4 && "bg-[#363636] text-white"
                                                )}>
                                                    Documento Oficial Acadêmico
                                                </Badge>
                                                <h1 className={cn(
                                                    "font-black text-slate-800 leading-tight break-words",
                                                    courseName.length > 40 ? "text-2xl" : "text-4xl",
                                                    selectedTemplate === 2 && "font-serif italic",
                                                    selectedTemplate === 2 && courseName.length > 40 ? "text-4xl" : selectedTemplate === 2 ? "text-5xl" : ""
                                                )} style={{ textWrap: 'balance' }}>
                                                    {courseName}
                                                </h1>
                                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Plano de Ensino & Cronograma Semestral</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end shrink-0">
                                                {selectedLogo && (
                                                    <img src={selectedLogo} alt="Logo da Instituição" className="h-16 object-contain mb-4" />
                                                )}
                                                <div className="text-[10px] font-black text-[#8C132C] mb-1 uppercase">CÓD: TRAU-2026-X</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Semestre 2026.1</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-8 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div>
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Localização (Teoria)</div>
                                                <div className="text-xs font-black text-slate-700">{theoryLocation}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Localização (Prática)</div>
                                                <div className="text-xs font-black text-slate-700">{practiceLocation}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Carga Horária</div>
                                                <div className="text-xs font-black text-slate-700">{totalNeededHours} Horas Totais</div>
                                            </div>
                                        </div>
                                    </header>

                                    {/* Cronograma Table */}
                                    <section className="space-y-6">
                                        <h3 className="text-xl font-black text-slate-800 border-b-4 border-[#8C132C] pb-4 flex items-center gap-3">
                                            <CalendarIcon className="text-[#8C132C]" size={24} /> Cronograma de Atividades do Semestre
                                        </h3>

                                        <div className="space-y-4">
                                            {fullSchedule.map((row, idx) => (
                                                <div key={idx} className={cn(
                                                    "rounded-[32px] border border-slate-100 p-8 bg-white transition-all break-inside-avoid shadow-sm flex gap-8 relative",
                                                    row.type === 'holiday' && "bg-slate-50 border-slate-200 opacity-60",
                                                    row.type === 'assessment' && "border-amber-200 bg-amber-50/10 shadow-lg shadow-amber-500/5",
                                                    row.isPractical && "border-l-[12px] border-l-blue-400/20"
                                                )}>
                                                    {(visibleColumns.includes('data') || visibleColumns.includes('dia')) && (
                                                        <div className="w-24 shrink-0 flex flex-col items-center justify-start py-1">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black transition-all mb-2 shadow-sm",
                                                                row.type === 'assessment' ? "text-amber-600 bg-amber-100" :
                                                                    row.type === 'holiday' ? "text-red-400 bg-red-100" : "text-slate-700 bg-slate-50"
                                                            )}>
                                                                <span className="text-lg leading-none">{row.date === '---' ? '---' : row.date?.split('/')[0]}</span>
                                                                <span className="text-[10px] uppercase opacity-60">
                                                                    {row.date && row.date.includes('/') ? format(new Date(2026, parseInt(row.date.split('/')[1]) - 1, 1), 'MMM', { locale: ptBR }) : 'EXT'}
                                                                </span>
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{row.dia}</span>
                                                                <div className="text-[9px] font-bold text-slate-300 mt-1 uppercase">{row.time}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex-1 space-y-4 min-w-0">
                                                        <div className="space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className={cn(
                                                                    "text-[18px] font-black leading-tight",
                                                                    row.type === 'holiday' ? "text-red-400 italic" : "text-slate-800",
                                                                    row.type === 'assessment' && "text-[#8C132C]"
                                                                )}>
                                                                    {row.content}
                                                                </h4>
                                                                {row.isPractical && <Badge className="bg-blue-400 text-white border-none text-[8px] font-black px-2 py-0">AULA PRÁTICA</Badge>}
                                                                {row.type === 'assessment' && <Badge className="bg-amber-500 text-white border-none text-[8px] font-black px-2 py-0">AVALIAÇÃO</Badge>}
                                                            </div>
                                                            {row.subContent && (
                                                                <div className="text-[11px] font-bold text-[#8C132C]/60 italic uppercase tracking-tight flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#8C132C]/20" />
                                                                    {row.subContent}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {visibleColumns.includes('references') && row.bibliographyIds?.length > 0 && (
                                                            <div className="pt-2 flex flex-wrap gap-1.5">
                                                                {row.bibliographyIds.map((bid: string) => {
                                                                    const ref = numberedRefs.find(r => r.id === bid);
                                                                    return ref ? (
                                                                        <span key={bid} className="text-[10px] font-black bg-[#8C132C]/10 text-[#8C132C] px-2 py-0.5 rounded-md">
                                                                            [{ref.number}]
                                                                        </span>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {(visibleColumns.includes('atividade') || visibleColumns.includes('pontos')) && (
                                                        <div className="w-48 text-right flex flex-col justify-between py-1 border-l border-slate-50 pl-8">
                                                            <div className="space-y-4">
                                                                {visibleColumns.includes('atividade') && (
                                                                    <div className="space-y-1">
                                                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Atividade</div>
                                                                        <div className={cn(
                                                                            "text-[12px] font-black uppercase tracking-tight",
                                                                            row.type === 'assessment' ? "text-[#8C132C]" : "text-slate-600",
                                                                            row.type === 'holiday' && "text-red-300"
                                                                        )}>
                                                                            {row.activity}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {visibleColumns.includes('pontos') && row.points && (
                                                                    <div className="space-y-1">
                                                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pontuação</div>
                                                                        <div className="text-xl font-black text-emerald-600">
                                                                            {row.points.toFixed(1)} <span className="text-[10px] text-emerald-400">PTS</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {!row.points && row.type !== 'holiday' && (
                                                                <div className="text-[10px] font-bold text-slate-200 uppercase italic">Atividade Formativa</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Referências Bibliográficas Enumeradas */}
                                    {numberedRefs.length > 0 && (
                                        <section className="mt-12 space-y-6 break-inside-avoid">
                                            <h3 className="text-xl font-black text-slate-800 border-b-4 border-[#8C132C] pb-4 flex items-center gap-3">
                                                <Library className="text-[#8C132C]" size={24} /> Referências Bibliográficas
                                            </h3>
                                            <div className="grid grid-cols-1 gap-4 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                                                {numberedRefs.map(ref => (
                                                    <div key={ref.id} className="text-xs text-slate-600 flex gap-4 items-start">
                                                        <span className="font-black text-[#8C132C] shrink-0 w-6">[{ref.number}]</span>
                                                        <div>
                                                            <span className="font-black text-slate-800">{ref.book?.title}</span>.
                                                            <span className="ml-1 italic text-slate-500">{ref.book?.author}</span>.
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Detalhes de Avaliação e Regras */}
                                    <section className="mt-12 grid grid-cols-2 gap-10 break-inside-avoid">
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                                <Award className="text-[#8C132C]" size={20} /> Composição de Notas
                                            </h3>
                                            <div className="p-8 bg-slate-50 rounded-[32px] space-y-4 border border-slate-100">
                                                <div className="space-y-4 pt-4">
                                                    {[...assessments].sort((a, b) => {
                                                        if (!a.date) return 1;
                                                        if (!b.date) return -1;
                                                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                                                    }).map(ass => (
                                                        <div key={ass.id} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
                                                            <span className="text-sm font-bold text-slate-600 flex items-center gap-3">
                                                                {ass.name}
                                                                {ass.date && <span className="bg-[#8C132C]/10 text-[#8C132C] text-[9px] px-2 py-1 rounded-md uppercase font-black tracking-widest">{format(new Date(ass.date), 'dd/MM')}</span>}
                                                            </span>
                                                            <span className="text-lg font-black text-[#363636]">{ass.points} pts</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-6 pt-6 border-t-2 border-slate-200 flex justify-between items-center">
                                                    <span className="text-xs font-black text-[#8C132C] uppercase tracking-widest">Total da Disciplina</span>
                                                    <span className="text-2xl font-black text-[#8C132C]">{totalPoints} pts</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                                <ShieldCheck className="text-emerald-500" size={20} /> Validação Institucional
                                            </h3>
                                            <div className="p-8 bg-[#363636] text-white rounded-[32px] space-y-4 shadow-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><FileSignature size={20} className="text-emerald-400" /></div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase opacity-40">Status de Aprovação</div>
                                                        <div className="text-sm font-bold">Aguardando Assinatura do NDE</div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                                    Este cronograma foi gerado eletronicamente e segue as diretrizes do PPC (Projeto Pedagógico de Curso) vigente para o semestre letivo de 2026.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Footer do Template */}
                                    <footer className="mt-20 flex justify-between items-end border-t border-slate-100 pt-10">
                                        <div className="space-y-6">
                                            <div className="w-40 h-px bg-slate-200 mb-2" />
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-[12px] text-slate-800 uppercase">PORTAL ACADÊMICO</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerado digitalmente em {new Date().toLocaleDateString()}</div>
                                        </div>
                                    </footer>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
