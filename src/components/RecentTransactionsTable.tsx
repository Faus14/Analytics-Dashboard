import { Activity, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getTransactionsByTickRange } from '../services/qubic';
import { useTick } from '../contexts/TickContext';

interface TransactionData {
  id: string;
  type: string;
  amount: string;
  tick: number;
}

export function RecentTransactionsTable() {
  const { currentTick } = useTick(); // Use shared tick from context
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (currentTick === 0) return; // Wait for tick to be available

    try {
      // Use safe tick range - go back ~100 ticks to ensure they're fully processed
      // There's a processing delay between current tick and indexed transactions
      const safeTick = currentTick - 100;
      const startTick = Math.max(0, safeTick - 10);
      const endTick = Math.max(0, safeTick);
      
      if (startTick >= endTick) return; // Skip if invalid range
      
      const allTxs = await getTransactionsByTickRange(startTick, endTick);
      
      // Convert to display format - take first 10
      const displayTxs: TransactionData[] = allTxs
        .slice(0, 10)
        .map((tx, idx) => ({
          id: tx.txId || `tx-${idx}`,
          type: 'Transfer',
          amount: tx.amount ? `${(BigInt(tx.amount) / BigInt(1000000000)).toLocaleString()} QU` : '0 QU',
          tick: tx.tickNumber || 0
        }));
      
      setTransactions(displayTxs);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
      if (transactions.length === 0) setError(e instanceof Error ? e.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentTick, transactions.length]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="text-white font-semibold">Recent Transactions</h3>
          {!error && <span className="text-xs text-green-400 font-medium">● LIVE</span>}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Refresh transactions"
        >
          <RefreshCw className={`w-4 h-4 text-[#00F5FF] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-white/60 text-sm mb-4">Last 10 transactions from recent ticks</p>

      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-white/60">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-32 text-red-400">
          <p className="mb-2 text-sm">{error}</p>
          <button 
            onClick={handleRefresh}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded transition-all"
          >
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-white/60">No transactions detected</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60 text-xs uppercase">
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Amount (QU)</th>
                <th className="text-left py-3 px-2">Tick</th>
                <th className="text-left py-3 px-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5 transition-all"
                >
                  <td className="py-3 px-2 text-white/80">{tx.type}</td>
                  <td className="py-3 px-2 text-[#00F5FF] font-bold">{tx.amount}</td>
                  <td className="py-3 px-2 text-white/60">{tx.tick}</td>
                  <td className="py-3 px-2 text-white/60 font-mono text-xs">{tx.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-white/40 flex justify-between border-t border-white/10 pt-4">
        <div>Current Tick: {currentTick}</div>
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
