import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Mock authentication
        setTimeout(() => {
            if (username === 'admin' && password === 'admin') {
                localStorage.setItem('isAuthenticated', 'true');
                navigate('/');
            } else {
                setError('Invalid credentials. Try admin/admin');
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 z-0" />
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black tracking-widest text-white mb-2">
                        ADMIN<span className="text-cyan-400">PANEL</span>
                    </h1>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Secure Access Terminal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operator ID</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded px-10 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                placeholder="ENTER ID"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Code</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded px-10 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-mono text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed",
                            isLoading && "animate-pulse"
                        )}
                    >
                        {isLoading ? 'Authenticating...' : 'Initialize Session'}
                        {!isLoading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-600 font-mono uppercase">
                        Restricted Area • Authorized Personnel Only
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
