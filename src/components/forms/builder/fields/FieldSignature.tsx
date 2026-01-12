
import React, { useRef, useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface FieldSignatureProps {
    field: any;
    value?: string;
    onChange?: (val: string) => void;
    isPreview: boolean;
}

export const FieldSignature = ({ field, value, onChange, isPreview }: FieldSignatureProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Resize canvas on mount/resize
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                // Save context before resize if needed? No, resize clears it usually.
                // We might want to redraw the image if value exists.
                const rect = container.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = 160; // Fixed height or configurable?

                // If value exists, load it
                if (value) {
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.src = value;
                    img.onload = () => {
                        ctx?.drawImage(img, 0, 0);
                    }
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [value]); // careful with dependency on value, might cause flicker

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isPreview) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && onChange) {
            canvas.toBlob((blob) => {
                // We typically save as DataURL for simplicity in this builder context
                const dataUrl = canvas.toDataURL('image/png');
                onChange(dataUrl);
            });
        }
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.beginPath(); // Reset path
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isPreview) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearSignature = () => {
        if (!isPreview) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onChange && onChange('');
        }
    };

    return (
        <div className="space-y-2" ref={containerRef}>
            <div className="flex items-center justify-between">
                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                {isPreview && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSignature}
                        className="h-6 text-xs text-muted-foreground hover:text-destructive"
                    >
                        <Eraser className="w-3 h-3 mr-1" />
                        Limpar
                    </Button>
                )}
            </div>

            <div className={`border rounded-lg overflow-hidden relative bg-white ${!isPreview ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}>
                <canvas
                    ref={canvasRef}
                    className="w-full h-40 touch-none"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
                {!isPreview && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-sm font-medium select-none pointer-events-none">
                        Área de Assinatura
                    </div>
                )}
            </div>
        </div>
    );
};
