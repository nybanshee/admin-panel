import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import React from 'react';

interface TabOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TechTabControlProps {
    tabs: TabOption[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function TechTabControl({ tabs, activeTab, onChange, className }: TechTabControlProps) {
    return (
        <div className={cn("flex flex-wrap p-1 bg-slate-900/80 border border-slate-800 backdrop-blur-sm", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "relative flex-1 flex items-center justify-center px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors duration-300 z-10 outline-none min-w-[120px]",
                        activeTab === tab.id ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-slate-800 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
