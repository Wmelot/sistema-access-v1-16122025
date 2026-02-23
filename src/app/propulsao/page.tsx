'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Navigation, User, Phone, Mail, CheckCircle2, ChevronRight, Activity, CalendarClock, ShieldCheck, Footprints, Star, HeartPulse, Shield, XCircle, Users, Cpu, TrendingUp, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Partner {
    profissional: string;
    clinica: string;
    endereco: string;
    cep: string;
    coords: { lat: number, lng: number };
    agenda_id: string;
    distance: number;
    min_advance: number;
}

export default function PropulsaoPage() {
    const searchSectionRef = useRef<HTMLElement>(null);
    const [cep, setCep] = useState('');
    const [loading, setLoading] = useState(false);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [searchDone, setSearchDone] = useState(false);

    // Booking State
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [bookingData, setBookingData] = useState({ name: '', phone: '', email: '', date: undefined as Date | undefined, time: '' });
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const fetchSlots = async (partnerId: string, date: Date) => {
        setLoadingSlots(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await fetch(`/api/public/slots?professionalId=${partnerId}&date=${dateStr}`);
            const data = await res.json();
            if (data.success) {
                setAvailableSlots(data.slots);
            }
        } catch (e) {
            toast.error("Erro ao buscar horários.");
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        // Ajustar a data para o mid-day para evitar problemas de fuso no frontend
        const normalizedDate = new Date(date);
        normalizedDate.setHours(12, 0, 0, 0);

        setBookingData({ ...bookingData, date: normalizedDate, time: '' });
        if (selectedPartner) {
            fetchSlots(selectedPartner.agenda_id, normalizedDate);
        }
    };

    const scrollToSearch = () => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cep || cep.length < 8) {
            toast.error("Por favor, digite um CEP válido.");
            return;
        }

        setLoading(true);
        setSearchDone(false);
        try {
            // 1. Coordenadas
            const geoRes = await fetch(`/api/public/geocode?cep=${cep}`);
            const geoData = await geoRes.json();

            if (!geoData.success) {
                toast.error(geoData.error || "Endereço não encontrado.");
                setLoading(false);
                return;
            }

            // 2. Clínicas
            const { lat, lng } = geoData;
            const partnerRes = await fetch(`/api/public/partners?lat=${lat}&lng=${lng}&radius=50`);
            const partnerData = await partnerRes.json();

            if (partnerData.success) {
                setPartners(partnerData.partners);
                setSearchDone(true);

                // 3. Registrar "Termômetro" se não achar ninguém
                if (partnerData.partners.length === 0) {
                    await fetch('/api/public/log-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cep, lat, lng })
                    });
                }
            } else {
                toast.error("Erro ao buscar clínicas.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Falha na conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPartner || !bookingData.name || !bookingData.phone || !bookingData.email || !bookingData.date || !bookingData.time) {
            toast.error("Preencha todos os campos obrigatórios.");
            return;
        }

        setBookingLoading(true);
        try {
            const res = await fetch('/api/public/book-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professionalId: selectedPartner.agenda_id,
                    patientName: bookingData.name,
                    patientPhone: bookingData.phone.replace(/\D/g, ''),
                    patientEmail: bookingData.email,
                    date: format(bookingData.date!, 'yyyy-MM-dd'),
                    time: bookingData.time
                })
            });
            const data = await res.json();

            if (data.success) {
                setBookingSuccess(true);
            } else {
                toast.error(data.error || "Não foi possível agendar. Tente novamente.");
            }
        } catch (err) {
            toast.error("Erro na comunicação com o servidor.");
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header Flutuante */}
            <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="bg-white p-2.5 rounded-[2rem] shadow-xl border border-slate-100 h-20 w-20 flex items-center justify-center overflow-hidden">
                        <img src="/propulsao/logo.png" alt="Propulsão Logo" className="h-full w-full object-contain rounded-[1.2rem]" />
                    </div>
                    <Button onClick={scrollToSearch} className="hidden sm:flex rounded-full bg-slate-900 hover:bg-[#0052cc] text-white font-bold h-12 px-8 shadow-lg shadow-slate-200">
                        Agendar Avaliação
                    </Button>
                </div>
            </nav>

            {/* Hero Principal */}
            <main className="relative bg-[#0052cc] overflow-hidden" ref={searchSectionRef}>
                <div className="absolute inset-0 bg-[#0042a6] mix-blend-multiply opacity-50"></div>
                <div
                    className="absolute inset-0 opacity-20 bg-cover bg-center"
                    style={{ backgroundImage: "url('/propulsao/14.png')" }}
                ></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10 flex flex-col items-center text-center">
                    <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight max-w-4xl drop-shadow-md">
                        A tecnologia que revoluciona o tratamento de <br className="hidden lg:block" /> dores nos pés e joelhos.
                    </h1>
                    <p className="text-lg lg:text-2xl text-blue-100 mb-10 max-w-2xl font-medium drop-shadow-sm">
                        Agende uma avaliação biomecânica de precisão. Suas Palmilhas 3D sob medida projetadas com tecnologia de ponta.
                    </p>

                    {/* Buscador de CEP */}
                    <div className="bg-white p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center w-full max-w-2xl gap-2 transform transition-transform duration-300">
                        <div className="flex items-center w-full bg-slate-50 rounded-xl px-4 flex-1 h-16 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-colors">
                            <MapPin className="w-6 h-6 text-[#0052cc] shrink-0" />
                            <Input
                                type="text"
                                placeholder="Digite seu CEP..."
                                className="border-0 bg-transparent focus-visible:ring-0 text-xl font-bold placeholder:font-normal h-full w-full placeholder:text-slate-400"
                                value={cep}
                                onChange={(e) => setCep(e.target.value)}
                                maxLength={9}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-16 px-8 rounded-xl bg-[#0052cc] hover:bg-blue-800 text-white font-bold text-lg w-full sm:w-auto shadow-lg shadow-blue-900/20"
                        >
                            {loading ? "Buscando..." : <><Search className="w-6 h-6 mr-2" /> Buscar Especialista</>}
                        </Button>
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-blue-100/80 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 100% Personalizado</span>
                        <span className="flex items-center gap-1.5"><Star className="w-4 h-4" /> Especialistas Licenciados</span>
                    </div>
                </div>
            </main>

            {/* SEÇÃO DE RESULTADOS DA BUSCA (Se houver interação flutua aqui) */}
            {(searchDone || loading) && (
                <section className="bg-slate-100 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        {loading && (
                            <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                                <Activity className="w-16 h-16 animate-pulse text-[#0052cc] mb-4" />
                                <h3 className="text-2xl font-bold text-slate-500">Mapeando clínicas num raio de 50km...</h3>
                            </div>
                        )}

                        {searchDone && partners.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-2xl mx-auto shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MapPin className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-3">Poxa, estamos um pouco longe!</h3>
                                <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                                    Ainda não temos licenciados da Propulsão num raio de 50km do seu CEP. Acabamos de registrar sua busca para abrirmos novas unidades perto de você em breve!
                                </p>
                            </div>
                        )}

                        {searchDone && partners.length > 0 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-4 gap-4">
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight text-center sm:text-left">Opções Próximas a Você</h2>
                                    <div className="bg-green-100 text-green-700 font-bold text-sm px-4 py-2 rounded-full flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {partners.length} Especialista(s) Disponíveis
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {partners.map((partner, idx) => (
                                        <div key={idx} className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 hover:shadow-2xl hover:border-[#0052cc] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0052cc]">
                                                        <Activity className="w-7 h-7" />
                                                    </div>
                                                    <div className="bg-slate-100 text-slate-600 text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                        <Navigation className="w-4 h-4 text-[#0052cc]" />
                                                        {partner.distance} km de distância
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 mb-1">{partner.profissional}</h3>
                                                <p className="text-sm font-bold text-[#0052cc] uppercase tracking-wider mb-2">{partner.clinica}</p>
                                                <p className="text-slate-500 font-medium leading-relaxed text-sm mb-4">{partner.endereco || "Endereço sob consulta"}</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setSelectedPartner(partner);
                                                    setBookingData({ ...bookingData, date: undefined, time: '' });
                                                    setAvailableSlots([]);
                                                }}
                                                className="w-full mt-4 bg-slate-900 hover:bg-[#0052cc] text-white rounded-xl h-14 font-black text-lg group-hover:shadow-lg transition-all"
                                            >
                                                Agendar Consulta
                                                <ChevronRight className="w-5 h-5 ml-2" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Porque usar Palmilha Propulsão? */}
            <section className="py-24 bg-white relative">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                    <img src="/propulsao/14.png" alt="Bg decor" className="w-96 blur-sm" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">A verdadeira causa das suas dores</h2>
                        <p className="text-xl text-slate-500">Muitas dores que você sente não vêm da idade ou esforço. Elas vêm de uma pisada desajustada. Nossa palmilha entra corrigindo a biomecânica pela base.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Fascite Plantar', icon: Footprints, desc: 'As palmilhas ajudam controlando movimentos indesejados reduzindo o stress reduzindo a dor no calcanhar e no arco do pé.' },
                            { title: 'Esporão de Calcâneo', icon: HeartPulse, desc: 'Criamos um amortecimento sob medida para reduzir o impacto rígido exato no ponto inflamado.' },
                            { title: 'Dores nos Joelhos', icon: Activity, desc: 'Melhoramos o alinhamneto das articulações controlando movimentos indesejados que podem gerar desconforto e dores durante a caminhada e a corrida.' },
                            { title: 'Dores Articulares', icon: Shield, desc: 'Distribuímos a pressão plantar como uma luva, mantendo as articulações saudáveis a longo prazo.' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-3xl p-8 hover:bg-blue-50 transition-colors duration-300">
                                <div className="w-14 h-14 bg-white text-[#0052cc] rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vitrine de Imagens (PowerPoint) */}
            <section className="bg-slate-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <img src="/propulsao/11.png" alt="Tecnologia 3D 1" className="rounded-3xl shadow-xl w-full h-64 object-cover" />
                        <img src="/propulsao/5.png" alt="Tecnologia 3D 2" className="rounded-3xl shadow-xl w-full h-64 object-cover" />
                        <img src="/propulsao/20.png" alt="Tecnologia 3D 3" className="rounded-3xl shadow-xl w-full h-64 object-cover hidden lg:block" />
                    </div>
                </div>
            </section>

            {/* Como Funciona */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">Como criamos a <br /> sua Palmilha 3D perfeita?</h2>
                        <div className="space-y-6">
                            {[
                                { step: '1', title: 'Avaliação Biomecânica', desc: 'Atendimento presencial focado na avaliação clinica completa para identificar a melhor palmilha para o seu caso.' },
                                { step: '2', title: 'Design Tecnológico', desc: 'Sua palmilha é customizada digitalmente pela Propulsão por engenheiros especializados.' },
                                { step: '3', title: 'Produção Sustentável 3D', desc: 'O material é impresso com perfeição milimétrica sem desperdício de material tóxico.' }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#0052cc] flex items-center justify-center font-black shrink-0">{item.step}</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                                        <p className="text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button onClick={scrollToSearch} className="h-14 px-8 rounded-xl bg-white hover:bg-blue-50 text-[#0052cc] font-black text-lg">
                            Agendar Agora
                        </Button>
                    </div>
                    <div className="flex-1">
                        <img
                            src="/propulsao/7.png"
                            alt="Avaliação biomecânica e palmilhas 3D"
                            className="rounded-3xl shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-500 border border-slate-800"
                        />
                    </div>
                </div>
            </section>

            {/* Booking Modal (Modal Cego e Criptografado) */}
            {selectedPartner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !bookingLoading && !bookingSuccess && setSelectedPartner(null)}></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
                        {/* Header Modal */}
                        <div className="bg-[#0052cc] p-8 text-center relative">
                            <button
                                onClick={() => setSelectedPartner(null)}
                                className="absolute top-6 right-6 text-white/50 hover:text-white"
                                disabled={bookingLoading}
                            >
                                <XCircle className="w-7 h-7" />
                            </button>
                            <ShieldCheck className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-white">Solicitar Atendimento</h2>
                            <p className="text-blue-100 font-medium mt-1">Preencha e a clínica <strong className="text-white">{selectedPartner.clinica}</strong> conectada ao especialista iniciará o contato.</p>
                        </div>

                        {/* Body Modal */}
                        <div className="p-8">
                            {bookingSuccess ? (
                                <div className="text-center py-6">
                                    <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-3">Agendamento Realizado!</h3>
                                    <p className="text-slate-500 text-lg leading-relaxed">
                                        Seu convite foi encriptado e enviado para a agenda do Doutor de forma segura. Fique de olho no seu WhatsApp em instantes.
                                    </p>
                                    <Button onClick={() => { setBookingSuccess(false); setSelectedPartner(null); }} className="w-full mt-8 h-14 text-lg rounded-xl font-bold bg-[#0052cc]">
                                        Finalizar
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleBookingSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <Input required disabled={bookingLoading} value={bookingData.name} onChange={e => setBookingData({ ...bookingData, name: e.target.value })} placeholder="Como você se chama?" className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-xl" />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <Input type="email" required disabled={bookingLoading} value={bookingData.email} onChange={e => setBookingData({ ...bookingData, email: e.target.value })} placeholder="Seu melhor E-mail" className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-xl" />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <Input required disabled={bookingLoading} value={bookingData.phone} onChange={e => setBookingData({ ...bookingData, phone: e.target.value })} placeholder="Qual seu WhatsApp com DDD?" className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-xl" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "h-14 w-full justify-start text-left font-bold bg-slate-50 border-slate-200 rounded-xl",
                                                            !bookingData.date && "text-slate-500 font-normal"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-5 w-5 text-[#0052cc]" />
                                                        {bookingData.date ? format(bookingData.date, "PPP", { locale: ptBR }) : "Escolha o dia da avaliação"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-2xl border-2 border-blue-50" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={bookingData.date}
                                                        onSelect={handleDateSelect}
                                                        initialFocus
                                                        disabled={(date) => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);

                                                            // Calcular a data mínima permitida com a antecedência do parceiro selecionado
                                                            const minDate = new Date(today);
                                                            const advanceDays = selectedPartner?.min_advance || 0;
                                                            minDate.setDate(minDate.getDate() + advanceDays);

                                                            // Desabilita domingos ou dias anteriores ao mínimo permitido
                                                            return date < minDate || date.getDay() === 0;
                                                        }}
                                                        locale={ptBR}
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            {bookingData.date && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Clock className="w-4 h-4" /> Horários Disponíveis
                                                    </p>
                                                    {loadingSlots ? (
                                                        <div className="flex items-center gap-2 text-blue-400 font-bold py-2 animate-pulse">
                                                            <Activity className="w-4 h-4" /> Buscando horários...
                                                        </div>
                                                    ) : availableSlots.length > 0 ? (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {availableSlots.map(s => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => setBookingData({ ...bookingData, time: s })}
                                                                    className={cn(
                                                                        "h-11 rounded-lg border-2 font-bold transition-all text-sm flex items-center justify-center",
                                                                        bookingData.time === s
                                                                            ? "bg-[#0052cc] border-[#0052cc] text-white shadow-md shadow-blue-200"
                                                                            : "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                                                                    )}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm font-bold text-amber-600 bg-amber-50 p-4 rounded-xl flex items-center gap-3">
                                                            <Activity className="w-5 h-5 shrink-0" />
                                                            Não encontramos horários livres para este dia. Tente outra data.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {!bookingData.time && (
                                            <div className="bg-blue-50/50 p-4 rounded-xl flex items-start gap-4 border border-blue-100 mt-2 hover:bg-blue-50 transition-colors animate-in fade-in duration-500">
                                                <CalendarClock className="w-6 h-6 text-[#0052cc] shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">Avaliação Biomecânica Propulsão</p>
                                                    <p className="text-xs text-blue-600 font-bold mt-0.5">
                                                        {bookingData.date ? "Selecione um horário acima para continuar." : "O licenciado confirmará o horário disponível após a sua solicitação."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <Button disabled={bookingLoading} type="submit" className="w-full h-14 rounded-xl bg-[#0052cc] hover:bg-blue-800 text-white font-black text-[17px] shadow-lg shadow-blue-900/20 mt-6 transition-transform active:scale-[0.98]">
                                        {bookingLoading ? "Transferindo dados em segurança..." : "Reservar Consultório Agora"}
                                    </Button>
                                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Ambente Criptografado e Seguro</p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Parceiro para Fisioterapeutas */}
            <section className="py-24 bg-gradient-to-br from-indigo-50 to-blue-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-[3rem] shadow-xl p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-16 border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

                        <div className="flex-1 space-y-8 relative z-10">
                            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-[#0052cc] font-black text-sm uppercase tracking-widest border border-blue-100">
                                <Users className="w-5 h-5" />
                                Para Fisioterapeutas
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight leading-tight">
                                Transforme sua clínica. <br className="hidden lg:block" /> Seja um licenciado <span className="text-[#0052cc]">Propulsão</span>.
                            </h2>
                            <p className="text-xl text-slate-500 leading-relaxed font-medium">
                                Domine a biomecânica. Avalie seus pacientes com nosso sistema de ponta e deixe a engenharia e confecção das palmilhas 3D por nossa conta.
                            </p>

                            <div className="space-y-6 pt-4">
                                {[
                                    { icon: Cpu, title: 'Avaliação Padronizada', desc: 'Software exclusivo integrado para avaliação, desenho e prescrição de palmilhas com laudos personalizados prontos em minutos.' },
                                    { icon: Activity, title: 'Produção em EVA utilizando modelos 3D', desc: 'Sua clínica avalia com precisão impecável; nossos engenheiros confeccionam e entregam a palmilha.' },
                                    { icon: TrendingUp, title: 'Fluxo Automático de Pacientes', desc: 'Leads gerados nesta exata plataforma cairão diretamente na sua ferramenta de agenda de consultas.' }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-[#0052cc]/10 text-[#0052cc] flex items-center justify-center shrink-0">
                                            <feature.icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-1">{feature.title}</h4>
                                            <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <a
                                    href="https://wa.me/5531999688640?text=Olá,%20vim%20pela%20página%20da%20Propulsão%20e%20quero%20ser%20um%20licenciado%20credenciado!"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center h-16 px-10 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-xl shadow-green-500/20 transition-all hover:-translate-y-1"
                                >
                                    <Phone className="w-5 h-5 mr-3" /> Fale conosco no WhatsApp
                                </a>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative z-10 hidden lg:block">
                            <div className="absolute inset-0 bg-[#0052cc] rounded-[3rem] rotate-3 shadow-inner"></div>
                            <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white group">
                                <img
                                    src="/propulsao/licenciado_section.png"
                                    alt="Licenciado Propulsão"
                                    className="w-full object-cover h-[620px] object-center transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0052cc]/40 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-400 font-bold text-sm">
                <p>Propulsão Palmilhas Biomecânicas LTDA. © {new Date().getFullYear()}. Todos os direitos reservados.</p>
                <p className="text-xs font-normal mt-2">Tecnologia fornecida por Axiom Sistemas Clínicos</p>
            </footer>
        </div>
    );
}
