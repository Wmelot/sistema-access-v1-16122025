import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ASSESSMENTS, AssessmentType, AssessmentDefinition } from "@/app/dashboard/[slug]/patients/components/assessments/definitions";
import { cn } from "@/lib/utils";

interface RapidAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessmentType: string;
    onSave: (data: { type: string, answers: any, score: any }) => void;
}

export function RapidAssessmentModal({ isOpen, onClose, assessmentType, onSave }: RapidAssessmentModalProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});

    // Find definition based on title or ID mapping (simplistic mapping for now)
    // The Select in PalmilhaAccessForm returns the TITLE string (e.g., "LEFS ...")
    // We need to find the KEY in ASSESSMENTS that matches this title
    const definitionEntry = useMemo(() => {
        if (!assessmentType || assessmentType === 'none') return null;
        // Direct lookup by ID
        const def = ASSESSMENTS[assessmentType as AssessmentType];
        return def ? [assessmentType, def] : null;
    }, [assessmentType]);

    const definition = definitionEntry ? (definitionEntry[1] as AssessmentDefinition) : null;
    const assessmentKey = definitionEntry ? (definitionEntry[0] as string) : null;

    if (!isOpen) return null;

    const handleAnswer = (qId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const handleSave = () => {
        if (!definition) return;
        const score = definition.calculateScore(answers);
        onSave({
            type: assessmentKey || assessmentType,
            answers,
            score
        });
        onClose();
    };

    if (!definition) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Erro</DialogTitle>
                        <DialogDescription>Questionário não encontrado ou definição ausente para: {assessmentType}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={onClose}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <DialogContent
                className="!fixed !top-[70px] !left-auto !right-[20px] !translate-x-0 !translate-y-0 !w-[calc(100vw-320px)] !max-w-[1600px] !h-[calc(100vh-90px)] flex flex-col z-[200] p-0 overflow-hidden outline-none bg-white shadow-2xl rounded-xl border border-slate-200"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <div className="flex flex-col h-full p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {definition.title}
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {definition.instruction}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {definition.questions.map((q) => (
                                <div key={q.id} className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <Label className="text-sm font-medium leading-relaxed block">
                                        {q.text}
                                    </Label>

                                    {q.type === 'scale' && q.options && (
                                        <div className="space-y-2">
                                            <RadioGroup
                                                value={String(answers[q.id] !== undefined ? answers[q.id] : "")}
                                                onValueChange={(v) => handleAnswer(q.id, Number(v))}
                                                className="flex flex-col space-y-2"
                                            >
                                                {q.options.map((opt) => (
                                                    <div key={opt.value}
                                                        onClick={() => handleAnswer(q.id, Number(opt.value))}
                                                        className={cn(
                                                            "flex items-center justify-between space-x-3 border p-3 rounded-md cursor-pointer transition-all hover:bg-slate-50 active:scale-[0.99]",
                                                            answers[q.id] === opt.value ? "bg-purple-50 border-purple-500 ring-1 ring-purple-500 shadow-sm" : "border-slate-200 bg-white"
                                                        )}>
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <RadioGroupItem value={String(opt.value)} id={`${q.id}-${opt.value}`} className="border-slate-300 text-purple-600" />
                                                            <Label htmlFor={`${q.id}-${opt.value}`} className="cursor-pointer flex-1 text-sm font-medium text-slate-700 leading-tight">
                                                                {opt.label}
                                                            </Label>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded min-w-[24px] text-center border border-slate-200">
                                                            {opt.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    )}

                                    {q.type === 'mcq' && q.options && (
                                        <div className="space-y-2">
                                            <RadioGroup
                                                value={String(answers[q.id] !== undefined ? answers[q.id] : "")}
                                                onValueChange={(v) => handleAnswer(q.id, Number(v))}
                                                className="space-y-1"
                                            >
                                                {q.options.map((opt) => (
                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={String(opt.value)} id={`${q.id}-${opt.value}`} />
                                                        <Label htmlFor={`${q.id}-${opt.value}`} className="cursor-pointer text-sm font-normal">
                                                            {opt.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    )}

                                    {q.type === 'vas' && (
                                        <div className="px-2 pt-4 pb-2">
                                            <Slider
                                                defaultValue={[0]}
                                                max={q.max || 10}
                                                step={1}
                                                value={[answers[q.id] || 0]}
                                                onValueChange={(v) => handleAnswer(q.id, v[0])}
                                                className="mb-6"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground -mt-4">
                                                <span>{q.minLabel || 'Mínimo'}</span>
                                                <span className="font-bold text-lg text-primary">{answers[q.id] || 0}</span>
                                                <span>{q.maxLabel || 'Máximo'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {q.type === 'binary' && q.options && (
                                        <div className="flex gap-4">
                                            {q.options.map((opt) => (
                                                <Button
                                                    key={opt.value}
                                                    type="button"
                                                    variant={answers[q.id] === opt.value ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleAnswer(q.id, opt.value)}
                                                    className={cn(
                                                        "flex-1",
                                                        answers[q.id] === opt.value && "bg-purple-600 hover:bg-purple-700"
                                                    )}
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                            Salvar Avaliação Basal
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
