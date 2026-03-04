import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Settings, RotateCcw, Activity, AlignVerticalSpaceAround, AlignHorizontalSpaceAround, Ruler, MousePointer2, Maximize, Minimize } from 'lucide-react';

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
    type?: 'standard' | 'deviation' | 'horizontal_deviation'; // standard=3 points, deviation=angle with vertical line at vertex, horizontal_deviation=angle with horizontal line at vertex
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
    const [customAngleCount, setCustomAngleCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Initialize points based on saved data or blank
    useEffect(() => {
        if (savedPoints && savedPoints.length > 0) {
            setPoints(savedPoints);
            // We'd probably want to save/restore connections and angles too in a real full persist,
            // but keeping this simple for now. It assumes fresh analysis if none passed.
        } else if (points.length === 0) {
            setPoints([]);
            setConnections([]);
            setAngles([]);
            setLevelChecks([]);
        }
    }, [mode, savedPoints]);

    // Handle Fullscreen Event Listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

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
                const width = Math.abs(x2 - x1) + 120; // make horizontal line a bit wider

                ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'; // highly transparent slate-400
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

                // Quality segment between points
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = angleDeg <= 1.0 ? '#10b981' : '#f59e0b'; // Green if Level, Amber if tilted
                ctx.stroke();

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
                }
            }
        });
        ctx.setLineDash([]);

        // Calculate and Draw Angles (Lines only -- text is handled by HTML overlay for clickability)
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
                    ctx.moveTo(vx, vy - 200);
                    ctx.lineTo(vx, vy + 200);
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // highly transparent slate-400
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Draw yellow arc
                    const angle1 = Math.atan2(y2 - vy, x2 - vx);
                    const angle2 = (angle1 > -Math.PI && angle1 <= 0) ? -Math.PI / 2 : Math.PI / 2;
                    ctx.beginPath();
                    ctx.arc(vx, vy, 20, Math.min(angle1, angle2), Math.max(angle1, angle2));
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    // HTML overlay handles the text now to make it clickable
                }
            } else if (angleInfo.type === 'horizontal_deviation') {
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2!);

                if (vertex && p2) {
                    const vx = getPx(vertex.x, rect.width), vy = getPx(vertex.y, rect.height);
                    const x2 = getPx(p2.x, rect.width), y2 = getPx(p2.y, rect.height);

                    // Horizontal line fixed
                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(vx - 200, vy);
                    ctx.lineTo(vx + 200, vy);
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // highly transparent slate-400
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Draw yellow arc
                    const angle1 = Math.atan2(y2 - vy, x2 - vx);
                    const angle2 = Math.abs(angle1) > Math.PI / 2 ? (angle1 > 0 ? Math.PI : -Math.PI) : 0;
                    ctx.beginPath();
                    ctx.arc(vx, vy, 20, Math.min(angle1, angle2), Math.max(angle1, angle2));
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    // HTML overlay handles the text now to make it clickable
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
                    // HTML overlay handles the text now to make it clickable
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

        // Image natural vs displayed dimensions taking object-contain into account
        const rect = containerRef.current.getBoundingClientRect();
        const Iw = img.naturalWidth;
        const Ih = img.naturalHeight;
        if (!Iw || !Ih) return;

        const k = Math.min(rect.width / Iw, rect.height / Ih);
        const Dw = Iw * k;
        const Dh = Ih * k;
        const offsetX = (rect.width - Dw) / 2;
        const offsetY = (rect.height - Dh) / 2;

        const srcX = (x - offsetX) / k;
        const srcY = (y - offsetY) / k;

        const zoomLevel = isFullscreen ? 1.5 : 3;
        const lensSize = isFullscreen ? 100 : 50; // Radius in src pixels to capture

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
                const width = Math.abs(x2 - x1) + (120 * s); // matching wider horizontal line

                octx.strokeStyle = 'rgba(148, 163, 184, 0.3)'; // transparent slate-400
                octx.lineWidth = Math.max(1, 1 * s);
                octx.beginPath();
                octx.moveTo(cx - width / 2, cy);
                octx.lineTo(cx + width / 2, cy);
                octx.stroke();

                const angleRad = Math.atan2(Math.abs(y2 - y1), Math.abs(x2 - x1));
                let angleDeg = angleRad * (180 / Math.PI);

                const leftPoint = x1 < x2 ? p1 : p2;
                const rightPoint = x1 < x2 ? p2 : p1;
                const higherMsg = leftPoint.y < rightPoint.y ? 'Elev. Esq' : 'Elev. Dir';

                // Quality segment between points
                octx.beginPath();
                octx.moveTo(x1, y1);
                octx.lineTo(x2, y2);
                octx.lineWidth = 3 * s;
                octx.strokeStyle = angleDeg <= 1.0 ? '#10b981' : '#f59e0b'; // Green if level, Amber if tilted
                octx.stroke();

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
                    octx.moveTo(vx, vy - (200 * s));
                    octx.lineTo(vx, vy + (200 * s));
                    octx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // transparent
                    octx.lineWidth = Math.max(1, 1 * s);
                    octx.stroke();
                    octx.setLineDash([]);

                    // Draw arc
                    const angle1 = Math.atan2(y2 - vy, x2 - vx);
                    const angle2 = (angle1 > -Math.PI && angle1 <= 0) ? -Math.PI / 2 : Math.PI / 2;
                    octx.beginPath();
                    octx.arc(vx, vy, 20 * s, Math.min(angle1, angle2), Math.max(angle1, angle2));
                    octx.strokeStyle = '#fbbf24';
                    octx.lineWidth = 3 * s;
                    octx.stroke();

                    const angleRad = Math.atan2(x2 - vx, y2 - vy);
                    let deviationDeg = Math.abs(angleRad * (180 / Math.PI));
                    if (deviationDeg > 90) deviationDeg = 180 - deviationDeg;

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
            } else if (angleInfo.type === 'horizontal_deviation') {
                const vertex = getPoint(angleInfo.vertex);
                const p2 = getPoint(angleInfo.p2!);

                if (vertex && p2) {
                    const vx = getNatX(vertex.x), vy = getNatY(vertex.y);
                    const x2 = getNatX(p2.x), y2 = getNatY(p2.y);

                    octx.beginPath();
                    octx.setLineDash([5 * s, 5 * s]);
                    octx.moveTo(vx - (200 * s), vy);
                    octx.lineTo(vx + (200 * s), vy);
                    octx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // transparent
                    octx.lineWidth = Math.max(1, 1 * s);
                    octx.stroke();
                    octx.setLineDash([]);

                    // Draw arc
                    const angle1 = Math.atan2(y2 - vy, x2 - vx);
                    const angle2 = Math.abs(angle1) > Math.PI / 2 ? (angle1 > 0 ? Math.PI : -Math.PI) : 0;
                    octx.beginPath();
                    octx.arc(vx, vy, 20 * s, Math.min(angle1, angle2), Math.max(angle1, angle2));
                    octx.strokeStyle = '#fbbf24';
                    octx.lineWidth = 3 * s;
                    octx.stroke();

                    const angleRad = Math.atan2(y2 - vy, x2 - vx);
                    let deviationDeg = Math.abs(angleRad * (180 / Math.PI));
                    if (deviationDeg > 90) deviationDeg = 180 - deviationDeg;

                    const txt = `${deviationDeg.toFixed(1)}°`;
                    octx.font = `bold ${14 * s}px Inter`;
                    const tw = octx.measureText(txt).width;
                    let tx = vx + (15 * s);
                    let ty = vy + (15 * s);

                    octx.fillStyle = '#10b981';
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

    const addCustomVerticalAngle = () => {
        const id = customAngleCount + 1;
        setCustomAngleCount(id);
        const vertexId = `custom_v_v_${id}`;
        const p2Id = `custom_v_p_${id}`;

        setPoints(prev => [
            ...prev,
            { id: vertexId, label: `Ref. Vert ${id}`, x: 50, y: 50 },
            { id: p2Id, label: `Pt Vert ${id}`, x: 60, y: 70 }
        ]);
        setConnections(prev => [
            ...prev,
            { from: vertexId, to: p2Id }
        ]);
        setAngles(prev => [
            ...prev,
            { p1: vertexId, vertex: vertexId, p2: p2Id, type: 'deviation', label: `Ângulo V${id}` }
        ]);
    };

    const addCustomHorizontalAngle = () => {
        const id = customAngleCount + 1;
        setCustomAngleCount(id);
        const vertexId = `custom_h_v_${id}`;
        const p2Id = `custom_h_p_${id}`;

        setPoints(prev => [
            ...prev,
            { id: vertexId, label: `Ref. Horiz ${id}`, x: 50, y: 50 },
            { id: p2Id, label: `Pt Horiz ${id}`, x: 70, y: 40 }
        ]);
        setConnections(prev => [
            ...prev,
            { from: vertexId, to: p2Id }
        ]);
        setAngles(prev => [
            ...prev,
            { p1: vertexId, vertex: vertexId, p2: p2Id, type: 'horizontal_deviation', label: `Ângulo H${id}` }
        ]);
    };

    const toggleAngleType = (index: number) => {
        setAngles(prev => {
            const next = [...prev];
            const current = next[index].type || 'standard';
            if (current === 'standard') {
                next[index].type = 'deviation'; // vertical
            } else if (current === 'deviation') {
                next[index].type = 'horizontal_deviation';
            } else {
                next[index].type = 'standard';
            }
            return next;
        });
    };

    const addCustomGenericAngle = () => {
        const id = customAngleCount + 1;
        setCustomAngleCount(id);
        const p1Id = `custom_g_p1_${id}`;
        const vertexId = `custom_g_v_${id}`;
        const p2Id = `custom_g_p2_${id}`;

        setPoints(prev => [
            ...prev,
            { id: p1Id, label: `Braço A`, x: 40, y: 40 },
            { id: vertexId, label: `Vértice`, x: 50, y: 60 },
            { id: p2Id, label: `Braço B`, x: 60, y: 40 }
        ]);
        setConnections(prev => [
            ...prev,
            { from: p1Id, to: vertexId },
            { from: vertexId, to: p2Id }
        ]);
        setAngles(prev => [
            ...prev,
            { p1: p1Id, vertex: vertexId, p2: p2Id, type: 'standard', label: `Ângulo L${id}` }
        ]);
    };

    const addCustomLine = () => {
        const id = customAngleCount + 1;
        setCustomAngleCount(id);
        const p1Id = `custom_l_p1_${id}`;
        const p2Id = `custom_l_p2_${id}`;

        setPoints(prev => [
            ...prev,
            { id: p1Id, label: `A`, x: 40, y: 50 },
            { id: p2Id, label: `B`, x: 70, y: 50 }
        ]);
        setConnections(prev => [
            ...prev,
            { from: p1Id, to: p2Id }
        ]);
        // Also add level check implicitly to calculate horizontal deviation automatically if desired?
        // Let's just draw the line connection.
    };

    const removeLastCustomAngle = () => {
        if (customAngleCount === 0) return;
        const id = customAngleCount;
        setCustomAngleCount(id - 1);

        const gP1Id = `custom_g_p1_${id}`;
        const gVertexId = `custom_g_v_${id}`;
        const gP2Id = `custom_g_p2_${id}`;

        const lP1Id = `custom_l_p1_${id}`;
        const lP2Id = `custom_l_p2_${id}`;

        // Remove standard angle points
        setPoints(prev => prev.filter(p => ![gP1Id, gVertexId, gP2Id, lP1Id, lP2Id].includes(p.id)));
        setConnections(prev => prev.filter(c =>
            !(c.from === gP1Id && c.to === gVertexId) &&
            !(c.from === gVertexId && c.to === gP2Id) &&
            !(c.from === lP1Id && c.to === lP2Id)
        ));
        setAngles(prev => prev.filter(a =>
            a.label !== `Ângulo L${id}`
        ));
    };

    const clearAll = () => {
        setPoints([]);
        setConnections([]);
        setAngles([]);
        setLevelChecks([]);
        setCustomAngleCount(0);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen?.().catch(err => {
                console.error("Error attempting to enable fullscreen:", err);
            });
        } else {
            document.exitFullscreen?.();
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full bg-slate-100 overflow-hidden border border-slate-200 select-none touch-none shadow-inner",
                isFullscreen ? "h-screen rounded-none" : "h-[500px] rounded-3xl"
            )}
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

            {/* Top Left Menu: Fullscreen */}
            <div className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-slate-200">
                <button
                    onClick={toggleFullscreen}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-slate-100 shadow-sm transition-all"
                    title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </div>

            {/* Floating Action Menu (Inspired by Apple Store Angle App) */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-40 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-200">
                <button
                    onClick={addCustomGenericAngle}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-amber-500 hover:bg-white shadow-sm transition-all relative group"
                    title="Adicionar Medição Ângulo Livre (3 Pontos)"
                >
                    <MousePointer2 size={16} className="absolute opacity-30 group-hover:opacity-100 transition-opacity text-amber-500 rotate-45" />
                    <Plus size={14} className="z-10 mb-2 ml-2 font-black" strokeWidth={4} />
                </button>
                <div className="w-6 h-px bg-slate-200 mx-auto" />
                <button
                    onClick={addCustomLine}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-red-500 hover:bg-white shadow-sm transition-all relative group"
                    title="Adicionar Linha Livre (Medir Proporções Diretas)"
                >
                    <Ruler size={16} className="absolute opacity-30 group-hover:opacity-100 transition-opacity text-red-500 -rotate-45" />
                    <Plus size={14} className="z-10 mb-2 ml-2 font-black" strokeWidth={4} />
                </button>
                <div className="w-6 h-px bg-slate-200 mx-auto" />
                <button
                    onClick={removeLastCustomAngle}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-white shadow-sm transition-all"
                    title="Remover Última Inclusão"
                >
                    <Minus size={20} strokeWidth={3} />
                </button>
            </div>

            {/* HTML Overlays for Angles to make them clickable */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                {angles.map((angleInfo, idx) => {
                    const vertex = points.find(p => p.id === angleInfo.vertex);
                    const p2 = points.find(p => p.id === angleInfo.p2!); // Ensure we always have p2 (fallback if 3-point missing p2)
                    const p1 = points.find(p => p.id === angleInfo.p1);

                    if (!containerRef.current) return null;
                    const rect = containerRef.current.getBoundingClientRect();
                    const getPx = (percent: number, dimension: number) => (percent / 100) * dimension;

                    if (angleInfo.type === 'deviation' && vertex && p2) {
                        const vx = getPx(vertex.x, rect.width), vy = getPx(vertex.y, rect.height);
                        const x2 = getPx(p2.x, rect.width), y2 = getPx(p2.y, rect.height);
                        const angleRad = Math.atan2(x2 - vx, y2 - vy);
                        let deviationDeg = Math.abs(angleRad * (180 / Math.PI));
                        if (deviationDeg > 90) deviationDeg = 180 - deviationDeg;
                        const txt = `${deviationDeg.toFixed(1)}°`;

                        return (
                            <button
                                key={`angle-${idx}`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAngleType(idx); }}
                                className="absolute pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-2 py-0.5 rounded shadow-sm transition-colors"
                                style={{ left: vx + 15, top: vy + 15 }}
                            >
                                {txt}
                            </button>
                        );
                    } else if (angleInfo.type === 'horizontal_deviation' && vertex && p2) {
                        const vx = getPx(vertex.x, rect.width), vy = getPx(vertex.y, rect.height);
                        const x2 = getPx(p2.x, rect.width), y2 = getPx(p2.y, rect.height);
                        const angleRad = Math.atan2(y2 - vy, x2 - vx);
                        let deviationDeg = Math.abs(angleRad * (180 / Math.PI));
                        if (deviationDeg > 90) deviationDeg = 180 - deviationDeg;
                        const txt = `${deviationDeg.toFixed(1)}°`;

                        return (
                            <button
                                key={`angle-${idx}`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAngleType(idx); }}
                                className="absolute pointer-events-auto bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs px-2 py-0.5 rounded shadow-sm transition-colors"
                                style={{ left: vx + 15, top: vy + 15 }}
                            >
                                {txt}
                            </button>
                        );
                    } else if (angleInfo.type === 'standard' && p1 && vertex && p2) {
                        const x1 = getPx(p1.x, rect.width), y1 = getPx(p1.y, rect.height);
                        const vx = getPx(vertex.x, rect.width), vy = getPx(vertex.y, rect.height);
                        const x2 = getPx(p2.x, rect.width), y2 = getPx(p2.y, rect.height);

                        const angle1 = Math.atan2(y1 - vy, x1 - vx);
                        const angle2 = Math.atan2(y2 - vy, x2 - vx);
                        let angleDeg = Math.abs(angle1 - angle2) * (180 / Math.PI);
                        if (angleDeg > 180) angleDeg = 360 - angleDeg;
                        const txt = `${Math.round(angleDeg)}°`;

                        return (
                            <button
                                key={`angle-${idx}`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAngleType(idx); }}
                                className="absolute pointer-events-auto bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs px-2 py-0.5 rounded shadow-sm transition-colors"
                                style={{ left: vx + 25, top: vy - 10 }}
                            >
                                {txt}
                            </button>
                        );
                    }
                    return null;
                })}
            </div>

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
                                "absolute w-6 h-6 -ml-3 -mt-3 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center transition-all duration-300 z-30",
                                isInteracting
                                    ? "bg-red-500 border-2 border-white scale-125 z-50 shadow-lg shadow-red-500/50 opacity-100"
                                    : "bg-transparent opacity-60 hover:opacity-100"
                            )}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        >
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                isInteracting ? "bg-white" : "bg-red-600/40 shadow-sm"
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
                    className={cn(
                        "absolute z-50 overflow-hidden border-4 border-white shadow-2xl bg-slate-900 pointer-events-none transition-all",
                        isFullscreen
                            ? "rounded-3xl w-64 h-64 left-24 top-24" // Larger, deeper into screen when fullscreen
                            : "rounded-full w-32 h-32" // Compact circle following near edge
                    )}
                    style={isFullscreen ? {} : {
                        left: 20,
                        top: 20,
                    }}
                >
                    <canvas
                        ref={zoomCanvasRef}
                        width={isFullscreen ? 512 : 256}
                        height={isFullscreen ? 512 : 256}
                        className="w-full h-full object-cover"
                    />
                    <div className={cn(
                        "absolute bottom-2 inset-x-0 text-center text-white font-black uppercase tracking-widest drop-shadow-md",
                        isFullscreen ? "text-sm bg-black/30 backdrop-blur pb-2 pt-1" : "text-[9px]"
                    )}>
                        {points.find(p => p.id === draggingPoint)?.label || "Medição Livre"}
                    </div>
                </div>
            )}
        </div>
    );
}
