import { useState } from 'react';
import { AttachmentConfig } from '../types/game';
import { cn } from '../lib/utils';
import { Component, Crosshair, Box, Cylinder, Plus, Trash2 } from 'lucide-react';
import { TechCard } from './TechCard';
import { TechSlider } from './TechSlider';
import { TechSelect } from './TechSelect';

interface AttachmentConfigPanelProps {
    attachments: AttachmentConfig[];
    onUpdate: (atts: AttachmentConfig[]) => void;
}

export function AttachmentConfigPanel({ attachments, onUpdate }: AttachmentConfigPanelProps) {
    const [selectedId, setSelectedId] = useState<string | null>(attachments[0]?.id || null);
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const selectedAttachment = attachments.find(a => a.id === selectedId);

    const updateAttachment = (key: keyof AttachmentConfig, value: AttachmentConfig[keyof AttachmentConfig]) => {
        if (!selectedId) return;
        const newAtts = attachments.map(a => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            a.id === selectedId ? { ...a, [key]: value } as any : a
        );
        onUpdate(newAtts);
    };

    const createAttachment = () => {
        const newId = `att_${Date.now()}`;
        const newAtt: AttachmentConfig = {
            id: newId,
            name: 'New Attachment',
            type: 'optic',
            weight: 0.1,
            unlockLevel: 0,
            pros: [],
            cons: []
        };
        onUpdate([...attachments, newAtt]);
        setSelectedId(newId);
    };

    const deleteAttachment = (id: string) => {
        const newAtts = attachments.filter(a => a.id !== id);
        onUpdate(newAtts);
        if (selectedId === id) {
            setSelectedId(newAtts[0]?.id || null);
        }
    };

    const types = [
        { id: 'all', label: 'All', icon: <Component className="w-4 h-4" /> },
        { id: 'optic', label: 'Optics', icon: <Crosshair className="w-4 h-4" /> },
        { id: 'muzzle', label: 'Barrel', icon: <Cylinder className="w-4 h-4" /> },
        { id: 'grip', label: 'Underbarrel', icon: <Box className="w-4 h-4" /> },
        { id: 'mag', label: 'Magazine', icon: <Component className="w-4 h-4" /> },
    ];

    const filteredAttachments = activeFilter === 'all' 
        ? attachments 
        : attachments.filter(a => a.type === activeFilter);

    // Helpers for array editing
    const handleArrayChange = (key: 'pros' | 'cons', text: string) => {
        const items = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
        updateAttachment(key, items);
    };

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Left Column: List & Filter */}
            <div className="col-span-4 space-y-4">
                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
                    {types.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveFilter(t.id)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors outline-none border",
                                activeFilter === t.id 
                                    ? "text-cyan-400 border-cyan-500 bg-cyan-500/10" 
                                    : "text-slate-500 border-transparent hover:text-slate-300 bg-slate-900"
                            )}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {filteredAttachments.map(att => (
                        <div 
                            key={att.id}
                            onClick={() => setSelectedId(att.id)}
                            className={cn(
                                "p-3 border-l-2 cursor-pointer transition-all flex items-center justify-between group",
                                selectedId === att.id 
                                    ? "bg-slate-800 border-cyan-500" 
                                    : "bg-slate-900/50 border-slate-700 hover:bg-slate-800/50"
                            )}
                        >
                            <div className="flex flex-col">
                                <span className={cn("font-bold uppercase text-sm", selectedId === att.id ? "text-white" : "text-slate-400")}>
                                    {att.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 uppercase">{att.type}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteAttachment(att.id); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {filteredAttachments.length === 0 && (
                        <div className="text-center py-8 text-slate-600 italic text-xs">
                            No attachments found.
                        </div>
                    )}
                </div>

                <button 
                    onClick={createAttachment}
                    className="w-full p-3 border border-dashed border-slate-700 text-slate-500 uppercase font-bold text-xs hover:border-cyan-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Create Attachment
                </button>
            </div>

            {/* Right Column: Editor */}
            <div className="col-span-8">
                <TechCard className="min-h-[500px]">
                    {selectedAttachment ? (
                        <div className="space-y-6">
                             <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                                <div className="flex items-center gap-3 w-full mr-4">
                                    <Component className="w-5 h-5 text-purple-400" />
                                    <input 
                                        type="text"
                                        value={selectedAttachment.name}
                                        onChange={(e) => updateAttachment('name', e.target.value)}
                                        className="bg-transparent text-xl font-bold text-white uppercase tracking-wider outline-none border-b border-transparent focus:border-purple-500 transition-colors w-full"
                                    />
                                </div>
                                <div className="text-xs font-mono text-slate-500 whitespace-nowrap">ID: {selectedAttachment.id}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <TechSelect 
                                    label="Slot Type"
                                    value={selectedAttachment.type}
                                    options={[
                                        { value: 'optic', label: 'Optic' },
                                        { value: 'muzzle', label: 'Muzzle' },
                                        { value: 'barrel', label: 'Barrel' },
                                        { value: 'grip', label: 'Underbarrel' },
                                        { value: 'mag', label: 'Magazine' },
                                        { value: 'stock', label: 'Stock' },
                                    ]}
                                    color="purple"
                                    onChange={(v) => updateAttachment('type', v)}
                                />
                                <TechSlider 
                                    label="Unlock Level"
                                    value={selectedAttachment.unlockLevel || 0}
                                    min={0} max={100} step={1}
                                    color="yellow"
                                    onChange={(v) => updateAttachment('unlockLevel', v)}
                                />
                                <TechSlider 
                                    label="Weight (kg)"
                                    value={selectedAttachment.weight}
                                    min={0} max={5} step={0.05}
                                    color="cyan"
                                    onChange={(v) => updateAttachment('weight', v)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-green-400 uppercase tracking-wider block">
                                        Pros (Comma separated)
                                    </label>
                                    <textarea 
                                        className="w-full h-32 bg-slate-900/50 border border-slate-800 p-3 text-sm text-slate-300 focus:border-green-500/50 outline-none resize-none"
                                        value={selectedAttachment.pros.join(', ')}
                                        onChange={(e) => handleArrayChange('pros', e.target.value)}
                                        placeholder="e.g. +Zoom, +Range"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                                        Cons (Comma separated)
                                    </label>
                                    <textarea 
                                        className="w-full h-32 bg-slate-900/50 border border-slate-800 p-3 text-sm text-slate-300 focus:border-red-500/50 outline-none resize-none"
                                        value={selectedAttachment.cons.join(', ')}
                                        onChange={(e) => handleArrayChange('cons', e.target.value)}
                                        placeholder="e.g. -ADS Speed, -Movement"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-center justify-center h-full text-slate-500">
                            Select an attachment to configure
                        </div>
                    )}
                </TechCard>
            </div>
        </div>
    );
}
