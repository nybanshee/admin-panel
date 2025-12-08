import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TechCard } from '../components/TechCard';
import { useAuthStore, hasPermission } from '../store/auth';
import { useLogStore, LogEntry } from '../store/logStore';
import { TechTabControl } from '../components/TechTabControl';
import { Terminal, Server, Monitor, Gamepad2, Globe, Cpu, Share2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '../lib/utils';

export function Logs() {
  const user = useAuthStore(s => s.user);
  const roles = useAuthStore(s => s.roles);
  const canViewLogs = hasPermission(user, roles, 'view_logs');

  const [activeTab, setActiveTab] = useState('backend');
  const [activeGameSubTab, setActiveGameSubTab] = useState('server');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

  const { 
    backendLogs, frontendLogs, gameClientLogs, gameServerLogs, gameSharedLogs,
    addRawLog, addLog
  } = useLogStore();

  // Socket Connection
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });
    
    socket.on('log_backend', (log: LogEntry) => {
        addRawLog('backend', log);
    });

    socket.on('log_game', (log: LogEntry) => {
        // Dispatch to correct sub-store based on source
        if (log.source === 'Client') addRawLog('gameClient', log);
        else if (log.source === 'Server') addRawLog('gameServer', log);
        else if (log.source === 'Shared') addRawLog('gameShared', log);
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  // Capture Frontend Logs (Demo)
  useEffect(() => {
    const interval = setInterval(() => {
        // Simulate some frontend activity
        if (Math.random() > 0.8) {
            addLog('frontend', {
                level: 'info',
                message: `User interaction on ${activeTab} tab`,
                metadata: { x: Math.random() * 100, y: Math.random() * 100 }
            });
        }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Auto-scroll
  const currentLogs = activeTab === 'backend' ? backendLogs :
                      activeTab === 'frontend' ? frontendLogs :
                      activeTab === 'game' ? (
                          activeGameSubTab === 'client' ? gameClientLogs :
                          activeGameSubTab === 'shared' ? gameSharedLogs :
                          gameServerLogs
                      ) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLogs, activeTab, activeGameSubTab]);

  if (!canViewLogs) {
    return (
        <div className="flex h-full items-center justify-center text-red-500 font-mono text-xl uppercase tracking-widest animate-pulse">
            Access Denied: Insufficient Clearance
        </div>
    );
  }

  const renderLogLine = (log: LogEntry, i: number) => {
    const isError = log.level === 'error' || log.level === 'warn';
    const isDebug = log.level === 'debug';
    const color = isError ? "text-red-400" : isDebug ? "text-slate-500" : "text-emerald-400";
    const time = new Date(log.timestamp).toLocaleTimeString();

    return (
        <motion.div
            key={log.id + i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`mb-1 break-all ${color} font-mono text-xs md:text-sm flex gap-2`}
        >
            <span className="opacity-30 select-none text-slate-600 whitespace-nowrap">[{time}]</span>
            <span className="opacity-50 select-none font-bold uppercase w-12 text-right">{log.level}</span>
            <span className="opacity-50 select-none">::</span>
            <span>{log.message}</span>
        </motion.div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
                    System <span className="text-emerald-500">Logs</span>
                </h1>
                <p className="text-slate-400 font-mono text-sm mt-1">&gt; Real-time diagnostic stream</p>
            </div>
            
            <div className="w-full md:w-auto">
                <TechTabControl 
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { id: 'backend', label: 'Backend', icon: <Server className="w-4 h-4" /> },
                        { id: 'frontend', label: 'Frontend', icon: <Monitor className="w-4 h-4" /> },
                        { id: 'game', label: 'Game Engine', icon: <Gamepad2 className="w-4 h-4" /> },
                    ]}
                />
            </div>
        </motion.div>

      <TechCard className="flex-1 overflow-hidden p-0 border-emerald-500/30 flex flex-col">
        {/* Terminal Header */}
        <div className="flex h-12 items-center border-b border-slate-800 bg-slate-950/80 px-4 space-x-2 shrink-0">
            <div className="flex space-x-1.5 mr-4">
                <div className="h-3 w-3 bg-red-500/80 rounded-full" />
                <div className="h-3 w-3 bg-yellow-500/80 rounded-full" />
                <div className="h-3 w-3 bg-green-500/80 rounded-full" />
            </div>
            
            {activeTab === 'game' && (
                <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
                    {[
                        { id: 'client', label: 'Client', icon: <Monitor className="w-3 h-3" /> },
                        { id: 'shared', label: 'Shared', icon: <Share2 className="w-3 h-3" /> },
                        { id: 'server', label: 'Server', icon: <Cpu className="w-3 h-3" /> },
                    ].map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setActiveGameSubTab(sub.id)}
                            className={cn(
                                "px-3 py-1 rounded text-[10px] uppercase font-bold flex items-center gap-2 transition-all",
                                activeGameSubTab === sub.id 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {sub.icon}
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="ml-auto text-xs text-emerald-500/50 font-mono flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                LIVE_CONNECTION
            </div>
        </div>
        
        {/* Log Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
          {currentLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 font-mono text-sm">
                  Waiting for log stream...
              </div>
          ) : (
              currentLogs.map(renderLogLine)
          )}
          <div ref={bottomRef} />
          {/* Cursor */}
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block h-4 w-2 bg-emerald-500 align-middle ml-1"
          />
        </div>
      </TechCard>
    </div>
  );
}
