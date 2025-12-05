import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Fish } from 'lucide-react';

const data = [
  { wallet: 'Whale #1', buys: 12500, sells: -8200, net: 4300 },
  { wallet: 'Whale #2', buys: 9800, sells: -15000, net: -5200 },
  { wallet: 'Whale #3', buys: 18200, sells: -3500, net: 14700 },
  { wallet: 'Whale #4', buys: 6700, sells: -6900, net: -200 },
  { wallet: 'Whale #5', buys: 14300, sells: -11000, net: 3300 },
  { wallet: 'Whale #6', buys: 8900, sells: -2100, net: 6800 }
];

export function WhaleActivityChart() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white mb-1 flex items-center gap-2">
            <Fish className="w-5 h-5 text-[#00F5FF]" />
            Whale Activity
          </h3>
          <p className="text-white/60 text-sm">Large wallet movements (buys vs sells)</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#00F5FF]" />
            <span className="text-white/60">Net Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-white/60">Net Negative</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="wallet" 
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1f2e', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toLocaleString()} tokens`, '']}
          />
          <Bar dataKey="net" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#00F5FF' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
