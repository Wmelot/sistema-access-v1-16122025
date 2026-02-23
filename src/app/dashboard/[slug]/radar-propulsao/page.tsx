import React from 'react';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MapPin, Target, Map, Activity } from "lucide-react";

export const metadata = {
    title: "Radar Propulsão - Controle de Franquias",
};

export default async function RadarPropulsaoPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: leads, error } = await supabase
        .from("lead_search_history")
        .select("*")
        .order("searched_at", { ascending: false });

    if (error) {
        console.error("Erro ao carregar radar:", error);
    }

    // Agrupamento por CEP
    const cepCounts = (leads || []).reduce((acc: any, lead: any) => {
        acc[lead.cep] = (acc[lead.cep] || 0) + 1;
        return acc;
    }, {});

    const rankedCeps = Object.entries(cepCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10);

    return (
        <div className="flex-1 space-y-6 container py-6 animate-in fade-in duration-500">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-[#0052cc]" />
                    Radar Propulsão
                </h2>
                <p className="text-muted-foreground font-medium">
                    Dossiê estratégico de todas as regiões que buscaram por Palmilhas 3D e não encontraram um parceiro num raio de 50km.
                </p>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Termômetro */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-2 border-blue-100 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader className="bg-[#0052cc] text-white">
                            <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                <Target className="w-5 h-5" /> Regiões Mais Quentes
                            </CardTitle>
                            <CardDescription className="text-blue-100">Para onde focar expansão</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {rankedCeps.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Nenhum dado capturado ainda.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {rankedCeps.map(([cep, count]: any, idx) => (
                                        <li key={cep} className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-50 shadow-sm">
                                            <span className="font-bold text-slate-700 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0052cc] flex items-center justify-center text-xs">{idx + 1}</span>
                                                CEP: {cep}
                                            </span>
                                            <span className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-sm">
                                                {count} buscas
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-slate-200 shadow-md rounded-3xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                <Map className="w-5 h-5 text-slate-500" /> Dica de Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 text-sm text-slate-600 leading-relaxed font-medium">
                            Use os CEPs listados acima para direcionar anúncios segmentados de capitação de parceiros B2B no Facebook Ads/Google ou para prospectar ativamente clínicas de fisioterapia nas redondezas destes CEPs, com a promessa de que <strong>já existem pacientes procurando pela tecnologia naquela região específica.</strong>
                        </CardContent>
                    </Card>
                </div>

                {/* Linha do Tempo */}
                <div className="lg:col-span-2">
                    <Card className="border-slate-200 shadow-md rounded-3xl">
                        <CardHeader className="border-b border-slate-100 pb-6">
                            <CardTitle className="text-xl font-bold text-slate-800">Linha do Tempo de Buscas Frustradas</CardTitle>
                            <CardDescription>Registro em tempo real de pacientes que queriam palmilhas mas não foram atendidos por falta de clínica num raio de 50km.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-xl border-b border-slate-200">Data e Hora</th>
                                            <th className="px-6 py-4 border-b border-slate-200">CEP Buscado</th>
                                            <th className="px-6 py-4 border-b border-slate-200">Coordenada Geográfica</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {leads?.length === 0 && (
                                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">O radar está vazio. Ninguém foi perdido ainda.</td></tr>
                                        )}
                                        {leads?.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                                    {format(new Date(lead.searched_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-[#0052cc]">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" /> {lead.cep}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {lead.latitude ? `${lead.latitude.toFixed(4)}, ${lead.longitude.toFixed(4)}` : 'Não resolvido via Maps'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
