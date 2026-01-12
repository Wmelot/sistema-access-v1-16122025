
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScoreDisplayWidgetProps {
    title: string;
    value: number;
    max?: number;
    min?: number;
    color?: string; // hex or tailwind class prefix? assuming hex or css var for now, or predefined variants
    displayMode: 'ring' | 'bar' | 'card';
    icon?: React.ReactNode;
    sticky?: boolean;
    description?: string;
}

export const ScoreDisplayWidget = ({
    title,
    value,
    max = 100,
    min = 0,
    color = "hsl(var(--primary))",
    displayMode = 'card',
    icon,
    sticky = false,
    description
}: ScoreDisplayWidgetProps) => {

    // Normalize value percentage
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    const stickyClasses = sticky
        ? "sticky top-4 z-50 shadow-xl border-primary/20 animate-in fade-in slide-in-from-top-4"
        : "";

    if (displayMode === 'ring') {
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <Card className={cn("overflow-hidden backdrop-blur-sm bg-white/90", stickyClasses)}>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 flex items-center justify-center">
                        {/* Background Circle */}
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
                            <circle
                                className="text-muted/20"
                                strokeWidth="8"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="36"
                                cy="36"
                            />
                            {/* Progress Circle */}
                            <circle
                                className="transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                stroke={color}
                                fill="transparent"
                                r={radius}
                                cx="36"
                                cy="36"
                            />
                        </svg>
                        <span className="absolute text-sm font-bold">{Math.round(value)}</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            {icon && <span className="text-muted-foreground">{icon}</span>}
                            {title}
                        </h4>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (displayMode === 'bar') {
        return (
            <Card className={cn("overflow-hidden backdrop-blur-sm bg-white/90", stickyClasses)}>
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            {icon && <span className="text-muted-foreground">{icon}</span>}
                            {title}
                        </h4>
                        <span className="text-lg font-bold" style={{ color }}>{Math.round(value)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" indicatorColor={color} />
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </CardContent>
            </Card>
        );
    }

    // Default: Card (Big Number)
    return (
        <Card className={cn("text-center backdrop-blur-sm bg-white/90", stickyClasses)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex justify-center items-center gap-2">
                    {icon} {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold tracking-tighter" style={{ color }}>
                    {Math.round(value)}
                </div>
                {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
            </CardContent>
        </Card>
    );
};
