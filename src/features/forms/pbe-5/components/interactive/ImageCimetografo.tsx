import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Point {
    id: string;
    label: string;
    x: number;
    y: number;
    color?: string;
}

interface Connection {
    from: string;
    to: string;
    color?: string;
}

interface Angle {
    p1: string;
    vertex: string;
    p2: string;
    label: string;
}

interface LevelCheck {
    p1: string;
    p2: string;
}

interface PhotoAnalyzerProps {
    src: string;
    mode: 'posture_anterior' | 'posture_posterior' | 'posture_lateral' | 'hindfoot' | 'lower_limb_anterior' | 'lower_limb_posterior';
    onUpdate?: (points: Point[]) => void;
}

export function PhotoAnalyzer({ src, mode, onUpdate }: PhotoAnalyzerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const zoomCanvasRef = useRef<HTMLCanvasElement>(null);

    const [points, setPoints] = useState<Point[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [angles, setAngles] = useState<Angle[]>([]);
    const [levelChecks, setLevelChecks] = useState<LevelCheck[]>([]);

    const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);

    // Initialize points based on mode
    useEffect(() => {
        if (mode === 'posture_anterior' && points.length === 0) {
            setPoints([
                { id: 'acromio_d', label: 'Acrômio D', x: 30, y: 30 },
                { id: 'acromio_e', label: 'Acrômio E', x: 70, y: 30 },
                { id: 'eias_d', label: 'EIAS D', x: 35, y: 60 },
                { id: 'eias_e', label: 'EIAS E', x: 65, y: 60 },
                { id: 'joelho_d', label: 'Joelho D', x: 38, y: 80 },
                { id: 'joelho_e', label: 'Joelho E', x: 62, y: 80 },
                { id: 'tornozelo_d', label: 'Tornozelo D', x: 40, y: 95 },
                { id: 'tornozelo_e', label: 'Tornozelo E', x: 60, y: 95 },
            ]);
            setConnections([
                { from: 'acromio_d', to: 'acromio_e' },
                { from: 'eias_d', to: 'eias_e' },
                { from: 'joelho_d', to: 'joelho_e' },
                { from: 'tornozelo_d', to: 'tornozelo_e' },
                { from: 'eias_d', to: 'joelho_d' },
                { from: 'eias_e', to: 'joelho_e' },
                { from: 'joelho_d', to: 'tornozelo_d' },
                { from: 'joelho_e', to: 'tornozelo_e' },
            ]);
            setAngles([
                { p1: 'eias_d', vertex: 'joelho_d', p2: 'tornozelo_d', label: 'Ângulo Joelho D' },
                { p1: 'eias_e', vertex: 'joelho_e', p2: 'tornozelo_e', label: 'Ângulo Joelho E' }
            ]);
            setLevelChecks([
                { p1: 'acromio_d', p2: 'acromio_e' },
                { p1: 'eias_d', p2: 'eias_e' },
                { p1: 'joelho_d', p2: 'joelho_e' },
                { p1: 'tornozelo_d', p2: 'tornozelo_e' }
            ]);
        } else if (mode === 'posture_posterior' && points.length === 0) {
            setPoints([
                { id: 'acromio_d', label: 'Acrômio D', x: 70, y: 30 },
                { id: 'acromio_e', label: 'Acrômio E', x: 30, y: 30 },
                { id: 'eips_d', label: 'EIPS D', x: 65, y: 60 },
                { id: 'eips_e', label: 'EIPS E', x: 35, y: 60 },
            ]);
            setConnections([
                { from: 'acromio_d', to: 'acromio_e' },
                { from: 'eips_d', to: 'eips_e' },
                { from: 'acromio_d', to: 'eips_d' },
                { from: 'acromio_e', to: 'eips_e' }
            ]);
            setLevelChecks([
                { p1: 'acromio_d', p2: 'acromio_e' },
                { p1: 'eips_d', p2: 'eips_e' }
            ]);
        } else if (mode === 'posture_lateral' && points.length === 0) {
            setPoints([
                { id: 'trago', label: 'Trago', x: 50, y: 15 },
                { id: 'acromio', label: 'Acrômio', x: 50, y: 30 },
                { id: 'trocanter', label: 'Trocanter', x: 50, y: 60 },
                { id: 'maleolo', label: 'Maléolo', x: 50, y: 95 },
            ]);
            setConnections([
                { from: 'trago', to: 'acromio' },
                { from: 'acromio', to: 'trocanter' },
                { from: 'trocanter', to: 'maleolo' },
            ]);
            setAngles([
                { p1: 'trago', vertex: 'acromio', p2: 'trocanter', label: 'Alinhamento Cervico-Torácico' },
                { p1: 'acromio', vertex: 'trocanter', p2: 'maleolo', label: 'Alinhamento Tronco-Membro' }
            ]);
        } else if (mode === 'lower_limb_anterior' && points.length === 0) {
            setPoints([
                { id: 'eias_d', label: 'EIAS D', x: 35, y: 40 },
                { id: 'eias_e', label: 'EIAS E', x: 65, y: 40 },
                { id: 'joelho_d', label: 'Joelho D', x: 38, y: 70 },
                { id: 'joelho_e', label: 'Joelho E', x: 62, y: 70 },
                { id: 'tornozelo_d', label: 'Tornozelo D', x: 40, y: 95 },
                { id: 'tornozelo_e', label: 'Tornozelo E', x: 60, y: 95 },
            ]);
            setConnections([
                { from: 'eias_d', to: 'eias_e' },
                { from: 'joelho_d', to: 'joelho_e' },
                { from: 'tornozelo_d', to: 'tornozelo_e' },
                { from: 'eias_d', to: 'joelho_d' },
                { from: 'eias_e', to: 'joelho_e' },
                { from: 'joelho_d', to: 'tornozelo_d' },
                { from: 'joelho_e', to: 'tornozelo_e' },
            ]);
            setAngles([
                { p1: 'eias_d', vertex: 'joelho_d', p2: 'tornozelo_d', label: 'Ângulo Joelho D' },
                { p1: 'eias_e', vertex: 'joelho_e', p2: 'tornozelo_e', label: 'Ângulo Joelho E' }
            ]);
            setLevelChecks([
                { p1: 'eias_d', p2: 'eias_e' },
                { p1: 'joelho_d', p2: 'joelho_e' },
                { p1: 'tornozelo_d', p2: 'tornozelo_e' }
            ]);
        } else if (mode === 'lower_limb_posterior' && points.length === 0) {
            setPoints([
                { id: 'eips_d', label: 'EIPS D', x: 65, y: 40 },
                { id: 'eips_e', label: 'EIPS E', x: 35, y: 40 },
                { id: 'joelho_d', label: 'Joelho Post D', x: 62, y: 70 },
                { id: 'joelho_e', label: 'Joelho Post E', x: 38, y: 70 },
                { id: 'calcaneo_d', label: 'Calcâneo D', x: 60, y: 95 },
                { id: 'calcaneo_e', label: 'Calcâneo E', x: 40, y: 95 },
            ]);
            setConnections([
                { from: 'eips_d', to: 'eips_e' },
                { from: 'joelho_d', to: 'joelho_e' },
                { from: 'calcaneo_d', to: 'calcaneo_e' },
                { from: 'eips_d', to: 'joelho_d' },
                { from: 'eips_e', to: 'joelho_e' },
                { from: 'joelho_d', to: 'calcaneo_d' },
                { from: 'joelho_e', to: 'calcaneo_e' },
            ]);
            setLevelChecks([
                { p1: 'eips_d', p2: 'eips_e' },
                { p1: 'joelho_d', p2: 'joelho_e' },
                { p1: 'calcaneo_d', p2: 'calcaneo_e' }
            ]);
        } else if (mode === 'hindfoot' && points.length === 0) {
            setPoints([
                { id: 'panturrilha', label: 'Centro da Panturrilha', x: 50, y: 55 },
                { id: 'talus', label: 'Tálus', x: 50, y: 75 },
                { id: 'calcaneo', label: 'Centro do Calcâneo', x: 50, y: 90 },
            ]);
            setConnections([
                { from: 'panturrilha', to: 'talus' },
                { from: 'talus', to: 'calcaneo' },
            ]);
            setAngles([
                { p1: 'panturrilha', vertex: 'talus', p2: 'calcaneo', label: 'Ângulo de Retropé' }
            ]);
        }
    }, [mode, points.length]);

    // Redraw connections and angles
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current || !imageLoaded) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Helper to get pixel coordinates
        const getPx = (percent: number, dimension: number) => (percent / 100) * dimension;
        const getPoint = (id: string) => points.find(p => p.id === id);

        // Draw connections
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ef4444'; // Red line

        connections.forEach(conn => {
            const p1 = getPoint(conn.from);
            const p2 = getPoint(conn.to);
            if (p1 && p2) {
                ctx.beginPath();
                ctx.moveTo(getPx(p1.x, rect.width), getPx(p1.y, rect.height));
                ctx.lineTo(getPx(p2.x, rect.width), getPx(p2.y, rect.height));
                ctx.stroke();
            }
        });

        // Calculate and Draw Level Checks (Horizontal Alignment)
        ctx.setLineDash([5, 5]);
        levelChecks.forEach(lvl => {
            const p1 = getPoint(lvl.p1);
            const p2 = getPoint(lvl.p2);
            if (p1 && p2) {
                const x1 = getPx(p1.x, rect.width);
                const y1 = getPx(p1.y, rect.height);
                const x2 = getPx(p2.x, rect.width);
                const y2 = getPx(p2.y, rect.height);

                // Need horizontal line from center
                const cx = (x1 + x2) / 2;
                const cy = (y1 + y2) / 2;
                const width = Math.abs(x2 - x1) + 60;

                ctx.strokeStyle = '#94a3b8'; // slate-400
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - width / 2, cy);
                ctx.lineTo(cx + width / 2, cy);
                ctx.stroke();

                // Calculate tilt angle vs horizontal
                const angleRad = Math.atan2(Math.abs(y2 - y1), Math.abs(x2 - x1));
                let angleDeg = angleRad * (180 / Math.PI);

                // Find higher point
                const leftPoint = x1 < x2 ? p1 : p2;
                const rightPoint = x1 < x2 ? p2 : p1;
                const higherMsg = leftPoint.y < rightPoint.y ? 'Elev. Esq' : 'Elev. Dir';

                ctx.font = 'bold 10px Inter';
                if (angleDeg > 1.0) {
                    ctx.fillStyle = '#ef4444'; // Red for tilt
                    const txt = `${angleDeg.toFixed(1)}° (${higherMsg})`;

                    // Box
                    const tw = ctx.measureText(txt).width;
                    ctx.fillStyle = '#fef2f2';
                    ctx.beginPath();
                    ctx.roundRect(cx - tw / 2 - 4, cy - 16, tw + 8, 14, 4);
                    ctx.fill();

                    ctx.fillStyle = '#ef4444';
                    ctx.fillText(txt, cx - tw / 2, cy - 5);
                } else {
                    ctx.fillStyle = '#10b981'; // Green for level
                    const txt = "Alinhado";
                    const tw = ctx.measureText(txt).width;
                    ctx.fillText(txt, cx - tw / 2, cy - 5);
                }
            }
        });
        ctx.setLineDash([]);

        // Calculate and Draw Angles
        angles.forEach(angleInfo => {
            if ((angleInfo as any).isLineIntersection) {
                // Special case for Hindfoot (Angle between two lines)
                const a = getPoint((angleInfo as any).p1);
                const b = getPoint((angleInfo as any).line1);
                const c = getPoint((angleInfo as any).line2);
                const d = getPoint((angleInfo as any).p2);
                if (a && b && c && d) {
                    const a1 = Math.atan2(b.y - a.y, b.x - a.x);
                    const a2 = Math.atan2(d.y - c.y, d.x - c.x);
                    let ang = Math.abs((a1 - a2) * (180 / Math.PI));
                    // Normalize to sharp angle
                    if (ang > 180) ang = 360 - ang;
                    if (ang > 90) ang = 180 - ang;

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 12px Inter';
                    ctx.fillText(`${ang.toFixed(1)}°`, getPx(c.x, rect.width) + 15, getPx(c.y, rect.height));
                }
            } else {
                // Standard 3-point angle
                const p1 = getPoint(angleInfo.p1);
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2);

                if (p1 && vertex && p2) {
                    const x1 = getPx(p1.x, rect.width), y1 = getPx(p1.y, rect.height);
                    const vx = getPx(vertex.x, rect.width), vy = getPx(vertex.y, rect.height);
                    const x2 = getPx(p2.x, rect.width), y2 = getPx(p2.y, rect.height);

                    const angle1 = Math.atan2(y1 - vy, x1 - vx);
                    const angle2 = Math.atan2(y2 - vy, x2 - vx);

                    let angleDeg = Math.abs(angle1 - angle2) * (180 / Math.PI);
                    if (angleDeg > 180) angleDeg = 360 - angleDeg;

                    // Draw arc
                    ctx.beginPath();
                    ctx.arc(vx, vy, 20, Math.min(angle1, angle2), Math.max(angle1, angle2));
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Draw Text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Inter';

                    // Background pill for text
                    const txt = `${Math.round(angleDeg)}°`;
                    const tw = ctx.measureText(txt).width;
                    let tx = vx + 25;
                    let ty = vy - 10;

                    ctx.fillStyle = '#2563eb'; // blue bg
                    ctx.beginPath();
                    ctx.roundRect(tx - 4, ty - 12, tw + 8, 16, 4);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(txt, tx, ty);
                }
            }
        });

    }, [points, connections, angles, imageLoaded]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggingPoint(id);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        // Track mouse position for zoom
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setMousePos({ x: mx, y: my });

        // Update zoom canvas
        updateZoomLens(mx, my);

        // Update point position if dragging
        if (draggingPoint) {
            let x = (mx / rect.width) * 100;
            let y = (my / rect.height) * 100;

            // Constrain 0-100
            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            setPoints(prev => {
                const updated = prev.map(p => p.id === draggingPoint ? { ...p, x, y } : p);
                if (onUpdate) onUpdate(updated);
                return updated;
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDraggingPoint(null);
    };

    const updateZoomLens = (x: number, y: number) => {
        if (!imageRef.current || !zoomCanvasRef.current || !containerRef.current || !draggingPoint) return;

        const img = imageRef.current;
        const zoom = zoomCanvasRef.current;
        const ctx = zoom.getContext('2d');
        if (!ctx) return;

        // Image natural dimensions vs displayed dimensions
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;

        const srcX = x * scaleX;
        const srcY = y * scaleY;

        const zoomLevel = 3;
        const lensSize = 50; // Radius in src pixels to capture

        // Clear zoom canvas
        ctx.clearRect(0, 0, zoom.width, zoom.height);

        // Disable smoothing for pixelated exact precision
        ctx.imageSmoothingEnabled = false;

        // Draw zoomed portion
        ctx.drawImage(
            img,
            srcX - lensSize, srcY - lensSize, lensSize * 2, lensSize * 2,
            0, 0, zoom.width, zoom.height
        );

        // Draw crosshair
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(zoom.width / 2, 0);
        ctx.lineTo(zoom.width / 2, zoom.height);
        ctx.moveTo(0, zoom.height / 2);
        ctx.lineTo(zoom.width, zoom.height / 2);
        ctx.stroke();
    };

    const isDragging = draggingPoint !== null;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 select-none touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Background Image */}
            <img
                ref={imageRef}
                src={src}
                alt="Postural Analysis"
                className="w-full h-full object-contain pointer-events-none"
                onLoad={() => setImageLoaded(true)}
                crossOrigin="anonymous"
            />

            {/* Lines and Angles Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-10"
            />

            {/* Draggable Points */}
            <div className="absolute inset-0 z-20">
                {points.map(p => (
                    <div
                        key={p.id}
                        onPointerDown={(e) => handlePointerDown(e, p.id)}
                        className={cn(
                            "absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-125 z-30",
                            draggingPoint === p.id ? "bg-red-500 border-white scale-150 z-50 shadow-lg shadow-red-500/50" : "bg-white border-red-500 shadow-sm"
                        )}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    >
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />

                        {/* Tooltip Label */}
                        {draggingPoint !== p.id && (
                            <div className="absolute top-6 whitespace-nowrap bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold pointer-events-none">
                                {p.label}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Magnification Zoom Lens */}
            {isDragging && (
                <div
                    className="absolute z-50 overflow-hidden rounded-2xl border-4 border-white shadow-2xl bg-slate-900"
                    style={{
                        left: 10, // fixed to top left to avoid blocking cursor
                        top: 10,
                        width: 150,
                        height: 150
                    }}
                >
                    <canvas
                        ref={zoomCanvasRef}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 inset-x-0 text-center text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">
                        {points.find(p => p.id === draggingPoint)?.label}
                    </div>
                </div>
            )}
        </div>
    );
}
