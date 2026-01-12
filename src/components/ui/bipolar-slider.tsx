"use client";

import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BipolarSliderProps {
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
}

export function BipolarSlider({ value, onChange, min = -5, max = 5 }: BipolarSliderProps) {
    const getColor = (v: number) => {
        if (v < 0) return "bg-red-500 hover:bg-red-600";
        if (v > 0) return "bg-green-500 hover:bg-green-600";
        return "bg-slate-500";
    };

    return (
        <div className="flex items-center gap-4 w-full">
            <span className="text-xs font-bold text-red-400 w-4 text-right">{min}</span>
            <Slider
                min={min}
                max={max}
                step={1}
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
                className={cn("flex-1", value < 0 ? "text-red-500" : "text-green-500")}
            />
            <span className="text-xs font-bold text-green-400 w-4">{max}</span>

            <Badge className={cn("w-12 justify-center", getColor(value))}>
                {value > 0 ? `+${value}` : value}
            </Badge>
        </div>
    );
}
