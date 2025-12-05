import { useState } from 'react';
import { Header } from './components/Header';
import { TokenOverview } from './components/TokenOverview';
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

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2">
            <HoldersGrowthChart />
          </div>
          <div className="xl:col-span-1">
            <WhaleAlertsFeed />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WhaleActivityChart />
          <TokenFlowHeatmap />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TokenDistributionChart />
          <EasyConnectSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
