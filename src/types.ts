export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  icon: string;
  priceUsd: number;
  change24h: number;
}

export interface LiquidityPool {
  id: string;
  pairName: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: number;
  reserveB: number;
  totalLpSupply: number;
  feeRate: number; // e.g. 0.0025 = 0.25%
  tvlUsd: number;
  volume24h: number;
  fees24h: number;
  apyBase: number;
  apyReward: number;
  contractAddress: string;
}

export interface UserPosition {
  poolId: string;
  lpTokens: number;
  sharePercentage: number;
  stakedTokenA: number;
  stakedTokenB: number;
  accruedFeesUsd: number;
  initialDepositUsd: number;
  currentValueUsd: number;
  joinedAt: number;
}

export interface TradeEvent {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL' | 'ARBITRAGE_REBALANCE';
  poolId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  price: number;
  txHash: string;
  blockNumber: number;
  gasUsedGwei: number;
  slippagePct: number;
  botInitiated: boolean;
}

export interface BotConfig {
  active: boolean;
  autoRebalance: boolean;
  minSpreadPct: number;
  maxSlippagePct: number;
  tradingSpeed: 'normal' | 'fast' | 'turbo';
  targetPair: string;
  totalSwapsExecuted: number;
  totalVolumeUsd: number;
  totalFeesGeneratedUsd: number;
  lastAction: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
  chainId: number;
  balances: {
    BNB: number;
    TS: number;
    USDT: number;
    [key: string]: number;
  };
  connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet' | null;
}

export interface FinancialMetric {
  period: string;
  tradingVolume: number;
  feesCollected: number;
  distributedToLPs: number;
  activeLPs: number;
  tvl: number;
}

export interface CryptoAlert {
  id: string;
  type: 'RECHARGE' | 'WITHDRAWAL';
  asset: 'BNB';
  amountBnb: number;
  amountUsd: number;
  walletAddress: string;
  txHash: string;
  timestamp: number;
  status: 'CONFIRMED' | 'DISPATCHED' | 'PENDING';
  recipientEmail: string;
  blockNumber: number;
  note?: string;
}

export interface ReferralUser {
  id: string;
  address: string;
  level: 1 | 2 | 3 | 4;
  joinedTimestamp: number;
  tradingVolumeUsd: number;
  commissionEarnedBnb: number;
  commissionEarnedUsd: number;
  status: 'ACTIVE' | 'IDLE';
}

export interface ReferralLevelStats {
  level: 1 | 2 | 3 | 4;
  ratePct: number;
  count: number;
  volumeUsd: number;
  earnedBnb: number;
  earnedUsd: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  referralCode: string;
  inviterCode?: string;
  registeredAt: number;
  walletAddress: string;
  savedPassword?: string;
  rememberMe: boolean;
  isRegistered: boolean;
}



