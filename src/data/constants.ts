import { Token, LiquidityPool } from '../types';

export const CONTRACTS = {
  TS_TOKEN: '0x639E8A120B07D886A8A5d47c57e2780dcC201818',
  RECHARGE_ROUTER_DEFI: '0xdB19b0785d1BA051ECdbC721c86e0828ACf43Db0', // Official BNB Recharge & Provisioning Address
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  TS_BNB_PAIR: '0x8A4b2C9e01dB89326e0828ACf43Db07821B07D88',
  TELEGRAM_COMMUNITY: 'https://t.me/+TYZhCsadVskxNGI0',
  ALERT_EMAIL: 'sovereignstateofsouthafrica@gmail.com',
  BOT_IMAGE_PATH: '/assets/aistudio/IMG_9308_871606a6.jpeg',
  BOT_IMAGE_PATH_ALT: '/assets/aistudio/IMG_9304_2852d460.jpeg',
  APP_DOWNLOAD_NAME: 'TS_BOT_BNB_Trading_v3.2.0.apk',
  CHAIN_ID: 56,
  CHAIN_NAME: 'BNB Smart Chain (BEP-20)',
};

export const INITIAL_TOKENS: Record<string, Token> = {
  TS: {
    symbol: 'TS',
    name: 'TechShares BNB',
    decimals: 18,
    address: CONTRACTS.TS_TOKEN,
    icon: '⚡',
    priceUsd: 3.84,
    change24h: 3.42,
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB Chain Native',
    decimals: 18,
    address: CONTRACTS.WBNB,
    icon: '🟡',
    priceUsd: 614.50,
    change24h: 1.85,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD (BSC-Peg)',
    decimals: 18,
    address: CONTRACTS.USDT,
    icon: '💵',
    priceUsd: 1.00,
    change24h: 0.01,
  },
};

export const INITIAL_POOLS: LiquidityPool[] = [
  {
    id: 'ts-bnb',
    pairName: 'TS / BNB',
    tokenA: INITIAL_TOKENS.TS,
    tokenB: INITIAL_TOKENS.BNB,
    reserveA: 160000, // 160,000 TS
    reserveB: 1000,   // 1,000 BNB ($614,500) -> 1 BNB = 160 TS ($3.84/TS)
    totalLpSupply: 12649.11, // sqrt(160000 * 1000)
    feeRate: 0.0025, // 0.25% standard AMM fee
    tvlUsd: 1229000,
    volume24h: 348200,
    fees24h: 870.50,
    apyBase: 25.8, // Organic fee APY from trading volume
    apyReward: 8.4, // Protocol liquidity incentive yield
    contractAddress: CONTRACTS.TS_BNB_PAIR,
  },
  {
    id: 'ts-usdt',
    pairName: 'TS / USDT',
    tokenA: INITIAL_TOKENS.TS,
    tokenB: INITIAL_TOKENS.USDT,
    reserveA: 200000,
    reserveB: 768000,
    totalLpSupply: 12393.54,
    feeRate: 0.0025,
    tvlUsd: 1536000,
    volume24h: 421000,
    fees24h: 1052.50,
    apyBase: 24.2,
    apyReward: 7.5,
    contractAddress: '0x9C3f5E12b0785d1BA051ECdbC721c86e0828ACf43',
  },
  {
    id: 'bnb-usdt',
    pairName: 'BNB / USDT',
    tokenA: INITIAL_TOKENS.BNB,
    tokenB: INITIAL_TOKENS.USDT,
    reserveA: 8000,
    reserveB: 4916000,
    totalLpSupply: 19831.28,
    feeRate: 0.0017,
    tvlUsd: 9832000,
    volume24h: 2150000,
    fees24h: 3655.00,
    apyBase: 13.5,
    apyReward: 3.2,
    contractAddress: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE',
  },
];

// Helper calculations for Constant Product Market Maker (x * y = k)
export function calculateAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeRate: number = 0.0025
): { amountOut: number; priceImpact: number; newReserveIn: number; newReserveOut: number } {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
    return { amountOut: 0, priceImpact: 0, newReserveIn: reserveIn, newReserveOut: reserveOut };
  }
  const amountInWithFee = amountIn * (1 - feeRate);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  const amountOut = numerator / denominator;

  const currentPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  const priceImpact = Math.max(0, ((currentPrice - executionPrice) / currentPrice) * 100);

  return {
    amountOut,
    priceImpact,
    newReserveIn: reserveIn + amountIn,
    newReserveOut: reserveOut - amountOut,
  };
}

// Impermanent Loss formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
export function calculateImpermanentLoss(priceRatioChange: number): number {
  if (priceRatioChange <= 0) return 0;
  const sqrtRatio = Math.sqrt(priceRatioChange);
  const il = (2 * sqrtRatio) / (1 + priceRatioChange) - 1;
  return Math.abs(il * 100); // return percentage
}

// Format currency
export function formatUSD(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatNumber(val: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
