import React, { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createExercise } from "../actions/evolution-actions";
import { toast } from "sonner";

interface Exercise {
    id: string;
    name: string;
    category: string;
}

interface ExerciseSelectorProps {
    exercises: Exercise[];
    onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelector({ exercises, onSelect }: ExerciseSelectorProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Creation Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState("");
    const [newExerciseCategory, setNewExerciseCategory] = useState("Cinesioterapia");
    const [isCreating, setIsCreating] = useState(false);

    // Filter exercises based on search query manually if needed, 
    // but Command usually handles basic filtering. 
    // However, we want to capture the search query to suggest creation.

    const handleCreateExercise = async () => {
        if (!newExerciseName) return;
        setIsCreating(true);

        const result = await createExercise({
            name: newExerciseName,
            category: newExerciseCategory,
            modality_type: 'Custom'
        });

        if (result.success && result.data) {
            toast.success(`Exercício '${result.data.name}' criado!`);
            onSelect(result.data); // Add to list immediately
            setOpen(false); // Close popover
            setShowCreateModal(false); // Close modal
        } else {
            toast.error("Erro ao criar exercício");
        }
        setIsCreating(false);
    };

    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value
                            ? exercises.find((ex) => ex.name === value)?.name
                            : "Buscar exercício..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Digite o nome..."
                            onValueChange={(val) => {
                                setSearchQuery(val);
                            }}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 text-center text-sm">
                                    <p className="mb-2 text-slate-500">Não encontrado.</p>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full font-bold text-indigo-600"
                                        onClick={() => {
                                            setNewExerciseName(searchQuery);
                                            setShowCreateModal(true);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Criar "{searchQuery}"
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup heading="Exercícios">
                                {exercises.map((exercise) => (
                                    <CommandItem
                                        key={exercise.id}
                                        value={exercise.name}
                                        onSelect={(currentValue) => {
                                            setValue(currentValue === value ? "" : currentValue);
                                            onSelect(exercise);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === exercise.name ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {exercise.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* MODAL DE CRIAÇÃO RÁPIDA */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Novo Exercício</DialogTitle>
                        <DialogDescription>
                            Adicione "{newExerciseName}" à sua base de dados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Categoria
                            </Label>
                            <Select onValueChange={setNewExerciseCategory} defaultValue={newExerciseCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cinesioterapia">Cinesioterapia</SelectItem>
                                    <SelectItem value="Eletroterapia">Eletroterapia</SelectItem>
                                    <SelectItem value="Fotobiomodulação">Fotobiomodulação</SelectItem>
                                    <SelectItem value="Terapia Manual">Terapia Manual</SelectItem>
                                    <SelectItem value="Pilates">Pilates</SelectItem>
                                    <SelectItem value="Recovery">Recovery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleCreateExercise} disabled={isCreating}>
                            {isCreating ? "Salvando..." : "Salvar e Adicionar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
