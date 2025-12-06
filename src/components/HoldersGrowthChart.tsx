import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useMemo } from 'react';

interface HolderDataPoint {
  date: string;
  tick: number;
  holders: number;
}

// Mock data - no RPC endpoint available, backend aggregation required
const MOCK_DATA: HolderDataPoint[] = [
  { date: 'Jan 15', holders: 8420, tick: 0 },
  { date: 'Jan 22', holders: 9150, tick: 0 },
  { date: 'Jan 29', holders: 9680, tick: 0 },
  { date: 'Feb 05', holders: 10240, tick: 0 },
  { date: 'Feb 12', holders: 10890, tick: 0 },
  { date: 'Feb 19', holders: 11420, tick: 0 },
  { date: 'Feb 26', holders: 11950, tick: 0 },
  { date: 'Mar 05', holders: 12380, tick: 0 },
  { date: 'Mar 12', holders: 12847, tick: 0 }
];

export function HoldersGrowthChart() {
  // Mock data only - no RPC endpoint available
  const data = useMemo(() => MOCK_DATA, []);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white mb-1">Holders Growth</h3>
          <p className="text-white/60 text-sm">
            📊 Mock data (backend aggregation required)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]" />
            <span className="text-sm text-white/60">Holders</span>
          </div>
        </div>
      </div>

      <div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="holdersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#9B5CFF" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#9B5CFF" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00F5FF" />
                <stop offset="100%" stopColor="#9B5CFF" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
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
            />
            <Area 
              type="monotone" 
              dataKey="holders" 
              stroke="url(#lineGradient)" 
              strokeWidth={3}
              fill="url(#holdersGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
