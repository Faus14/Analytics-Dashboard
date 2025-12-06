import { useState } from 'react';
import { Header } from './components/Header';
import { TokenOverview } from './components/TokenOverview';
import { TokenAnalyzer } from './components/TokenAnalyzer';
import { NetworkStatsCard } from './components/NetworkStatsCard';
import { RecentTransactionsTable } from './components/RecentTransactionsTable';
import { ChainHealthMonitor } from './components/ChainHealthMonitor';
import { HoldersGrowthChart } from './components/HoldersGrowthChart';
import { WhaleActivityChart } from './components/WhaleActivityChart';
import { TokenFlowHeatmap } from './components/TokenFlowHeatmap';
import { WhaleAlertsFeed } from './components/WhaleAlertsFeed';
import { TokenDistributionChart } from './components/TokenDistributionChart';
import { EasyConnectSection } from './components/EasyConnectSection';
import { Footer } from './components/Footer';

export default function App() {
  const [selectedToken, setSelectedToken] = useState('QUBIC-ALPHA');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0F16] text-white">
      <Header 
        onSelectToken={() => setSelectedToken('QUBIC-ALPHA')}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-[1600px]">
        {/* Token Overview Section */}
        <TokenOverview selectedToken={selectedToken} />

        {/* 🚀 TOKEN ANALYZER - Event-Based Buy/Sell Tracking */}
        <div className="mb-8">
          <TokenAnalyzer />
        </div>

        {/* Network Statistics - Live from Qubic RPC */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NetworkStatsCard />
            </div>
            <div className="lg:col-span-1">
              <ChainHealthMonitor />
            </div>
          </div>
        </div>

        {/* Real-time Analytics Charts - Connected to Qubic RPC */}
        <div className="mb-8">
          <h2 className="text-white/80 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Data from Qubic RPC
          </h2>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <RecentTransactionsTable />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <WhaleActivityChart />
            <WhaleAlertsFeed />
          </div>
        </div>

        {/* Mock Data Charts - Require Backend Service */}
        <div className="mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <h2 className="text-yellow-500 font-semibold mb-2 flex items-center gap-2">
              ⚠️ Mock Data Section
            </h2>
            <p className="text-yellow-500/80 text-sm">
              These charts display sample data. To show real-time data, a backend service is required to aggregate historical blockchain data.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <HoldersGrowthChart />
            </div>
            <div className="xl:col-span-1">
              <TokenDistributionChart />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TokenFlowHeatmap />
            <EasyConnectSection />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
