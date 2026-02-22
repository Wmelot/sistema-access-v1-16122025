"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gauge, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ZenHeader() {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4 px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Voltar">
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 font-bold text-lg text-primary mr-auto">
                    <Gauge className="h-5 w-5" />
                    <span>Laboratório de Biomecânica</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden md:inline-block">Alternar Avaliação:</span>
                    <Select onValueChange={(v) => console.log("Navigate to", v)}>
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                            <SelectValue placeholder="Palmilhas e Baropodometria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="palmilhas">Palmilhas e Baropodometria</SelectItem>
                            <SelectItem value="corrida">Análise de Corrida 2D</SelectItem>
                            <SelectItem value="bike">Bike Fit Pro</SelectItem>
                            <SelectItem value="isocinetico">Dinamometria Isocinética</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </header>
    );
}
