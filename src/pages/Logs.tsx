import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TechCard } from '../components/TechCard';

const initialLogs = [
  "[SYSTEM] Initializing system components...",
  "[SYSTEM] Loading modules: auth, users, analytics...",
  "[INFO] Auth module loaded successfully.",
  "[INFO] Users module loaded successfully.",
  "[INFO] Analytics module loaded successfully.",
  "[NETWORK] Connecting to database...",
  "[NETWORK] Connected to db_prod_primary (10ms).",
  "[SYSTEM] System ready. Listening on port 3000.",
];

export function Logs() {
  const [logs, setLogs] = useState<string[]>(initialLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        "[INFO] User login attempt: admin",
        "[INFO] Data sync completed",
        "[WARN] High memory usage detected (75%)",
        "[NETWORK] GET /api/v1/users 200 OK",
        "[NETWORK] POST /api/v1/auth/login 200 OK",
        "[DEBUG] Cache hit for key: user_123",
        "[INFO] Scheduled task 'cleanup' started",
        "[INFO] Scheduled task 'cleanup' finished",
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      
      setLogs(prev => [...prev, `[${timestamp}] ${randomAction}`]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
                System <span className="text-emerald-500">Logs</span>
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-1">&gt; Viewing real-time system output stream</p>
        </motion.div>

      <TechCard className="flex-1 overflow-hidden p-0 border-emerald-500/30">
        <div className="flex h-10 items-center border-b border-slate-800 bg-slate-950/80 px-4 space-x-2">
            <div className="flex space-x-1.5">
                <div className="h-3 w-3 bg-red-500/80 [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%,0_20%)]" />
                <div className="h-3 w-3 bg-yellow-500/80 [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%,0_20%)]" />
                <div className="h-3 w-3 bg-green-500/80 [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%,0_20%)]" />
            </div>
            <div className="ml-4 text-xs text-emerald-500/70 font-mono flex-1 text-center tracking-widest uppercase">
                // SYSTEM_TERMINAL_V2.0
            </div>
            <div className="w-16"></div>
        </div>
        
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto p-4 bg-slate-950 font-mono text-sm scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
          {logs.map((log, i) => {
            const isError = log.includes("[WARN]") || log.includes("[ERROR]");
            const isNetwork = log.includes("[NETWORK]");
            const color = isError ? "text-red-400" : isNetwork ? "text-blue-400" : "text-emerald-400";
            
            return (
                <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mb-1 break-all ${color} font-medium`}
                >
                <span className="opacity-30 mr-2 select-none text-slate-500">{i.toString().padStart(4, '0')}</span>
                <span className="opacity-50 mr-2">$</span>
                {log}
                </motion.div>
            );
          })}
          <div ref={bottomRef} />
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
