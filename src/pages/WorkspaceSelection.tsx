import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Plus, ArrowRight, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore, Workspace, hasPermission } from '../store/auth';

export function WorkspaceSelection() {
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const roles = useAuthStore(s => s.roles);
    const logout = useAuthStore(s => s.logout);
    const workspaces = useAuthStore(s => s.workspaces);
    const selectWorkspace = useAuthStore(s => s.selectWorkspace);
    const addWorkspace = useAuthStore(s => s.addWorkspace);

    const [isCreating, setIsCreating] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    const userRole = roles.find(r => r.id === user?.roleId);
    const canManageWorkspaces = hasPermission(user, roles, 'manage_workspaces');

    const handleSelect = (ws: Workspace) => {
        selectWorkspace(ws);
        navigate('/');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;

        const newWs: Workspace = {
            id: newWorkspaceName.toLowerCase().replace(/\s+/g, '-'),
            name: newWorkspaceName,
            description: `Created by ${user?.username}`
        };

        addWorkspace(newWs);
        selectWorkspace(newWs);
        navigate('/');
    };

    const handleLogout = () => {
        logout();
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    }

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) {
        return null;
    }

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-widest text-white mb-2">
                            SELECT <span className="text-cyan-400">WORKSPACE</span>
                        </h1>
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                            Logged in as <span className="text-cyan-400">{user.username}</span> ({userRole?.name || 'Unknown'})
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workspaces.map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => handleSelect(ws)}
                            className="group relative p-6 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all text-left"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                                    <Database className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{ws.name}</h3>
                            <p className="text-sm text-slate-500">{ws.description || 'No description'}</p>
                        </button>
                    ))}

                    {/* Create New Workspace - Only for authorized users */}
                    {canManageWorkspaces && (
                        !isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="group p-6 bg-slate-950/30 hover:bg-slate-800/50 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition-all flex flex-col items-center justify-center gap-4 min-h-[160px]"
                            >
                                <div className="p-3 bg-slate-900 rounded-full group-hover:bg-slate-800 transition-colors">
                                    <Plus className="w-6 h-6 text-slate-500 group-hover:text-white" />
                                </div>
                                <span className="text-sm font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">Create Workspace</span>
                            </button>
                        ) : (
                            <form onSubmit={handleCreate} className="p-6 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col justify-between">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">New Workspace Name</label>
                                    <input 
                                        autoFocus
                                        value={newWorkspaceName}
                                        onChange={e => setNewWorkspaceName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        placeholder="e.g. Feature Test"
                                    />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold uppercase rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={!newWorkspaceName.trim()}
                                        className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase rounded transition-colors disabled:opacity-50"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        )
                    )}
                </div>
            </motion.div>
        </div>
    );
}
