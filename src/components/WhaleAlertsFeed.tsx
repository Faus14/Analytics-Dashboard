import { TrendingDown, TrendingUp, Droplet, AlertTriangle, Fish, Wallet } from 'lucide-react';

const events = [
  {
    id: 1,
    type: 'whale_sell',
    message: 'Whale #1 sold 4,200 tokens',
    impact: 'High',
    timestamp: '2 min ago',
    icon: Fish,
    color: 'red'
  },
  {
    id: 2,
    type: 'new_wallet',
    message: 'New wallet purchased 1,500 tokens',
    impact: 'Medium',
    timestamp: '5 min ago',
    icon: Wallet,
    color: 'green'
  },
  {
    id: 3,
    type: 'liquidity',
    message: 'Liquidity dropped 22%',
    impact: 'High',
    timestamp: '12 min ago',
    icon: Droplet,
    color: 'red'
  },
  {
    id: 4,
    type: 'whale_buy',
    message: 'Whale #3 purchased 8,500 tokens',
    impact: 'High',
    timestamp: '18 min ago',
    icon: TrendingUp,
    color: 'green'
  },
  {
    id: 5,
    type: 'warning',
    message: 'Concentration increased to 34.2%',
    impact: 'Medium',
    timestamp: '25 min ago',
    icon: AlertTriangle,
    color: 'yellow'
  },
  {
    id: 6,
    type: 'whale_sell',
    message: 'Whale #2 sold 2,100 tokens',
    impact: 'Medium',
    timestamp: '34 min ago',
    icon: TrendingDown,
    color: 'red'
  },
  {
    id: 7,
    type: 'new_wallet',
    message: 'New wallet purchased 890 tokens',
    impact: 'Low',
    timestamp: '41 min ago',
    icon: Wallet,
    color: 'green'
  },
  {
    id: 8,
    type: 'whale_buy',
    message: 'Whale #5 purchased 3,200 tokens',
    impact: 'Medium',
    timestamp: '52 min ago',
    icon: TrendingUp,
    color: 'green'
  }
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'Low': return 'text-green-500 bg-green-500/10 border-green-500/20';
    default: return 'text-white/60 bg-white/5 border-white/10';
  }
};

const getEventIconColor = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'yellow': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'green': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-white/10 text-white border-white/20';
  }
};

export function WhaleAlertsFeed() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="mb-6">
        <h3 className="text-white mb-1">Whale Alerts & Risk Events</h3>
        <p className="text-white/60 text-sm">Live feed of significant activities</p>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <div
              key={event.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getEventIconColor(event.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm mb-2">{event.message}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded border ${getImpactColor(event.impact)}`}>
                      {event.impact} impact
                    </span>
                    <span className="text-white/40 text-xs">{event.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
