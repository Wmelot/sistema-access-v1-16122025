'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Library,
    BookOpen,
    Trash2,
    Bookmark,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useSyllabus } from './SyllabusContext';
import { cn } from "@/lib/utils";
import { Book } from './types';

export default function Step2_Library() {
    const {
        setStep,
        books,
        addBook,
        removeBook
    } = useSyllabus();

    const [newBook, setNewBook] = useState<Omit<Book, 'id'>>({ title: '', author: '', type: 'Básico' });

    const handleAddBook = () => {
        if (!newBook.title || !newBook.author) return;
        addBook(newBook);
        setNewBook({ title: '', author: '', type: 'Básico' });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 p-8 rounded-[40px] border-none shadow-xl h-fit bg-white/80 backdrop-blur-xl">
                    <h3 className="text-lg font-black text-[#8C132C] mb-6 flex items-center gap-2">
                        <Library size={20} /> Cadastrar Obra
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Título / Nome</Label>
                            <Input value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} placeholder="Ex: Tratado de..." className="rounded-xl border-slate-100 bg-slate-50 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Autor / Edição</Label>
                            <Input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} placeholder="Ex: Dutton, 2024" className="rounded-xl border-slate-100 bg-slate-50 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Tipo SINAES</Label>
                            <Select onValueChange={(val: any) => setNewBook({ ...newBook, type: val })} defaultValue="Básico" value={newBook.type}>
                                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    <SelectItem value="Básico">Básica (Mín. 3)</SelectItem>
                                    <SelectItem value="Complementar">Complementar (Mín. 5)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAddBook} className="w-full bg-[#363636] h-12 rounded-xl font-black uppercase text-[10px] tracking-widest mt-4 hover:scale-105 transition-all">
                            Adicionar à Biblioteca
                        </Button>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400 px-4 tracking-widest">Biblioteca do Semestre</Label>
                    <div className="grid gap-3">
                        {books.map(book => (
                            <motion.div layout key={book.id} className="bg-white/80 backdrop-blur-sm p-5 rounded-3xl flex items-center justify-between shadow-sm border border-slate-50 group hover:border-[#8C132C]/20 transition-all hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                        book.type === 'Básico' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800">{book.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.author} • {book.type}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeBook(book.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                        {books.length === 0 && (
                            <div className="h-60 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                                <Bookmark size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Nenhuma obra cadastrada</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                <Button onClick={() => setStep(1)} variant="ghost" className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                    <ChevronLeft size={18} className="mr-2" /> Voltar
                </Button>
                <Button onClick={() => setStep(3)} className="bg-[#8C132C] h-14 rounded-2xl px-10 font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-[#8C132C]/20">
                    Próximo Passo <ChevronRight size={18} className="ml-2" />
                </Button>
            </div>
        </motion.div>
    );
}
