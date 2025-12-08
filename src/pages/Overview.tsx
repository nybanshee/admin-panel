import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, DollarSign, TrendingUp, Zap, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { TechCard } from '../components/TechCard';

const stats = [
  {
    label: 'Total Users',
    value: '12,345',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    shadow: 'shadow-cyan-500/20'
  },
  {
    label: 'Active Sessions',
    value: '423',
    change: '+5%',
    trend: 'up',
    icon: Zap,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    shadow: 'shadow-yellow-500/20'
  },
  {
    label: 'System Load',
    value: '34%',
    change: '-2%',
    trend: 'down',
    icon: Activity,
    color: 'text-green-400',
    borderColor: 'border-green-500/50',
    shadow: 'shadow-green-500/20'
  },
  {
    label: 'Revenue',
    value: '$45,231',
    change: '+8%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    shadow: 'shadow-purple-500/20',
    isExpandable: true,
    details: [
        { label: 'Robux', value: 'R$ 12,000,000', subValue: '($42,000)' },
        { label: 'DevEx Rate', value: '0.0035', subValue: 'USD/R$' },
        { label: 'IRL Donations', value: '$3,231', subValue: 'via Stripe' },
    ]
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function Overview() {
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  const toggleStat = (label: string) => {
    if (expandedStat === label) {
        setExpandedStat(null);
    } else {
        setExpandedStat(label);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
            System <span className="text-cyan-500">Overview</span>
        </h1>
        <div className="flex items-center space-x-2 text-sm text-cyan-500 font-mono bg-cyan-950/30 px-3 py-1 border border-cyan-500/30 rounded">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>LIVE</span>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            onClick={() => {
                // @ts-ignore
                if (stat.isExpandable) toggleStat(stat.label);
            }}
            className={cn(
                "relative overflow-hidden rounded-none border-l-4 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-300",
                stat.borderColor,
                // Custom clip path for angular look
                "[clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]",
                // @ts-ignore
                stat.isExpandable ? "cursor-pointer hover:bg-slate-800/80" : ""
            )}
          >
            {/* Background glow */}
            <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl", stat.color.replace('text-', 'bg-'))} />
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  {stat.label}
                  {/* @ts-ignore */}
                  {stat.isExpandable && (
                    <ChevronDown className={cn("w-3 h-3 transition-transform", expandedStat === stat.label && "rotate-180")} />
                  )}
                </p>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {stat.value}
                  </span>
                  <span
                    className={cn(
                      "ml-2 text-xs font-bold",
                      stat.trend === 'up' ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={cn("p-2 rounded border bg-slate-950/50", stat.color, stat.borderColor.replace('border-l-4', 'border'))}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {/* @ts-ignore */}
                {expandedStat === stat.label && stat.details && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 mt-4 border-t border-slate-800 space-y-3">
                             {/* @ts-ignore */}
                            {stat.details.map((detail, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">{detail.label}</span>
                                    <div className="text-right">
                                        <div className="text-white font-bold">{detail.value}</div>
                                        <div className="text-[10px] text-slate-500">{detail.subValue}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <TechCard
            delay={0.4}
            className="lg:col-span-4"
        >
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Activity Overview</h3>
                <TrendingUp className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="h-[300px] flex items-center justify-center rounded border border-dashed border-slate-700 bg-slate-950/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">[ VISUALIZATION MODULE LOADING... ]</p>
                </div>
                {/* Decorative grid lines simulating a chart */}
                <div className="w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #22d3ee 25%, #22d3ee 26%, transparent 27%, transparent 74%, #22d3ee 75%, #22d3ee 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #22d3ee 25%, #22d3ee 26%, transparent 27%, transparent 74%, #22d3ee 75%, #22d3ee 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div>
            </div>
        </TechCard>

        <TechCard
            delay={0.5}
            className="lg:col-span-3"
        >
            <h3 className="mb-6 text-lg font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Recent Actions</h3>
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center group">
                        <div className="h-2 w-2 rounded-none bg-cyan-500 rotate-45 group-hover:bg-purple-500 transition-colors duration-300" />
                        <div className="ml-4 space-y-1 flex-1">
                            <p className="text-sm font-bold text-slate-200 leading-none group-hover:text-cyan-400 transition-colors">User action sequence {i}</p>
                            <p className="text-[10px] text-slate-500 font-mono uppercase">2 minutes ago • ID: 8X{i}92</p>
                        </div>
                        <div className="h-px w-8 bg-slate-800 group-hover:bg-cyan-500/50 transition-colors" />
                    </div>
                ))}
            </div>
        </TechCard>
      </div>
    </div>
  );
}
