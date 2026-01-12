
import React, { useState, useEffect } from 'react';

// Helper for Smoother Dragging
export const DraggablePoint = ({ point, index, field, isPreview, onCommit, isSelected, onToggleSelect }: { point: any, index: number, field: any, isPreview: boolean, onCommit: (i: number, x: number, y: number) => void, isSelected: boolean, onToggleSelect: () => void }) => {
    const [pos, setPos] = useState({ x: point.x, y: point.y });
    const [isDragging, setIsDragging] = useState(false);

    // Sync state with props when not dragging
    useEffect(() => {
        if (!isDragging) {
            setPos({ x: point.x, y: point.y });
        }
    }, [point.x, point.y, isDragging]);

    const scale = 1;
    const extraX = 0;
    const extraY = 0;
    const offset = 0;

    const percentX = pos.x * scale + offset;
    const percentY = pos.y * scale + offset;

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isPreview) return;

        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        setIsDragging(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startPointX = pos.x;
        const startPointY = pos.y;

        const container = target.parentElement?.getBoundingClientRect();
        if (!container || container.width === 0) return;

        let finalX = startPointX;
        let finalY = startPointY;

        const onMove = (moveEvent: PointerEvent) => {
            const deltaPixelX = moveEvent.clientX - startX;
            const deltaPixelY = moveEvent.clientY - startY;

            const deltaPercentX = (deltaPixelX / container.width) * 100;
            const deltaPercentY = (deltaPixelY / container.height) * 100;

            finalX = startPointX + (deltaPercentX / scale);
            finalY = startPointY + (deltaPercentY / scale);

            setPos({ x: finalX, y: finalY });
        };

        const onUp = (upEvent: PointerEvent) => {
            setIsDragging(false);
            target.releasePointerCapture(upEvent.pointerId);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            onCommit(index, finalX, finalY);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    return (
        <div
            className={`absolute w-6 h-6 flex items-center justify-center cursor-pointer z-10 ${!isPreview ? 'cursor-move' : ''} ${isDragging ? 'scale-125 z-50' : ''}`}
            style={{ left: `calc(${percentX}% + ${extraX}px)`, top: `calc(${percentY}% + ${extraY}px)`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) onToggleSelect();
            }}
            title={!isPreview ? `${point.label || 'Ponto'} (Arraste para mover)` : point.label}
        >
            {isSelected ? (
                <div className="relative flex items-center justify-center w-20 h-20 pointer-events-none">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20 animate-ping duration-[3000ms]"></span>
                    <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-500 opacity-40 animate-ping delay-300 duration-[3000ms]"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 shadow-lg ring-2 ring-white z-20 pointer-events-auto"></span>
                </div>
            ) : (
                <div className={`w-4 h-4 rounded-full border-2 border-red-600 bg-transparent ring-1 ring-white/70 shadow-sm hover:bg-red-50 transition-colors ${!isPreview ? 'bg-white/20 ring-2 ring-yellow-400' : ''}`} />
            )}
        </div>
    );
};
