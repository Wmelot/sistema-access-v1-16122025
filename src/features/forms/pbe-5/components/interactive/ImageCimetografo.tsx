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
    p2?: string; // Optional if we use deviation
    label: string;
    type?: 'standard' | 'deviation'; // standard=3 points, deviation=angle with vertical line at vertex
}

interface LevelCheck {
    p1: string;
    p2: string;
}

interface PhotoAnalyzerProps {
    src: string;
    mode: 'posture_anterior' | 'posture_posterior' | 'posture_lateral' | 'hindfoot' | 'lower_limb_anterior' | 'lower_limb_posterior';
    onUpdate?: (points: Point[]) => void;
    onFinalize?: (base64: string, points: Point[]) => void;
    savedPoints?: Point[];
}

export function PhotoAnalyzer({ src, mode, onUpdate, onFinalize, savedPoints }: PhotoAnalyzerProps) {
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
    const [hoveringPoint, setHoveringPoint] = useState<string | null>(null);

    // Initialize points based on mode or saved data
    useEffect(() => {
        let defaultPoints: Point[] = [];
        let newConnections: Connection[] = [];
        let newAngles: Angle[] = [];
        let newLevelChecks: LevelCheck[] = [];

        if (mode === 'posture_anterior') {
            defaultPoints = [
                { id: 'acromio_d', label: 'Acrômio D', x: 30, y: 30 },
                { id: 'acromio_e', label: 'Acrômio E', x: 70, y: 30 },
                { id: 'eias_d', label: 'EIAS D', x: 35, y: 60 },
                { id: 'eias_e', label: 'EIAS E', x: 65, y: 60 },
                { id: 'joelho_d', label: 'Joelho D', x: 38, y: 80 },
                { id: 'joelho_e', label: 'Joelho E', x: 62, y: 80 },
                { id: 'tornozelo_d', label: 'Tornozelo D', x: 40, y: 95 },
                { id: 'tornozelo_e', label: 'Tornozelo E', x: 60, y: 95 },
            ];
            newConnections = [
                { from: 'acromio_d', to: 'acromio_e' },
                { from: 'eias_d', to: 'eias_e' },
                { from: 'joelho_d', to: 'joelho_e' },
                { from: 'tornozelo_d', to: 'tornozelo_e' },
                { from: 'eias_d', to: 'joelho_d' },
                { from: 'eias_e', to: 'joelho_e' },
                { from: 'joelho_d', to: 'tornozelo_d' },
                { from: 'joelho_e', to: 'tornozelo_e' },
            ];
            newAngles = [
                { p1: 'eias_d', vertex: 'joelho_d', p2: 'tornozelo_d', label: 'Ângulo Joelho D' },
                { p1: 'eias_e', vertex: 'joelho_e', p2: 'tornozelo_e', label: 'Ângulo Joelho E' }
            ];
            newLevelChecks = [
                { p1: 'acromio_d', p2: 'acromio_e' },
                { p1: 'eias_d', p2: 'eias_e' },
                { p1: 'joelho_d', p2: 'joelho_e' },
                { p1: 'tornozelo_d', p2: 'tornozelo_e' }
            ];
        } else if (mode === 'posture_posterior') {
            defaultPoints = [
                { id: 'acromio_d', label: 'Acrômio D', x: 70, y: 30 },
                { id: 'acromio_e', label: 'Acrômio E', x: 30, y: 30 },
                { id: 'eips_d', label: 'EIPS D', x: 65, y: 60 },
                { id: 'eips_e', label: 'EIPS E', x: 35, y: 60 },
            ];
            newConnections = [
                { from: 'acromio_d', to: 'acromio_e' },
                { from: 'eips_d', to: 'eips_e' },
                { from: 'acromio_d', to: 'eips_d' },
                { from: 'acromio_e', to: 'eips_e' }
            ];
            newLevelChecks = [
                { p1: 'acromio_d', p2: 'acromio_e' },
                { p1: 'eips_d', p2: 'eips_e' }
            ];
        } else if (mode === 'posture_lateral') {
            defaultPoints = [
                { id: 'trago', label: 'Trago', x: 50, y: 15 },
                { id: 'acromio', label: 'Acrômio', x: 50, y: 30 },
                { id: 'trocanter', label: 'Trocanter', x: 50, y: 60 },
                { id: 'maleolo', label: 'Maléolo', x: 50, y: 95 },
            ];
            newConnections = [
                { from: 'trago', to: 'acromio' },
                { from: 'acromio', to: 'trocanter' },
                { from: 'trocanter', to: 'maleolo' },
            ];
            newAngles = [
                { p1: 'trago', vertex: 'acromio', p2: 'trocanter', label: 'Alinhamento Cervico-Torácico' },
                { p1: 'acromio', vertex: 'trocanter', p2: 'maleolo', label: 'Alinhamento Tronco-Membro' }
            ];
        } else if (mode === 'lower_limb_anterior') {
            defaultPoints = [
                { id: 'eias_d', label: 'EIAS D / Pelve', x: 35, y: 40 },
                { id: 'eias_e', label: 'EIAS E / Pelve', x: 65, y: 40 },
                { id: 'joelho_d', label: 'Joelho D', x: 38, y: 70 },
                { id: 'joelho_e', label: 'Joelho E', x: 62, y: 70 },
                { id: 'tornozelo_d', label: 'Tornozelo D', x: 40, y: 95 },
                { id: 'tornozelo_e', label: 'Tornozelo E', x: 60, y: 95 },
            ];
            newConnections = [
                { from: 'eias_d', to: 'eias_e' },
                { from: 'joelho_d', to: 'joelho_e' },
                { from: 'tornozelo_d', to: 'tornozelo_e' },
                { from: 'eias_d', to: 'joelho_d' },
                { from: 'eias_e', to: 'joelho_e' },
                { from: 'joelho_d', to: 'tornozelo_d' },
                { from: 'joelho_e', to: 'tornozelo_e' },
            ];
            newAngles = [
                { p1: 'eias_d', vertex: 'joelho_d', p2: 'tornozelo_d', label: 'Ângulo Joelho D' },
                { p1: 'eias_e', vertex: 'joelho_e', p2: 'tornozelo_e', label: 'Ângulo Joelho E' }
            ];
            newLevelChecks = [
                { p1: 'eias_d', p2: 'eias_e' },
                { p1: 'joelho_d', p2: 'joelho_e' },
                { p1: 'tornozelo_d', p2: 'tornozelo_e' }
            ];
        } else if (mode === 'lower_limb_posterior') {
            defaultPoints = [
                { id: 'eips_d', label: 'EIPS D / Pelve', x: 65, y: 40 },
                { id: 'eips_e', label: 'EIPS E / Pelve', x: 35, y: 40 },
                { id: 'joelho_d', label: 'Joelho Post D', x: 62, y: 70 },
                { id: 'joelho_e', label: 'Joelho Post E', x: 38, y: 70 },
                { id: 'calcaneo_d', label: 'Calcâneo D', x: 60, y: 95 },
                { id: 'calcaneo_e', label: 'Calcâneo E', x: 40, y: 95 },
            ];
            newConnections = [
                { from: 'eips_d', to: 'eips_e' },
                { from: 'joelho_d', to: 'joelho_e' },
                { from: 'calcaneo_d', to: 'calcaneo_e' },
                { from: 'eips_d', to: 'joelho_d' },
                { from: 'eips_e', to: 'joelho_e' },
                { from: 'joelho_d', to: 'calcaneo_d' },
                { from: 'joelho_e', to: 'calcaneo_e' },
            ];
            newLevelChecks = [
                { p1: 'eips_d', p2: 'eips_e' },
                { p1: 'joelho_d', p2: 'joelho_e' },
                { p1: 'calcaneo_d', p2: 'calcaneo_e' }
            ];
        } else if (mode === 'hindfoot') {
            defaultPoints = [
                { id: 'panturrilha', label: 'Centro da Panturrilha', x: 50, y: 55 },
                { id: 'talus', label: 'Tálus', x: 50, y: 75 },
                { id: 'calcaneo', label: 'Centro do Calcâneo', x: 50, y: 90 },
            ];
            newConnections = [
                { from: 'panturrilha', to: 'talus' },
                { from: 'talus', to: 'calcaneo' },
            ];
            newAngles = [
                { p1: 'talus', vertex: 'talus', p2: 'calcaneo', type: 'deviation', label: 'Eversão/Inversão' } // Changed to vertical deviation
            ];
        }

        setConnections(newConnections);
        setAngles(newAngles);
        setLevelChecks(newLevelChecks);

        // Somente aplicamos pontos default se não houver savedPoints
        if (savedPoints && savedPoints.length > 0) {
            setPoints(savedPoints);
        } else if (points.length === 0) {
            setPoints(defaultPoints);
        }
    }, [mode, savedPoints]);

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
            if (angleInfo.type === 'deviation') {
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2!);

                if (vertex && p2) {
                    const vx = getPx(vertex.x, rect.width), vy = getPx(vertex.y, rect.height);
                    const x2 = getPx(p2.x, rect.width), y2 = getPx(p2.y, rect.height);

                    // Vertical line fixed
                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(vx, vy);
                    ctx.lineTo(vx, vy - 100);
                    ctx.lineTo(vx, vy + 100);
                    ctx.strokeStyle = '#94a3b8';
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Calculate deviation angle from vertical
                    const angleRad = Math.atan2(x2 - vx, y2 - vy); // relative to vertical Y
                    let deviationDeg = angleRad * (180 / Math.PI);
                    deviationDeg = Math.abs(deviationDeg); // keep it positive for display

                    // Draw Text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Inter';
                    const txt = `${deviationDeg.toFixed(1)}°`;
                    const tw = ctx.measureText(txt).width;
                    let tx = vx + 15;
                    let ty = vy + 15;

                    ctx.fillStyle = '#2563eb'; // blue bg
                    ctx.beginPath();
                    ctx.roundRect(tx - 4, ty - 12, tw + 8, 16, 4);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(txt, tx, ty);
                }
            } else {
                // Standard 3-point angle
                const p1 = getPoint(angleInfo.p1);
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2!);

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

    // Function to generate a flattened base64 with the canvas drawings
    const finalize = () => {
        if (!onFinalize || !imageRef.current || !containerRef.current || !canvasRef.current) return;

        const img = imageRef.current;
        const container = containerRef.current;
        const mainCanvas = canvasRef.current;

        const offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth;
        offscreen.height = img.naturalHeight;
        const octx = offscreen.getContext('2d');
        if (!octx) return;

        const Iw = img.naturalWidth;
        const Ih = img.naturalHeight;
        const rect = container.getBoundingClientRect();
        const Cw = rect.width;
        const Ch = rect.height;

        // 1. Manually calculate 'object-contain' rendered size & offsets
        // This is necessary because img.getBoundingClientRect() returns the element box, not the pixels
        const k = Math.min(Cw / Iw, Ch / Ih);
        const Dw = Iw * k;
        const Dh = Ih * k;
        const offsetX = (Cw - Dw) / 2;
        const offsetY = (Ch - Dh) / 2;

        const s = Math.max(1, 1 / k); // Relative scale for lines

        const getNatX = (percent: number) => (((percent / 100) * Cw) - offsetX) / k;
        const getNatY = (percent: number) => (((percent / 100) * Ch) - offsetY) / k;

        const getPoint = (id: string) => points.find(p => p.id === id);

        // 1. Draw original image
        octx.fillStyle = '#ffffff';
        octx.fillRect(0, 0, Iw, Ih);
        octx.drawImage(img, 0, 0, Iw, Ih);

        // Connections
        octx.lineWidth = 2 * s;
        octx.strokeStyle = '#ef4444';
        connections.forEach(conn => {
            const p1 = getPoint(conn.from);
            const p2 = getPoint(conn.to);
            if (p1 && p2) {
                octx.beginPath();
                octx.moveTo(getNatX(p1.x), getNatY(p1.y));
                octx.lineTo(getNatX(p2.x), getNatY(p2.y));
                octx.stroke();
            }
        });

        // Level Checks
        octx.setLineDash([10 * s, 10 * s]);
        levelChecks.forEach(lvl => {
            const p1 = getPoint(lvl.p1);
            const p2 = getPoint(lvl.p2);
            if (p1 && p2) {
                const x1 = getNatX(p1.x);
                const y1 = getNatY(p1.y);
                const x2 = getNatX(p2.x);
                const y2 = getNatY(p2.y);

                const cx = (x1 + x2) / 2;
                const cy = (y1 + y2) / 2;
                const width = Math.abs(x2 - x1) + (60 * s);

                octx.strokeStyle = '#94a3b8'; // slate-400
                octx.lineWidth = 1.5 * s;
                octx.beginPath();
                octx.moveTo(cx - width / 2, cy);
                octx.lineTo(cx + width / 2, cy);
                octx.stroke();

                const angleRad = Math.atan2(Math.abs(y2 - y1), Math.abs(x2 - x1));
                let angleDeg = angleRad * (180 / Math.PI);

                const leftPoint = x1 < x2 ? p1 : p2;
                const rightPoint = x1 < x2 ? p2 : p1;
                const higherMsg = leftPoint.y < rightPoint.y ? 'Elev. Esq' : 'Elev. Dir';

                octx.font = `bold ${12 * s}px Inter`;
                if (angleDeg > 1.0) {
                    const txt = `${angleDeg.toFixed(1)}° (${higherMsg})`;
                    const tw = octx.measureText(txt).width;

                    octx.fillStyle = '#fef2f2';
                    octx.beginPath();
                    octx.roundRect(cx - tw / 2 - (4 * s), cy - (20 * s), tw + (8 * s), (18 * s), (4 * s));
                    octx.fill();

                    octx.fillStyle = '#ef4444';
                    octx.fillText(txt, cx - tw / 2, cy - (6 * s));
                } else {
                    const txt = "Alinhado";
                    const tw = octx.measureText(txt).width;
                    octx.fillStyle = '#10b981';
                    octx.fillText(txt, cx - tw / 2, cy - (6 * s));
                }
            }
        });
        octx.setLineDash([]);

        // Angles
        angles.forEach(angleInfo => {
            if (angleInfo.type === 'deviation') {
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2!);

                if (vertex && p2) {
                    const vx = getNatX(vertex.x), vy = getNatY(vertex.y);
                    const x2 = getNatX(p2.x), y2 = getNatY(p2.y);

                    octx.beginPath();
                    octx.setLineDash([5 * s, 5 * s]);
                    octx.moveTo(vx, vy);
                    octx.lineTo(vx, vy - (100 * s));
                    octx.lineTo(vx, vy + (100 * s));
                    octx.strokeStyle = '#94a3b8';
                    octx.lineWidth = 2 * s;
                    octx.stroke();
                    octx.setLineDash([]);

                    const angleRad = Math.atan2(x2 - vx, y2 - vy);
                    let deviationDeg = Math.abs(angleRad * (180 / Math.PI));

                    const txt = `${deviationDeg.toFixed(1)}°`;
                    octx.font = `bold ${14 * s}px Inter`;
                    const tw = octx.measureText(txt).width;
                    let tx = vx + (15 * s);
                    let ty = vy + (15 * s);

                    octx.fillStyle = '#2563eb';
                    octx.beginPath();
                    octx.roundRect(tx - (4 * s), ty - (14 * s), tw + (8 * s), (18 * s), (4 * s));
                    octx.fill();

                    octx.fillStyle = '#ffffff';
                    octx.fillText(txt, tx, ty);
                }
            } else {
                const p1 = getPoint(angleInfo.p1);
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2!);

                if (p1 && vertex && p2) {
                    const x1 = getNatX(p1.x), y1 = getNatY(p1.y);
                    const vx = getNatX(vertex.x), vy = getNatY(vertex.y);
                    const x2 = getNatX(p2.x), y2 = getNatY(p2.y);

                    const angle1 = Math.atan2(y1 - vy, x1 - vx);
                    const angle2 = Math.atan2(y2 - vy, x2 - vx);
                    let angleDeg = Math.abs(angle1 - angle2) * (180 / Math.PI);
                    if (angleDeg > 180) angleDeg = 360 - angleDeg;

                    octx.beginPath();
                    octx.arc(vx, vy, 20 * s, Math.min(angle1, angle2), Math.max(angle1, angle2));
                    octx.strokeStyle = '#fbbf24';
                    octx.lineWidth = 4 * s;
                    octx.stroke();

                    const txt = `${Math.round(angleDeg)}°`;
                    octx.font = `bold ${14 * s}px Inter`;
                    const tw = octx.measureText(txt).width;
                    let tx = vx + (25 * s);
                    let ty = vy - (10 * s);

                    octx.fillStyle = '#2563eb';
                    octx.beginPath();
                    octx.roundRect(tx - (4 * s), ty - (14 * s), tw + (8 * s), (18 * s), (4 * s));
                    octx.fill();

                    octx.fillStyle = '#ffffff';
                    octx.fillText(txt, tx, ty);
                }
            }
        });

        const base64 = offscreen.toDataURL('image/jpeg', 0.9);
        onFinalize(base64, points);
    };

    // Expose finalize function via window for simplicity in this bridge or use a ref in real life
    // But since we are hacking specific accordions, let's use a button inside the component if needed
    // Actually, let's just make it call onFinalize whenever points update, and we manage it in the parent? 
    // No, better a manual finalize to avoid heavy processing.

    // Add a ghost effect to the component to signal it's ready
    useEffect(() => {
        (window as any).finalizeCimetografo = finalize;
    }, [points, connections, angles, imageLoaded]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 select-none touch-none shadow-inner"
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
                {points.map(p => {
                    const isInteracting = draggingPoint === p.id || hoveringPoint === p.id;
                    return (
                        <div
                            key={p.id}
                            onPointerDown={(e) => handlePointerDown(e, p.id)}
                            onMouseEnter={() => setHoveringPoint(p.id)}
                            onMouseLeave={() => setHoveringPoint(null)}
                            className={cn(
                                "absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 cursor-grab active:cursor-grabbing flex items-center justify-center transition-all duration-300 z-30",
                                isInteracting
                                    ? "bg-red-500 border-white scale-125 z-50 shadow-lg shadow-red-500/50 opacity-100"
                                    : "bg-white/40 border-white/60 hover:opacity-100" // Visível mas discrêto
                            )}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        >
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                isInteracting ? "bg-white" : "bg-red-600 shadow-sm"
                            )} />

                            {/* Permanent Label if interacting */}
                            {isInteracting && (
                                <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-[8px] font-black text-white px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap backdrop-blur-sm">
                                    {p.label}
                                </div>
                            )}
                        </div>
                    );
                })}
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
