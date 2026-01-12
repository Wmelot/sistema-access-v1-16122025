import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Trophy, TrendingUp } from 'lucide-react';

export interface ScoreDisplayProps {
    title: string;
    value: number; // The calculated value
    maxValue?: number;
    displayMode?: 'ring' | 'bar' | 'card';
    sticky?: boolean;
    color?: string; // hex or tailwind class? Let's use Tailwind color name like 'blue', 'green'
    icon?: React.ReactNode;
}

export function ScoreDisplayWidget({ title, value, maxValue = 100, displayMode = 'card', sticky = false, color = 'blue', icon }: ScoreDisplayProps) {

    // Color mapping
    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', fill: 'bg-blue-600', stroke: '#2563eb' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', fill: 'bg-green-600', stroke: '#16a34a' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', fill: 'bg-red-600', stroke: '#dc2626' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', fill: 'bg-purple-600', stroke: '#9333ea' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', fill: 'bg-orange-600', stroke: '#ea580c' },
    }[color] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-600', stroke: '#475569' };

    const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

    const Wrapper = sticky ? StickyWrapper : React.Fragment;
    const wrapperProps = sticky ? { className: "hidden lg:block fixed right-8 top-32 z-40 w-64 animate-in slide-in-from-right-8 duration-500" } : {};

    const Content = () => {
        if (displayMode === 'ring') {
            const radius = 30;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
                <Card className={cn("border shadow-sm", colorClasses.bg, colorClasses.border)}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
                            <div className={cn("text-2xl font-bold", colorClasses.text)}>{value} <span className="text-sm opacity-60">/ {maxValue}</span></div>
                        </div>
                        <div className="relative h-16 w-16 flex items-center justify-center">
                            <svg className="h-full w-full transform -rotate-90">
                                <circle
                                    className="text-white/50"
                                    strokeWidth="6"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="32"
                                    cy="32"
                                />
                                <circle
                                    className={cn("transition-all duration-1000 ease-out", colorClasses.text)}
                                    strokeWidth="6"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="32"
                                    cy="32"
                                />
                            </svg>
                            {icon && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 transform scale-75">{icon}</div>}
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (displayMode === 'bar') {
            return (
                <Card className={cn("border shadow-sm", colorClasses.bg, colorClasses.border)}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-semibold text-slate-700 flex items-center gap-2">
                                {icon || <Activity className="w-4 h-4" />}
                                {title}
                            </span>
                            <span className={cn("font-bold text-xl", colorClasses.text)}>{value}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-700 ease-out", colorClasses.fill)}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )
        }

        // Card Mode (Simple)
        return (
            <Card className={cn("border text-center overflow-hidden", colorClasses.bg, colorClasses.border)}>
                <div className={cn("h-1 w-full", colorClasses.fill)}></div>
                <CardContent className="p-4 flex flex-col items-center justify-center py-6">
                    {icon && <div className={cn("mb-2 p-2 rounded-full bg-white/50", colorClasses.text)}>{icon}</div>}
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</h4>
                    <span className={cn("text-4xl font-bold mt-1 tracking-tight", colorClasses.text)}>{value}</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Wrapper {...wrapperProps}>
            <Content />
        </Wrapper>
    );
}

const StickyWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={className}>
        {children}
    </div>
);
