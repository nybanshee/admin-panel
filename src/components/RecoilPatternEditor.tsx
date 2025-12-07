import { useRef, useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';

interface Point {
    x: number;
    y: number;
    time: number;
}

interface RecoilPatternEditorProps {
    onSave: (pattern: Point[]) => void;
}

export function RecoilPatternEditor({ onSave }: RecoilPatternEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState<Point[]>([]);
    const [name, setName] = useState('New Pattern');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and draw grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, canvas.width, canvas.height);
        drawCenterMarker(ctx, canvas.width, canvas.height);

        // Draw path
        if (points.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#22d3ee'; // Cyan
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Start from center
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // The first point in our array is the start of the recoil (shot 1)
            // We want to visualize the recoil climb relative to center
            
            // Actually, let's treat the mouse movement as the recoil offset
            // If I drag mouse down, the gun kicks up? Or is this "controlling" recoil?
            // Usually "Recoil Pattern" means "Where the bullets go".
            // So if I draw UP, the bullets go UP.
            
            ctx.moveTo(centerX, centerY);

            points.forEach(p => {
                ctx.lineTo(p.x, p.y);
            });
            
            ctx.stroke();

            // Draw glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#22d3ee';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

    }, [points]);

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;

        for (let x = 0; x <= w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        for (let y = 0; y <= h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    };

    const drawCenterMarker = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.stroke();
    };

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        setPoints([]); 
        const { x, y } = getCanvasCoordinates(e);
        setPoints([{ x, y, time: Date.now() }]);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { x, y } = getCanvasCoordinates(e);
        setPoints(prev => [...prev, { x, y, time: Date.now() }]);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleSave = () => {
        // Convert absolute canvas coordinates to relative offsets from the FIRST point (or center)
        // If we assume the first click is "Shot 1" (Center), then we normalize.
        if (points.length === 0) return;

        // Let's normalize relative to canvas center for storage
        const canvas = canvasRef.current;
        if(!canvas) return;
        
        // However, the user drew a path. We probably want the path relative to the START of the drawing
        // OR relative to the center if they started at the center.
        // Let's just save the raw path for now, normalized to start at (0,0) being the first shot
        
        // Actually, better yet: Normalize so the first point is (0,0)
        const startX = points[0].x;
        const startY = points[0].y;

        const normalized = points.map(p => ({
            x: p.x - startX,
            y: p.y - startY,
            time: p.time - points[0].time
        }));

        onSave(normalized);
    };

    return (
        <div className="flex gap-6 h-full">
            <div className="flex-1 relative bg-slate-950 border border-slate-800 rounded overflow-hidden cursor-crosshair">
                <div className="absolute top-4 left-4 pointer-events-none select-none opacity-50">
                    <p className="text-xs font-mono text-cyan-500">CANVAS: 800x600</p>
                    <p className="text-xs font-mono text-slate-500">MODE: FREEHAND_RECORD</p>
                </div>
                <div className="aspect-[4/3] w-full">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-auto touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />
                </div>
            </div>

            <div className="w-64 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tools</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setPoints([])}
                            className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-400 transition-colors rounded"
                        >
                            <Trash2 className="mb-2 h-5 w-5" />
                            <span className="text-xs font-bold">Clear</span>
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={points.length === 0}
                            className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="mb-2 h-5 w-5" />
                            <span className="text-xs font-bold">Save</span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Pattern Stats</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Points</span>
                            <span className="text-white font-mono">{points.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Duration</span>
                            <span className="text-white font-mono">
                                {points.length > 0 ? ((points[points.length - 1].time - points[0].time) / 1000).toFixed(2) : '0.00'}s
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <input className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200" value={name} onChange={(e)=>setName(e.target.value)} />
                </div>

                <div className="text-xs text-slate-500 leading-relaxed">
                    <p><strong>Instructions:</strong></p>
                    <p>Click and drag to simulate the recoil pattern. The system will record the path and timing of your mouse movement.</p>
                </div>
            </div>
        </div>
    );
}
