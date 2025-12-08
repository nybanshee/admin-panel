import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Terminal, Settings, DollarSign, TrendingUp, StickyNote, Users, LogOut, Database, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuthStore, hasPermission } from '../store/auth';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/', perm: 'view_dashboard' },
  { icon: Terminal, label: 'Logs', path: '/logs', perm: 'view_logs' },
  { icon: DollarSign, label: 'Economy', path: '/economy' },
  { icon: Settings, label: 'Game Settings', path: '/settings' },
  { icon: TrendingUp, label: 'Graphs', path: '/graphs' },
  { icon: StickyNote, label: 'Planning', path: '/planning' },
  { icon: UserCircle, label: 'Personal Settings', path: '/personal' },
  { icon: Users, label: 'Panel Settings', path: '/admin', customCheck: (u: any, r: any) => 
    hasPermission(u, r, 'manage_users') || 
    hasPermission(u, r, 'manage_roles') || 
    hasPermission(u, r, 'view_logs') 
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const roles = useAuthStore(s => s.roles);
  const workspace = useAuthStore(s => s.workspace);
  const logout = useAuthStore(s => s.logout);

  const filteredItems = sidebarItems.filter(item => {
    // If user is Owner, show everything regardless of checks
    if (user?.roleId === 'owner') return true;
    
    if (item.customCheck) return item.customCheck(user, roles);
    if (item.perm) return hasPermission(user, roles, item.perm as any);
    return true;
  });

  const handleLogout = () => {
    logout();
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleSwitchWorkspace = () => {
    navigate('/workspace');
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed md:relative left-0 top-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white shadow-2xl flex flex-col md:flex hidden shrink-0"
    >
      <div className="flex h-20 items-center justify-center border-b border-slate-800 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse" />
        <h1 className="text-2xl font-black tracking-widest text-white z-10">
          ADMIN<span className="text-cyan-400">PANEL</span>
        </h1>
      </div>

      <nav className="mt-8 space-y-2 px-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                // Cut corner shape
                "[clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                )} />
                
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-transform duration-300",
                    isActive ? "scale-110 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "group-hover:scale-110 group-hover:text-white"
                  )}
                />
                <span className="tracking-wide uppercase text-xs font-bold">{item.label}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="active-glow"
                    className="absolute inset-0 bg-cyan-400/5 -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 space-y-4 shrink-0 bg-slate-950 border-t border-slate-800">
        <div className="relative overflow-hidden rounded-none border border-slate-800 bg-slate-900 p-3 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
            <div className="flex items-center gap-3 relative z-10">
                <div className="h-8 w-8 bg-cyan-500 flex items-center justify-center font-bold text-slate-900 text-xs shadow-[0_0_15px_rgba(6,182,212,0.5)] uppercase">
                    {user?.username?.substring(0, 2) || 'OP'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase text-white tracking-wider truncate">{user?.username || 'Operator'}</p>
                    <p className="text-[10px] text-cyan-400 uppercase truncate">{workspace?.name || 'No Workspace'}</p>
                </div>
            </div>
            {/* Decor elements */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30" />
        </div>

        <div className="flex gap-2">
            <button 
                onClick={handleSwitchWorkspace}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-400 hover:text-cyan-400 transition-colors uppercase font-bold"
                title="Switch Workspace"
            >
                <Database className="w-4 h-4" />
                WS
            </button>
            <button 
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-400 hover:text-red-400 transition-colors uppercase font-bold"
                title="Logout"
            >
                <LogOut className="w-4 h-4" />
                Exit
            </button>
        </div>
      </div>
    </motion.aside>
  );
}

export function MobileNavbar() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const roles = useAuthStore(s => s.roles);

  const filteredItems = sidebarItems.filter(item => {
    // If user is Owner, show everything regardless of checks
    if (user?.roleId === 'owner') return true;

    if (item.customCheck) return item.customCheck(user, roles);
    if (item.perm) return hasPermission(user, roles, item.perm as any);
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800 z-50 flex justify-around p-2">
        {filteredItems.map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                    cn(
                        "p-2 rounded-lg flex flex-col items-center gap-1",
                        isActive ? "text-cyan-400" : "text-slate-500"
                    )
                }
            >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold">{item.label}</span>
            </NavLink>
        ))}
    </div>
  );
}
