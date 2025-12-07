import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Terminal, Settings, DollarSign, TrendingUp, StickyNote } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/' },
  { icon: Terminal, label: 'Logs', path: '/logs' },
  { icon: DollarSign, label: 'Economy', path: '/economy' },
  { icon: Settings, label: 'Game Settings', path: '/settings' },
  { icon: TrendingUp, label: 'Graphs', path: '/graphs' },
  { icon: StickyNote, label: 'Planning', path: '/planning' },
];

export function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white shadow-2xl"
    >
      <div className="flex h-20 items-center justify-center border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse" />
        <h1 className="text-2xl font-black tracking-widest text-white z-10">
          ADMIN<span className="text-cyan-400">PANEL</span>
        </h1>
      </div>

      <nav className="mt-8 space-y-2 px-4">
        {sidebarItems.map((item) => (
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

      <div className="absolute bottom-8 w-full px-4">
        <div className="relative overflow-hidden rounded-none border border-slate-800 bg-slate-900 p-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
            <div className="flex items-center space-x-3 relative z-10">
                <div className="h-10 w-10 bg-cyan-500 flex items-center justify-center font-bold text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    OP
                </div>
                <div>
                    <p className="text-sm font-bold uppercase text-white tracking-wider">Operator</p>
                    <p className="text-[10px] text-cyan-400 uppercase">System Level 99</p>
                </div>
            </div>
            {/* Decor elements */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30" />
        </div>
      </div>
    </motion.aside>
  );
}
