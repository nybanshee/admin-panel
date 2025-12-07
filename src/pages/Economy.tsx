import { DollarSign, CreditCard, TrendingUp, ShoppingBag } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { motion } from 'framer-motion';

const transactions = [
  { id: 1, user: 'PlayerOne', item: 'Plasma Rifle', amount: -2500, date: '2 mins ago' },
  { id: 2, user: 'NinjaX', item: 'Health Pack', amount: -150, date: '5 mins ago' },
  { id: 3, user: 'ProGamer', item: 'Daily Reward', amount: +500, date: '12 mins ago' },
  { id: 4, user: 'NoobMaster', item: 'Skin Bundle', amount: -5000, date: '25 mins ago' },
  { id: 5, user: 'Admin', item: 'System Grant', amount: +100000, date: '1 hour ago' },
];

export function Economy() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
          <span className="text-cyan-500">Economy</span> Management
        </h1>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        <TechCard delay={0.1}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <DollarSign className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Currency</p>
              <h3 className="text-2xl font-bold text-white">14.2M</h3>
            </div>
          </div>
        </TechCard>
        
        <TechCard delay={0.2}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Purchases</p>
              <h3 className="text-2xl font-bold text-white">8,542</h3>
            </div>
          </div>
        </TechCard>

        <TechCard delay={0.3}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Inflation Rate</p>
              <h3 className="text-2xl font-bold text-white">2.4%</h3>
            </div>
          </div>
        </TechCard>

        <TechCard delay={0.4}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Avg. Balance</p>
              <h3 className="text-2xl font-bold text-white">1,250</h3>
            </div>
          </div>
        </TechCard>
      </div>

      <TechCard delay={0.5} className="mt-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <span className="w-1 h-6 bg-cyan-500 mr-3"></span>
            RECENT TRANSACTIONS
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
                    <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Item/Source</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{tx.user}</td>
                            <td className="px-6 py-4">{tx.item}</td>
                            <td className={`px-6 py-4 font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </td>
                            <td className="px-6 py-4 text-xs">{tx.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </TechCard>
    </div>
  );
}
