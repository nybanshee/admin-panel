import { motion } from 'framer-motion';
import { TechCard } from '../components/TechCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

const progressionData = [
  { day: 'Mon', xp: 4000, level: 12 },
  { day: 'Tue', xp: 3000, level: 12 },
  { day: 'Wed', xp: 2000, level: 13 },
  { day: 'Thu', xp: 2780, level: 13 },
  { day: 'Fri', xp: 1890, level: 14 },
  { day: 'Sat', xp: 2390, level: 14 },
  { day: 'Sun', xp: 3490, level: 15 },
];

const unlocksData = [
  { level: 1, unlocks: 2, xpReq: 100 },
  { level: 5, unlocks: 5, xpReq: 500 },
  { level: 10, unlocks: 3, xpReq: 1500 },
  { level: 15, unlocks: 8, xpReq: 3000 },
  { level: 20, unlocks: 4, xpReq: 6000 },
  { level: 25, unlocks: 6, xpReq: 10000 },
  { level: 30, unlocks: 2, xpReq: 15000 },
];

export function Graphs() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
          <span className="text-green-500">Progression</span> Analytics
        </h1>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TechCard delay={0.1} className="h-[400px]">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-700 pb-2">
                User Progression (XP Gained)
            </h3>
            <ResponsiveContainer width="100%" height="85%" minHeight={200}>
                <AreaChart data={progressionData}>
                    <defs>
                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#06b6d4', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#06b6d4" fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
            </ResponsiveContainer>
        </TechCard>

        <TechCard delay={0.2} className="h-[400px]">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-700 pb-2">
                Level Unlocks Distribution
            </h3>
            <ResponsiveContainer width="100%" height="85%" minHeight={200}>
                <BarChart data={unlocksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="level" stroke="#94a3b8" label={{ value: 'Level', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#a855f7', color: '#fff' }}
                        cursor={{ fill: '#1e293b' }}
                    />
                    <Bar dataKey="unlocks" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </TechCard>
        
        <TechCard delay={0.3} className="h-[400px] lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-700 pb-2">
                XP Requirement Curve
            </h3>
            <ResponsiveContainer width="100%" height="85%" minHeight={200}>
                <LineChart data={unlocksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="level" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#22c55e', color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="xpReq" stroke="#22c55e" strokeWidth={3} dot={{ r: 6, fill: '#22c55e' }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </TechCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <TechCard className="h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-700 pb-2">Weapon Usage</h3>
          <ResponsiveContainer width="100%" height="85%" minHeight={200}>
            <BarChart data={weaponUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="weapon" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#06b6d4', color: '#fff' }} />
              <Bar dataKey="picks" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </TechCard>

        <TechCard className="h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-700 pb-2">Accuracy Over Time</h3>
          <ResponsiveContainer width="100%" height="85%" minHeight={200}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#22d3ee', color: '#fff' }} />
              <Line type="monotone" dataKey="acc" stroke="#22d3ee" strokeWidth={3} dot={{ r: 5, fill: '#22d3ee' }} />
            </LineChart>
          </ResponsiveContainer>
        </TechCard>

        <TechCard className="h-[300px] lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-700 pb-2">Lifetime Totals</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Shots Fired', value: 152340 },
              { label: 'Hits', value: 50321 },
              { label: 'Kills', value: 12345 },
              { label: 'Attachments Used', value: 874 },
            ].map((s)=> (
              <div key={s.label} className="p-4 bg-slate-900 border border-slate-800 rounded">
                <div className="text-xs text-slate-500 uppercase">{s.label}</div>
                <div className="text-2xl font-black text-white">{s.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </TechCard>
      </div>
    </div>
  );
}
const weaponUsage = [
  { weapon: 'AK-47', picks: 120 },
  { weapon: 'M4A1', picks: 160 },
  { weapon: 'MP5', picks: 200 },
  { weapon: 'Deagle', picks: 90 },
];

const accuracyData = [
  { day: 'Mon', acc: 28 },
  { day: 'Tue', acc: 31 },
  { day: 'Wed', acc: 27 },
  { day: 'Thu', acc: 33 },
  { day: 'Fri', acc: 35 },
  { day: 'Sat', acc: 34 },
  { day: 'Sun', acc: 36 },
];

const kdData = [
  { day: 'Mon', kd: 1.1 },
  { day: 'Tue', kd: 1.0 },
  { day: 'Wed', kd: 1.2 },
  { day: 'Thu', kd: 1.3 },
  { day: 'Fri', kd: 1.4 },
  { day: 'Sat', kd: 1.25 },
  { day: 'Sun', kd: 1.35 },
];
