import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Save, Trash2 } from 'lucide-react';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    savedColors?: string[];
    onSaveColor?: (color: string) => void;
    onDeleteColor?: (color: string) => void;
}

export function ColorPicker({ color, onChange, savedColors = [], onSaveColor, onDeleteColor }: ColorPickerProps) {
    const [hex, setHex] = useState(color);
    
    useEffect(() => {
        setHex(color);
    }, [color]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setHex(val);
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            onChange(val);
        }
    };

    return (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg w-64 space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase block">Pick Color</label>
                <div className="flex gap-2">
                    <input 
                        type="color" 
                        value={hex} 
                        onChange={(e) => {
                            setHex(e.target.value);
                            onChange(e.target.value);
                        }}
                        className="w-10 h-10 p-0 border-0 rounded cursor-pointer" 
                    />
                    <input 
                        type="text" 
                        value={hex}
                        onChange={handleHexChange}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 text-white text-sm font-mono"
                        placeholder="#000000"
                    />
                </div>
            </div>

            {onSaveColor && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Saved Colors</label>
                        <button 
                            onClick={() => onSaveColor(hex)}
                            className="text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                            <Save className="w-3 h-3" /> Save Current
                        </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {savedColors.map((c) => (
                            <div key={c} className="group relative">
                                <button
                                    onClick={() => onChange(c)}
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 transition-all",
                                        color === c ? "border-white scale-110" : "border-transparent hover:scale-110"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                                {onDeleteColor && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteColor(c); }}
                                        className="absolute -top-1 -right-1 bg-slate-900 text-red-400 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <Trash2 className="w-2 h-2" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {savedColors.length === 0 && (
                            <div className="col-span-6 text-[10px] text-slate-600 italic text-center py-2">
                                No saved colors
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
