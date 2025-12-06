import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';

interface DistributionData {
  name: string;
  value: number;
  color: string;
  walletCount: number;
}

// Mock data - no RPC endpoint available, backend aggregation required
const MOCK_DATA: DistributionData[] = [
  { name: 'Top 1-3 Wallets', value: 18.4, color: '#ef4444', walletCount: 3 },
  { name: 'Top 4-10 Wallets', value: 15.8, color: '#f59e0b', walletCount: 7 },
  { name: 'Top 11-50 Wallets', value: 24.2, color: '#9B5CFF', walletCount: 40 },
  { name: 'Retail Holders', value: 41.6, color: '#00F5FF', walletCount: 1250 }
];

export function TokenDistributionChart() {
  // Mock data only - no RPC endpoint available
  const data = useMemo(() => MOCK_DATA, []);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="mb-6">
        <h3 className="text-white mb-1">Token Distribution</h3>
        <p className="text-white/60 text-sm">
          📊 Mock data (backend aggregation required)
        </p>
      </div>

      <div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1f2e', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm truncate">{item.name}</p>
                <p className="text-white text-sm">{item.value.toFixed(1)}% ({item.walletCount} wallets)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
