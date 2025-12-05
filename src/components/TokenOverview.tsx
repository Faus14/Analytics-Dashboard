import { Users, TrendingUp, Shield, Droplet, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface TokenOverviewProps {
  selectedToken: string;
}

export function TokenOverview({ selectedToken }: TokenOverviewProps) {
  const metrics = [
    {
      title: 'Token Name & Contract',
      value: selectedToken,
      subtitle: '0x742d...9f4a',
      icon: Shield,
      color: 'cyan',
      tooltip: 'Token identifier and contract address'
    },
    {
      title: 'Current Holders',
      value: '12,847',
      change: '+3.2%',
      icon: Users,
      color: 'cyan',
      tooltip: 'Total number of unique token holders'
    },
    {
      title: 'New Holders (24h)',
      value: '247',
      change: '+12.4%',
      icon: TrendingUp,
      color: 'violet',
      tooltip: 'New holders in the last 24 hours'
    },
    {
      title: 'Concentration Score',
      value: '34.2%',
      subtitle: 'Top 10 wallets',
      icon: AlertTriangle,
      color: 'yellow',
      tooltip: 'Percentage held by top 10 wallets'
    },
    {
      title: 'Liquidity Health',
      value: 'Good',
      subtitle: '$2.4M locked',
      icon: Droplet,
      color: 'cyan',
      tooltip: 'Current liquidity pool status'
    },
    {
      title: 'Volume 24h',
      value: '$847K',
      change: '+24.6%',
      icon: Activity,
      color: 'violet',
      tooltip: 'Trading volume in the last 24 hours'
    },
    {
      title: 'Risk Score',
      value: '32/100',
      subtitle: 'Low Risk',
      icon: CheckCircle,
      color: 'green',
      tooltip: 'Overall risk assessment (0-100)'
    },
    {
      title: 'Growth Score',
      value: '78/100',
      subtitle: 'High Growth',
      icon: TrendingUp,
      color: 'green',
      tooltip: 'Growth potential indicator (0-100)'
    }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-white/80 mb-6">Token Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </section>
  );
}
