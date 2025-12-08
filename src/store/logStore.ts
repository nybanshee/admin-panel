import { create } from 'zustand';

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    source?: string; // For game logs (Client, Server, Shared)
    metadata?: any;
}

interface LogStore {
    backendLogs: LogEntry[];
    frontendLogs: LogEntry[];
    gameClientLogs: LogEntry[];
    gameServerLogs: LogEntry[];
    gameSharedLogs: LogEntry[];
    
    addLog: (category: 'backend' | 'frontend' | 'gameClient' | 'gameServer' | 'gameShared', log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    addRawLog: (category: 'backend' | 'frontend' | 'gameClient' | 'gameServer' | 'gameShared', log: LogEntry) => void;
    clearLogs: (category?: 'backend' | 'frontend' | 'gameClient' | 'gameServer' | 'gameShared') => void;
}

export const useLogStore = create<LogStore>((set) => ({
    backendLogs: [],
    frontendLogs: [],
    gameClientLogs: [],
    gameServerLogs: [],
    gameSharedLogs: [],

    addLog: (category, log) => set((state) => {
        const entry: LogEntry = {
            ...log,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
        };
        const targetKey = `${category}Logs` as keyof LogStore;
        // @ts-ignore
        const currentLogs = state[targetKey] as LogEntry[];
        const nextLogs = [entry, ...currentLogs].slice(0, 200); // Keep last 200
        
        return { [targetKey]: nextLogs };
    }),

    addRawLog: (category, log) => set((state) => {
        const targetKey = `${category}Logs` as keyof LogStore;
        // @ts-ignore
        const currentLogs = state[targetKey] as LogEntry[];
        const nextLogs = [log, ...currentLogs].slice(0, 200);
        return { [targetKey]: nextLogs };
    }),

    clearLogs: (category) => set((state) => {
        if (category) {
            return { [`${category}Logs`]: [] };
        }
        return {
            backendLogs: [],
            frontendLogs: [],
            gameClientLogs: [],
            gameServerLogs: [],
            gameSharedLogs: []
        };
    })
}));
