import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getTickInfo } from '../services/qubic';

interface TickContextType {
  currentTick: number;
  epoch: number;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TickContext = createContext<TickContextType | undefined>(undefined);

export function TickProvider({ children }: { children: React.ReactNode }) {
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [epoch, setEpoch] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTick = useCallback(async () => {
    try {
      const info = await getTickInfo();
      if (info?.tickInfo) {
        setCurrentTick(info.tickInfo.tick);
        setEpoch(info.tickInfo.epoch);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (e) {
      console.error('Failed to fetch tick info:', e);
      if (currentTick === 0) {
        setError(e instanceof Error ? e.message : 'Failed to fetch tick info');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTick]);

  const refresh = useCallback(async () => {
    await fetchTick();
  }, [fetchTick]);

  useEffect(() => {
    fetchTick();
    // Update every 60 seconds to avoid rate limiting
    const interval = setInterval(fetchTick, 60000);
    return () => clearInterval(interval);
  }, [fetchTick]);

  return (
    <TickContext.Provider
      value={{
        currentTick,
        epoch,
        lastUpdate,
        isLoading,
        error,
        refresh,
      }}
    >
      {children}
    </TickContext.Provider>
  );
}

export function useTick() {
  const context = useContext(TickContext);
  if (context === undefined) {
    throw new Error('useTick must be used within a TickProvider');
  }
  return context;
}
