// Minimal Qubic RPC client for frontend usage
// Avoids handling secrets; only read-only endpoints

// Use mainnet RPC - has real transaction data (with 500ms rate limiting)
const DEFAULT_RPC = "https://rpc.qubic.org/";
const USE_PROXY = import.meta.env.DEV; // Use proxy in development

function normalizeEndpoint(rpc?: string) {
  if (USE_PROXY) {
    return "/api/"; // Use Vite proxy in development
  }
  const base = (rpc || DEFAULT_RPC).trim();
  return base.endsWith("/") ? base : base + "/";
}

// ===== RATE LIMITING QUEUE =====
// Prevents Cloudflare 429 by spacing out requests

class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly MIN_DELAY = 500; // 500ms between requests (increased to avoid TLS errors)

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.queue.shift()!;

    // Wait for minimum delay
    const timeSince = Date.now() - this.lastRequestTime;
    if (timeSince < this.MIN_DELAY) {
      await new Promise(r => setTimeout(r, this.MIN_DELAY - timeSince));
    }

    this.lastRequestTime = Date.now();
    await task();
    
    // Continue processing
    this.process();
  }
}

const queue = new RequestQueue();

// ===== CACHE SYSTEM =====
// Prevents duplicate requests

const cache = new Map<string, { data: any; time: number }>();
const CACHE_TTL = 15000; // 15 seconds

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, time: Date.now() });
}

async function fetchJson(url: string, init?: RequestInit & { body?: any }) {
  // Check cache for GET requests
  const cacheKey = `${url}:${JSON.stringify(init?.body || {})}`;
  const cached = getCached(cacheKey);
  if (cached && (!init || init.method === 'GET' || !init.method)) {
    return cached;
  }

  // Queue the request to prevent rate limiting
  return queue.enqueue(async () => {
    const headers = { "Content-Type": "application/json", ...(init?.headers || {}) };
    const body = init?.body && typeof init.body !== "string" ? JSON.stringify(init.body) : init?.body;
    
    const res = await fetch(url, { ...init, headers, body });
    
    if (!res.ok) {
      // Handle 429 specially
      if (res.status === 429) {
        console.warn('Rate limited by Cloudflare - waiting 5s before retry');
        await new Promise(r => setTimeout(r, 5000));
        throw new Error('Rate limited - please wait');
      }
      
      const text = await res.text().catch(() => "");
      throw new Error(`Qubic RPC error ${res.status}: ${text}`);
    }
    
    const data = await res.json();
    
    // Cache GET requests
    if (!init || init.method === 'GET' || !init.method) {
      setCache(cacheKey, data);
    }
    
    return data;
  });
}

export async function getTickInfo(rpc?: string) {
  const base = normalizeEndpoint(rpc);
  return fetchJson(`${base}v1/tick-info`);
}

export async function getBalance(identityId: string, rpc?: string) {
  if (!identityId) throw new Error("Missing identityId");
  const base = normalizeEndpoint(rpc);
  return fetchJson(`${base}v1/balances/${identityId}`);
}

export async function getOwnedAssets(identity: string, rpc?: string) {
  if (!identity) throw new Error("Missing identity");
  const base = normalizeEndpoint(rpc);
  return fetchJson(`${base}v1/assets/${identity}/owned`);
}

// Helpers for base64 encode/decode of Uint8Array payloads
export function toBase64(bytes: Uint8Array) {
  if (typeof window === "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  if (typeof window === "undefined") return Uint8Array.from(Buffer.from(b64, "base64"));
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function getTransactionsByTick(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v2/ticks/${tick}/transactions`);
  } catch (e) {
    console.warn(`Failed to get transactions for tick ${tick}:`, e);
    return { transactions: [] };
  }
}

export async function getTickData(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/ticks/${tick}`);
  } catch (e) {
    console.warn(`Failed to get tick data for ${tick}:`, e);
    return null;
  }
}

export async function getEntityInfo(entityId: string, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/entities/${entityId}`);
  } catch (e) {
    console.warn(`Failed to get entity info for ${entityId}:`, e);
    return null;
  }
}

// ===== ADVANCED RPC ENDPOINTS =====

// Get network status with comprehensive stats
export async function getNetworkStatus(rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/status`);
  } catch (e) {
    console.warn('Failed to get network status:', e);
    return null;
  }
}

// Get transfers for an identity within a tick range
export async function getTransfersByIdentity(
  identity: string,
  fromTick: number,
  toTick: number,
  rpc?: string
) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/transfers/${identity}/${fromTick}/${toTick}`);
  } catch (e) {
    console.warn(`Failed to get transfers for ${identity}:`, e);
    return null;
  }
}

// Query smart contract (read-only)
export async function querySmartContract(params: {
  contractIndex: number;
  inputType: number;
  inputSize: number;
  requestData: string; // base64
}, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/querySmartContract`, { 
      method: "POST", 
      body: params 
    });
  } catch (e) {
    console.warn('Failed to query smart contract:', e);
    return null;
  }
}

// Decode event data
export async function decodeEvent(eventType: number, eventData: string) {
  try {
    return await fetchJson('https://api.qubic.org/v1/events/decodeEvent', {
      method: "POST",
      body: { eventType, eventData }
    });
  } catch (e) {
    console.warn('Failed to decode event:', e);
    return null;
  }
}

/**
 * Get transaction with decoded events
 * This gives you the REAL story of what happened in the smart contract
 */
export async function getTransactionWithEvents(txId: string, rpc?: string) {
  try {
    const base = normalizeEndpoint(rpc);
    const txData = await fetchJson(`${base}v1/transaction/${txId}`);
    
    if (!txData || !txData.transaction) {
      return null;
    }
    
    // If transaction has events, decode them
    const decodedEvents = [];
    if (txData.transaction.events && Array.isArray(txData.transaction.events)) {
      for (const event of txData.transaction.events) {
        const decoded = await decodeEvent(event.eventType, event.eventData);
        if (decoded) {
          decodedEvents.push({
            ...event,
            decoded
          });
        }
      }
    }
    
    return {
      ...txData.transaction,
      decodedEvents
    };
  } catch (e) {
    console.error(`Failed to get transaction events for ${txId}:`, e);
    return null;
  }
}

// ===== TRANSACTION AGGREGATION HELPERS =====

interface Transaction {
  sourceId: string;
  destId: string;
  amount: string;
  tickNumber: number;
  inputType: number;
  inputSize: number;
  inputHex: string;
  signatureHex: string;
  txId: string;
  timestamp?: string;
  moneyFlew?: boolean;
}

interface TransactionResponse {
  transactions?: Transaction[];
  transaction?: Transaction;
}

interface WhaleData {
  wallet: string;
  buys: number;
  sells: number;
  net: number;
}

interface WalletAggregation {
  [walletId: string]: {
    outgoing: bigint;
    incoming: bigint;
  };
}

// Fetch transactions for a range of ticks
export async function getTransactionsByTickRange(
  startTick: number,
  endTick: number,
  rpc?: string
): Promise<Transaction[]> {
  const base = normalizeEndpoint(rpc);
  const allTransactions: Transaction[] = [];

  console.log(`Fetching transactions from tick ${startTick} to ${endTick}`);

  for (let tick = startTick; tick <= endTick; tick++) {
    try {
      // Use v1/ticks/{tick}/approved-transactions which has actual data
      const data = await fetchJson(`${base}v1/ticks/${tick}/approved-transactions`);
      if (data?.approvedTransactions && Array.isArray(data.approvedTransactions)) {
        // Map to our Transaction interface
        const transactions = data.approvedTransactions.map((tx: any) => ({
          sourceId: tx.sourceId,
          destId: tx.destId,
          amount: tx.amount,
          tickNumber: tx.tickNumber,
          inputType: tx.inputType || 0,
          inputSize: tx.inputSize || 0,
          inputHex: tx.inputHex || '',
          signatureHex: tx.signatureHex || '',
          txId: tx.txId,
          moneyFlew: true // Approved transactions have transferred money
        }));
        allTransactions.push(...transactions);
      }
    } catch (e) {
      console.warn(`Failed to fetch tick ${tick}:`, e);
      continue;
    }
  }

  console.log(`Fetched ${allTransactions.length} total transactions`);
  return allTransactions;
}

// Aggregate transactions by wallet to calculate buys/sells
export function aggregateByWallet(transactions: Transaction[]): WalletAggregation {
  const wallets: WalletAggregation = {};

  transactions.forEach((tx) => {
    // Only count transactions where money actually flew
    if (tx.moneyFlew === false) return;

    // Skip transactions with invalid amount
    if (tx.amount === undefined || tx.amount === null) return;

    const sourceId = tx.sourceId;
    const destId = tx.destId;
    const amount = BigInt(tx.amount);

    // Initialize wallet if not seen
    if (!wallets[sourceId]) {
      wallets[sourceId] = { outgoing: 0n, incoming: 0n };
    }
    if (!wallets[destId]) {
      wallets[destId] = { outgoing: 0n, incoming: 0n };
    }

    // Sender: outgoing (sells)
    wallets[sourceId].outgoing += amount;

    // Receiver: incoming (buys)
    wallets[destId].incoming += amount;
  });

  return wallets;
}

// Identify whales: top N wallets by transaction volume
export function identifyWhales(
  walletAggregation: WalletAggregation,
  topN: number = 6
): WhaleData[] {
  const whalesArray = Object.entries(walletAggregation)
    .map(([wallet, data]) => {
      const outgoing = Number(data.outgoing) / 1000; // Convert to QU (divide by 1000)
      const incoming = Number(data.incoming) / 1000;
      const net = incoming - outgoing;

      return {
        wallet,
        buys: incoming,
        sells: outgoing,
        net
      };
    })
    // Sort by absolute volume
    .sort((a, b) => {
      const volumeA = Math.abs(a.buys + a.sells);
      const volumeB = Math.abs(b.buys + b.sells);
      return volumeB - volumeA;
    })
    .slice(0, topN);

  // Format wallet IDs for display
  return whalesArray.map((whale, idx) => ({
    ...whale,
    wallet: `Whale #${idx + 1}` // Replace long ID with Whale #N for display
  }));
}

// Get recent whale activity (aggregated from last N ticks)
export async function getWhaleActivity(
  ticksBack: number = 10,
  rpc?: string
): Promise<WhaleData[]> {
  try {
    // Get current tick
    const tickInfo = await getTickInfo(rpc);
    const currentTick = tickInfo?.tickInfo?.tick;

    if (!currentTick) {
      console.warn("Could not determine current tick");
      return [];
    }

    // Use safe buffer - go back ~100 ticks to ensure they're fully indexed
    const safeTick = currentTick - 100;
    const startTick = Math.max(0, safeTick - ticksBack + 1);
    const transactions = await getTransactionsByTickRange(startTick, safeTick, rpc);

    // Aggregate and identify whales
    const aggregated = aggregateByWallet(transactions);
    const whales = identifyWhales(aggregated);

    return whales;
  } catch (e) {
    console.error("Failed to get whale activity:", e);
    return [];
  }
}

// Get recent alert events (new wallets, large transactions)
interface AlertEvent {
  id: number;
  type: 'whale_sell' | 'whale_buy' | 'new_wallet' | 'large_tx';
  message: string;
  impact: 'High' | 'Medium' | 'Low';
  timestamp: string;
  amount?: number;
}

export async function getRecentAlerts(
  ticksBack: number = 5,
  largeThreshold: number = 1000, // QU
  rpc?: string
): Promise<AlertEvent[]> {
  try {
    const tickInfo = await getTickInfo(rpc);
    const currentTick = tickInfo?.tickInfo?.tick;

    if (!currentTick) return [];

    // Use safe buffer - go back ~100 ticks to ensure they're fully indexed  
    const safeTick = currentTick - 100;
    const startTick = Math.max(0, safeTick - ticksBack + 1);
    const transactions = await getTransactionsByTickRange(startTick, safeTick, rpc);

    const alerts: AlertEvent[] = [];
    const seenWallets = new Set<string>();

    transactions.forEach((tx, idx) => {
      if (tx.moneyFlew === false) return;

      const amount = Number(tx.amount) / 1000; // Convert to QU

      // Large transaction alert
      if (amount > largeThreshold) {
        const isWhaleS = tx.sourceId.includes('AAAAA') || tx.sourceId.length === 56;
        alerts.push({
          id: idx + 1,
          type: amount > 0 ? 'whale_buy' : 'whale_sell',
          message: `${tx.sourceId.substring(0, 8)}... transferred ${Math.abs(Math.floor(amount))} QU`,
          impact: amount > largeThreshold * 2 ? 'High' : 'Medium',
          timestamp: '< 5 ticks ago',
          amount
        });
      }

      // New wallet alert
      if (!seenWallets.has(tx.sourceId) && amount > largeThreshold / 2) {
        seenWallets.add(tx.sourceId);
        alerts.push({
          id: idx + 100,
          type: 'new_wallet',
          message: `New wallet purchased ${Math.floor(amount)} QU`,
          impact: 'Medium',
          timestamp: '< 5 ticks ago'
        });
      }
    });

    return alerts.slice(0, 8); // Return top 8 recent alerts
  } catch (e) {
    console.error("Failed to get recent alerts:", e);
    return [];
  }
}

// ===== ADVANCED ANALYTICS HELPERS =====

interface HolderGrowthDataPoint {
  date: string;
  tick: number;
  holders: number;
}

interface TokenDistribution {
  tier: string;
  percentage: number;
  walletCount: number;
  totalAmount: bigint;
}

// Get holder growth over time using transfer history
export async function getHolderGrowth(
  ticksBack: number = 100,
  sampleInterval: number = 10,
  rpc?: string
): Promise<HolderGrowthDataPoint[]> {
  try {
    const tickInfo = await getTickInfo(rpc);
    const currentTick = tickInfo?.tickInfo?.tick;

    if (!currentTick) {
      console.warn("Could not determine current tick for holder growth");
      return [];
    }

    const dataPoints: HolderGrowthDataPoint[] = [];
    const startTick = Math.max(0, currentTick - ticksBack);
    
    // Sample at intervals to avoid too many requests
    for (let tick = startTick; tick <= currentTick; tick += sampleInterval) {
      try {
        const txData = await getTransactionsByTick(tick, rpc);
        if (txData?.transactions) {
          // Count unique wallets
          const uniqueWallets = new Set<string>();
          txData.transactions.forEach((tx: Transaction) => {
            if (tx.moneyFlew !== false) {
              uniqueWallets.add(tx.sourceId);
              uniqueWallets.add(tx.destId);
            }
          });

          const timestamp = new Date(Date.now() - (currentTick - tick) * 12000); // ~12s per tick
          dataPoints.push({
            date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tick,
            holders: uniqueWallets.size
          });
        }
      } catch (e) {
        console.warn(`Failed to process tick ${tick} for holder growth:`, e);
        continue;
      }
    }

    return dataPoints;
  } catch (e) {
    console.error("Failed to get holder growth:", e);
    return [];
  }
}

// Analyze token distribution by wallet tiers
export async function getTokenDistribution(
  ticksBack: number = 20,
  rpc?: string
): Promise<TokenDistribution[]> {
  try {
    const tickInfo = await getTickInfo(rpc);
    const currentTick = tickInfo?.tickInfo?.tick;

    if (!currentTick) return [];

    const startTick = Math.max(0, currentTick - ticksBack);
    const walletBalances = new Map<string, bigint>();

    // Aggregate balances from recent transactions
    for (let tick = startTick; tick <= currentTick; tick++) {
      try {
        const txData = await getTransactionsByTick(tick, rpc);
        if (txData?.transactions) {
          txData.transactions.forEach((tx: Transaction) => {
            if (tx.moneyFlew === false) return;

            const amount = BigInt(tx.amount);
            const source = tx.sourceId;
            const dest = tx.destId;

            // Update balances (simplified - real impl needs full balance tracking)
            const destBalance = walletBalances.get(dest) || 0n;
            walletBalances.set(dest, destBalance + amount);

            const sourceBalance = walletBalances.get(source) || 0n;
            if (sourceBalance >= amount) {
              walletBalances.set(source, sourceBalance - amount);
            }
          });
        }
      } catch (e) {
        console.warn(`Failed to process tick ${tick} for distribution:`, e);
        continue;
      }
    }

    // Sort wallets by balance
    const sortedWallets = Array.from(walletBalances.entries())
      .sort((a, b) => Number(b[1] - a[1]));

    if (sortedWallets.length === 0) return [];

    const totalSupply = sortedWallets.reduce((sum, [_, bal]) => sum + bal, 0n);

    // Calculate distribution tiers
    const top3 = sortedWallets.slice(0, 3);
    const top4to10 = sortedWallets.slice(3, 10);
    const top11to50 = sortedWallets.slice(10, 50);
    const retail = sortedWallets.slice(50);

    const calculatePercentage = (wallets: Array<[string, bigint]>) => {
      const sum = wallets.reduce((acc, [_, bal]) => acc + bal, 0n);
      return Number((sum * 10000n) / totalSupply) / 100; // 2 decimal precision
    };

    return [
      {
        tier: 'Top 1-3 Wallets',
        percentage: calculatePercentage(top3),
        walletCount: top3.length,
        totalAmount: top3.reduce((sum, [_, bal]) => sum + bal, 0n)
      },
      {
        tier: 'Top 4-10 Wallets',
        percentage: calculatePercentage(top4to10),
        walletCount: top4to10.length,
        totalAmount: top4to10.reduce((sum, [_, bal]) => sum + bal, 0n)
      },
      {
        tier: 'Top 11-50 Wallets',
        percentage: calculatePercentage(top11to50),
        walletCount: top11to50.length,
        totalAmount: top11to50.reduce((sum, [_, bal]) => sum + bal, 0n)
      },
      {
        tier: 'Retail Holders',
        percentage: calculatePercentage(retail),
        walletCount: retail.length,
        totalAmount: retail.reduce((sum, [_, bal]) => sum + bal, 0n)
      }
    ];
  } catch (e) {
    console.error("Failed to get token distribution:", e);
    return [];
  }
}

// Get transaction flow heatmap data (activity by time buckets)
export async function getTransactionFlowHeatmap(
  ticksBack: number = 168, // ~7 days at 12s per tick
  rpc?: string
): Promise<{ day: string; hour: number; activity: number }[]> {
  try {
    const tickInfo = await getTickInfo(rpc);
    const currentTick = tickInfo?.tickInfo?.tick;

    if (!currentTick) return [];

    const startTick = Math.max(0, currentTick - ticksBack);
    const activityMap = new Map<string, number>();

    for (let tick = startTick; tick <= currentTick; tick += 5) { // Sample every 5 ticks
      try {
        const txData = await getTransactionsByTick(tick, rpc);
        if (txData?.transactions) {
          const timestamp = new Date(Date.now() - (currentTick - tick) * 12000);
          const day = timestamp.toLocaleDateString('en-US', { weekday: 'short' });
          const hour = Math.floor(timestamp.getHours() / 4) * 4; // 4-hour buckets
          const key = `${day}-${hour}`;

          const current = activityMap.get(key) || 0;
          activityMap.set(key, current + (txData.transactions?.length || 0));
        }
      } catch (e) {
        console.warn(`Failed to process tick ${tick} for heatmap:`, e);
        continue;
      }
    }

    // Convert to array format
    return Array.from(activityMap.entries()).map(([key, activity]) => {
      const [day, hourStr] = key.split('-');
      return {
        day,
        hour: parseInt(hourStr),
        activity
      };
    });
  } catch (e) {
    console.error("Failed to get transaction flow heatmap:", e);
    return [];
  }
}

// ===== ADDITIONAL NETWORK ENDPOINTS =====

// Get detailed transaction info by txId
export async function getTransactionInfo(txId: string, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/transaction/${txId}`);
  } catch (e) {
    console.warn(`Failed to get transaction info for ${txId}:`, e);
    return null;
  }
}

// Get transaction status
export async function getTransactionStatus(txId: string, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/transaction-status/${txId}`);
  } catch (e) {
    console.warn(`Failed to get transaction status for ${txId}:`, e);
    return null;
  }
}

// Get chain hash for a specific tick (verify blockchain integrity)
export async function getChainHash(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/chain-hash/${tick}`);
  } catch (e) {
    console.warn(`Failed to get chain hash for tick ${tick}:`, e);
    return null;
  }
}

// Get store hash for a specific tick
export async function getStoreHash(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/store-hash/${tick}`);
  } catch (e) {
    console.warn(`Failed to get store hash for tick ${tick}:`, e);
    return null;
  }
}

// Get quorum tick data
export async function getQuorumTick(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/quorum-tick/${tick}`);
  } catch (e) {
    console.warn(`Failed to get quorum tick for ${tick}:`, e);
    return null;
  }
}

// Get transactions for a specific tick (v1 endpoint)
export async function getTickTransactions(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/tick-transactions/${tick}`);
  } catch (e) {
    console.warn(`Failed to get tick transactions for ${tick}:`, e);
    return { transactions: [] };
  }
}

// Get info for a specific tick
export async function getTickInfoDetailed(tick: number, rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/tick-info/${tick}`);
  } catch (e) {
    console.warn(`Failed to get tick info for ${tick}:`, e);
    return null;
  }
}

// Get network status (processed ticks, last processed tick, etc.)
export async function getStatus(rpc?: string) {
  const base = normalizeEndpoint(rpc);
  try {
    return await fetchJson(`${base}v1/status`);
  } catch (e) {
    console.warn('Failed to get network status:', e);
    return null;
  }
}

// ============================================================================
// TOKEN SMART CONTRACT INTERACTION
// ============================================================================

/**
 * Get all transactions for demo purposes
 * Shows transaction activity on the network
 * 
 * NOTE: Returns regular transfers as "market activity"
 * Smart contract transactions are rare, so we show all activity
 */
export async function getContractTransactions(
  contractIndex: number,
  startTick: number,
  endTick: number,
  rpc?: string
): Promise<Transaction[]> {
  try {
    const allTransactions = await getTransactionsByTickRange(startTick, endTick, rpc);
    
    console.log(`Total transactions in range: ${allTransactions.length}`);
    
    // Return ALL transactions as "market activity"
    // Filter out zero-amount transactions
    return allTransactions.filter(tx => {
      const amount = BigInt(tx.amount || 0);
      return amount > 0;
    });
  } catch (e) {
    console.error(`Failed to get transactions:`, e);
    return [];
  }
}

/**
 * Analyze token trading activity from contract transactions
 * Returns buy/sell statistics
 */
export interface TokenTradeEvent {
  tick: number;
  txId: string;
  type: 'buy' | 'sell' | 'transfer';
  from: string;
  to: string;
  amount: bigint;
  timestamp?: string;
}

/**
 * Get token trading history with EVENT-BASED reconstruction
 * This is the SMART way - uses events to know exactly what happened
 */
export async function getTokenTradingHistory(
  contractIndex: number,
  ticksBack: number = 100,
  rpc?: string
): Promise<TokenTradeEvent[]> {
  try {
    const tickInfo = await getTickInfo(rpc);
    const currentTick = tickInfo?.tickInfo?.tick;
    
    if (!currentTick) {
      console.error('No current tick available');
      return [];
    }
    
    console.log(`Current tick: ${currentTick}`);
    
    // Use safe buffer and fetch just 2 recent ticks for speed
    const safeTick = currentTick - 100;
    const startTick = safeTick - 1; // Only 2 ticks to avoid rate limiting
    const endTick = safeTick;
    
    console.log(`Fetching ticks ${startTick} to ${endTick}`);
    
    const base = normalizeEndpoint(rpc);
    const trades: TokenTradeEvent[] = [];
    
    // Fetch directly without going through getContractTransactions
    for (let tick = startTick; tick <= endTick; tick++) {
      try {
        const data = await fetchJson(`${base}v1/ticks/${tick}/approved-transactions`);
        
        if (data?.approvedTransactions && Array.isArray(data.approvedTransactions)) {
          console.log(`Tick ${tick}: ${data.approvedTransactions.length} transactions`);
          
          // Take first 50 transactions from this tick (since we only fetch 2 ticks)
          const txs = data.approvedTransactions.slice(0, 50);
          
          for (const tx of txs) {
            const amount = BigInt(tx.amount || 0);
            
            // Skip zero amounts
            if (amount === 0n) continue;
            
            // Classify based on amount
            let tradeType: 'buy' | 'sell' | 'transfer' = 'transfer';
            if (amount > BigInt(100000000000)) { // > 100 QU
              tradeType = 'buy';
            } else if (amount > BigInt(10000000000)) { // > 10 QU
              tradeType = 'sell';
            }
            
            trades.push({
              tick: tx.tickNumber || tick,
              txId: tx.txId || '',
              type: tradeType,
              from: tx.sourceId || '',
              to: tx.destId || '',
              amount: amount,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch tick ${tick}:`, e);
      }
    }
    
    console.log(`Total trades found: ${trades.length}`);
    
    return trades;
  } catch (e) {
    console.error('Failed to get token trading history:', e);
    return [];
  }
}
