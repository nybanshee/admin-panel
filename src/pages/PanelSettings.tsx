import { useState, useEffect } from 'react';
import { useAuthStore, User, hasPermission } from '../store/auth';
import { Trash2, UserPlus, Shield, User as UserIcon, Lock, Activity, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { TechTabControl } from '../components/TechTabControl';

export function PanelSettings() {
    const currentUser = useAuthStore(s => s.user);
    const users = useAuthStore(s => s.users);
    const roles = useAuthStore(s => s.roles);
    
    const canManageUsers = hasPermission(currentUser, roles, 'manage_users');
    const canManageRoles = hasPermission(currentUser, roles, 'manage_roles');
    const canViewLogs = hasPermission(currentUser, roles, 'view_logs');

    const addUser = useAuthStore(s => s.addUser);
    const removeUser = useAuthStore(s => s.removeUser);
    const updateUser = useAuthStore(s => s.updateUser);
    const addRole = useAuthStore(s => s.addRole);
    const removeRole = useAuthStore(s => s.removeRole);
    const updateRole = useAuthStore(s => s.updateRole);

    const [activeTab, setActiveTab] = useState('users');
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState<{ username: string, password: string, roleId: string }>({
        username: '',
        password: '',
        roleId: 'editor'
    });
    const [newRoleName, setNewRoleName] = useState('');

    // Access Control
    if (!canManageUsers && !canManageRoles && !canViewLogs) {
         return (
             <div className="flex h-full items-center justify-center text-red-500 font-mono text-xl uppercase tracking-widest animate-pulse">
                 Access Denied: Insufficient Clearance
             </div>
         );
    }

    // State for Logs and Online Users
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

    // ... (useEffect remains same)

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) return;
        
        addUser(newUser);
        setNewUser({ username: '', password: '', roleId: 'editor' });
        setIsAdding(false);
    };

    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        const id = newRoleName.toLowerCase().replace(/\s+/g, '_');
        addRole({
            id,
            name: newRoleName,
            color: 'text-slate-300',
            permissions: ['view_dashboard']
        });
        setNewRoleName('');
    };

    const togglePermission = (roleId: string, perm: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        const current = role.permissions;
        const next = current.includes(perm as any) 
            ? current.filter(p => p !== perm)
            : [...current, perm as any];
        updateRole(roleId, { permissions: next });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">Panel Settings</h2>
                    <p className="text-slate-400 text-sm">Manage users, roles, and permissions</p>
                </div>
            </div>

            <TechTabControl 
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                    ...(canManageUsers ? [{ id: 'users', label: 'Users', icon: <UserIcon className="w-4 h-4" /> }] : []),
                    ...(canManageRoles ? [{ id: 'roles', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" /> }] : []),
                    { id: 'online', label: 'Online', icon: <Activity className="w-4 h-4" /> },
                    ...(canViewLogs ? [{ id: 'logs', label: 'Audit Logs', icon: <FileText className="w-4 h-4" /> }] : []),
                ]}
            />

            <div className="flex-1 overflow-y-auto pr-2">
            
            {activeTab === 'roles' && canManageRoles && (
                <div className="space-y-8">
                    <div className="flex gap-4 items-end bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Create New Role</label>
                            <input 
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-cyan-500"
                                placeholder="e.g. Moderator"
                            />
                        </div>
                        <button onClick={handleAddRole} disabled={!newRoleName} className="px-4 py-2 bg-cyan-600 text-white rounded font-bold disabled:opacity-50">
                            Create
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {roles.map(role => (
                            <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                                    <div className="flex items-center gap-2">
                                        <Shield className={cn("w-5 h-5", role.color)} />
                                        <span className={cn("font-bold uppercase", role.color)}>{role.name}</span>
                                        {role.isSystem && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">SYSTEM</span>}
                                    </div>
                                    {!role.isSystem && (
                                        <button onClick={() => removeRole(role.id)} className="text-slate-500 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'view_dashboard', label: 'View Dashboard' },
                                        { id: 'manage_users', label: 'Manage Users' },
                                        { id: 'manage_roles', label: 'Manage Roles' },
                                        { id: 'manage_workspaces', label: 'Manage Workspaces' },
                                        { id: 'edit_game_settings', label: 'Edit Game Settings' },
                                        { id: 'edit_planning', label: 'Edit Planning Board' },
                                        { id: 'edit_network', label: 'Edit 3D Network' },
                                        { id: 'view_logs', label: 'View Audit Logs' },
                                    ].map(perm => (
                                        <label key={perm.id} className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded cursor-pointer">
                                            <span className="text-sm text-slate-300">{perm.label}</span>
                                            <input 
                                                type="checkbox"
                                                disabled={role.id === 'owner'} // Owner always has all
                                                checked={role.permissions.includes(perm.id as any)}
                                                onChange={() => togglePermission(role.id, perm.id)}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && canManageUsers && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add User
                        </button>
                    </div>

                    {/* Add User Form */}
                    {isAdding && (
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-lg font-bold text-white mb-4">New User Details</h3>
                            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                                    <input 
                                        value={newUser.username}
                                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                        placeholder="e.g. jdoe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                                    <input 
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                        placeholder="••••••"
                                        type="password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                                    <select 
                                        value={newUser.roleId}
                                        onChange={e => setNewUser({...newUser, roleId: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* User List */}
                    <div className="grid grid-cols-1 gap-4">
                        {users.map(user => {
                            const userRole = roles.find(r => r.id === user.roleId);
                            return (
                            <div key={user.username} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 uppercase",
                                        userRole?.color ? userRole.color.replace('text-', 'bg-').replace('400', '500') : "bg-slate-500"
                                    )}>
                                        {user.username.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white flex items-center gap-2">
                                            {user.username}
                                            {user.username === currentUser?.username && (
                                                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">YOU</span>
                                            )}
                                            {user.isDedicated && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">DEDICATED</span>
                                            )}
                                        </h4>
                                        <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider mt-0.5", userRole?.color)}>
                                            <Shield className="w-3 h-3" />
                                            {userRole?.name || 'Unknown Role'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <select 
                                        value={user.roleId}
                                        disabled={user.isDedicated || user.username === currentUser?.username} 
                                        onChange={(e) => updateUser(user.username, { roleId: e.target.value })}
                                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                                    >
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>

                                    <button 
                                        onClick={() => removeUser(user.username)}
                                        disabled={user.isDedicated || user.username === currentUser?.username}
                                        className="p-2 hover:bg-red-900/20 text-slate-500 hover:text-red-400 rounded transition-colors disabled:opacity-0"
                                        title="Remove User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            )}

            {activeTab === 'online' && (
                <div className="space-y-4">
                    {onlineUsers.length === 0 ? (
                        <div className="text-center text-slate-500 py-12">No users currently online (or server disconnected).</div>
                    ) : (
                        onlineUsers.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 uppercase",
                                            "bg-slate-700" // simplified color for online list or fetch role color if possible
                                        )}>
                                            {u.username?.substring(0, 2)}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{u.username}</div>
                                        <div className="text-xs text-slate-500 uppercase">{u.role}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-cyan-400 font-mono mb-1">
                                        {u.location?.replace('/', '') || 'Unknown'}
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                        ID: {u.id.substring(0,8)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'logs' && canViewLogs && (
                <div className="space-y-2 font-mono text-sm">
                    {adminLogs.length === 0 ? (
                        <div className="text-center text-slate-500 py-12">No activity logs recorded.</div>
                    ) : (
                        adminLogs.map((log: any) => (
                            <div key={log.id} className="flex gap-4 p-3 border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                                <div className="text-slate-500 min-w-[140px]">
                                    {new Date(log.timestamp).toLocaleString()}
                                </div>
                                <div className="text-cyan-400 font-bold min-w-[100px]">
                                    {log.user}
                                </div>
                                <div className="text-white">
                                    <span className="text-purple-400 mr-2">[{log.action}]</span>
                                    {log.details}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            </div>
        </div>
    );
}
