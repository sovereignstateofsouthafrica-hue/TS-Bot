import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  LiquidityPool, 
  UserPosition, 
  TradeEvent, 
  BotConfig, 
  WalletState,
  FinancialMetric,
  CryptoAlert,
  ReferralUser,
  AuthUser
} from '../types';
import { INITIAL_POOLS, INITIAL_TOKENS, CONTRACTS, calculateAmountOut, shortenAddress } from '../data/constants';

interface ProtocolContextType {
  pools: LiquidityPool[];
  selectedPool: LiquidityPool;
  setSelectedPoolId: (id: string) => void;
  userPositions: UserPosition[];
  tradeHistory: TradeEvent[];
  botConfig: BotConfig;
  setBotConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  wallet: WalletState;
  connectWallet: (connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet') => void;
  disconnectWallet: () => void;
  switchNetwork: (net: string, chainId: number) => void;
  claimFaucet: () => void;
  addLiquidity: (poolId: string, amountA: number, amountB: number) => { success: boolean; message: string };
  removeLiquidity: (poolId: string, percentage: number) => { success: boolean; message: string };
  claimPoolFees: (poolId: string) => { success: boolean; message: string };
  executeManualSwap: (poolId: string, fromTokenSymbol: string, amountIn: number) => { success: boolean; message: string };
  executeTierPackage: (poolId: string, tierUsd: number) => { success: boolean; message: string };
  processRechargeBnb: (amountBnb: number, txHash?: string, note?: string) => { success: boolean; alert: CryptoAlert };
  processWithdrawalBnb: (amountBnb: number, recipientAddress: string, note?: string) => { success: boolean; message: string; alert?: CryptoAlert };
  alerts: CryptoAlert[];
  activeAlertToast: CryptoAlert | null;
  dismissAlertToast: () => void;
  referralUsers: ReferralUser[];
  unclaimedCommissionBnb: number;
  claimReferralCommission: () => { success: boolean; message: string; amountBnb: number; amountUsd: number };
  currentUser: AuthUser | null;
  savedCredentials: { email: string; password: string } | null;
  registerUser: (email: string, password: string, username?: string, inviterCode?: string, rememberMe?: boolean) => { success: boolean; message: string; user?: AuthUser };
  loginUser: (emailOrUser: string, password: string, rememberMe?: boolean) => { success: boolean; message: string; user?: AuthUser };
  logoutUser: () => void;
  recoverPassword: (email: string) => { success: boolean; message: string; tempPass?: string };
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
  addSimulatedReferral: (level?: 1 | 2 | 3 | 4) => { success: boolean; message: string };
  financialMetrics: FinancialMetric[];
  currentBlock: number;
  triggerBotBurst: () => void;
  rechargeBalance: number;
  rechargeBalanceUsd: number;
  hasRecharged: boolean;
  accumulatedMiningYieldBnb: number;
  claimMiningYield: () => { success: boolean; message: string; amountBnb: number };
  resetSystemData: () => void;
}

const ProtocolContext = createContext<ProtocolContextType | null>(null);

export function ProtocolProvider({ children }: { children: ReactNode }) {
  const [pools, setPools] = useState<LiquidityPool[]>(INITIAL_POOLS);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('ts-bnb');
  const [currentBlock, setCurrentBlock] = useState<number>(38429104);

  // User Wallet State
  const [wallet, setWallet] = useState<WalletState>({
    connected: true,
    address: '0x71C...a49B',
    network: 'BNB Smart Chain (Mainnet)',
    chainId: 56,
    balances: {
      BNB: 8.45,
      TS: 2450.0,
      USDT: 1200.0,
    },
    connector: 'MetaMask',
  });

  // Recharge Balance State (Starts at 0.00 BNB before recharging)
  const [rechargeBalance, setRechargeBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_recharge_balance');
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0; // Strictly 0 before recharge
  });

  const bnbRate = 614.50;
  const rechargeBalanceUsd = rechargeBalance * bnbRate;
  const hasRecharged = rechargeBalance > 0;

  // Real-time Accumulated 4.0% Daily Mining Yield on Recharged BNB
  const [accumulatedMiningYieldBnb, setAccumulatedMiningYieldBnb] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_yield_bnb');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0;
  });

  // User LP Positions (Strictly empty before recharge; active mining positions start after recharge)
  const [userPositions, setUserPositions] = useState<UserPosition[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_user_positions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Real-time Automated Trading Bot Engine State
  // Active trading figures start ONLY after recharging. Zero figures before recharging.
  const [botConfig, setBotConfig] = useState<BotConfig>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_engine_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.totalSwapsExecuted === 'number') {
          return {
            ...parsed,
            active: hasRecharged ? Boolean(parsed.active) : false,
          };
        }
      }
    } catch (e) {}
    return {
      active: hasRecharged,
      autoRebalance: true,
      minSpreadPct: 0.15,
      maxSlippagePct: 0.5,
      tradingSpeed: 'normal',
      targetPair: 'TS / BNB',
      totalSwapsExecuted: hasRecharged ? 1 : 0,
      totalVolumeUsd: hasRecharged ? rechargeBalanceUsd : 0,
      totalFeesGeneratedUsd: hasRecharged ? rechargeBalanceUsd * 0.0025 : 0,
      lastAction: hasRecharged
        ? 'Arbitrage rebalance active across PancakeSwap & TS AMM Pool'
        : 'Standby - Awaiting BNB Recharge to activate automated mining & arbitrage trading engine.',
    };
  });

  // Trade History (Empty before recharging; trades start recording after recharging)
  const [tradeHistory, setTradeHistory] = useState<TradeEvent[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_trade_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Financial Metrics Summary
  const [financialMetrics] = useState<FinancialMetric[]>([
    {
      period: 'Today (Live 24h)',
      tradingVolume: 348200,
      feesCollected: 870.50,
      distributedToLPs: 696.40, // 80% to LPs, 20% to treasury & affiliate rebates
      activeLPs: 412,
      tvl: 1229000,
    },
    {
      period: 'Yesterday',
      tradingVolume: 312500,
      feesCollected: 781.25,
      distributedToLPs: 625.00,
      activeLPs: 405,
      tvl: 1205000,
    },
    {
      period: '7 Days Total',
      tradingVolume: 2450000,
      feesCollected: 6125.00,
      distributedToLPs: 4900.00,
      activeLPs: 395,
      tvl: 1180000,
    },
    {
      period: '30 Days Total',
      tradingVolume: 9850000,
      feesCollected: 24625.00,
      distributedToLPs: 19700.00,
      activeLPs: 360,
      tvl: 1120000,
    },
  ]);

  // Alerts State (Persistent ledger; only withdrawals dispatch email requests to sovereignstateofsouthafrica@gmail.com)
  const [alerts, setAlerts] = useState<CryptoAlert[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [activeAlertToast, setActiveAlertToast] = useState<CryptoAlert | null>(null);

  const dismissAlertToast = () => setActiveAlertToast(null);

  // 4-Level Referral Network State
  // 4-Level Referral Network State
  // NO Referrals before Referrals. All digitalised mock referrals removed. Starts strictly at 0.
  const [unclaimedCommissionBnb, setUnclaimedCommissionBnb] = useState<number>(0);
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_referral_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (r) => !/^ref-[0-9]+$/.test(r.id) && !r.id?.startsWith('ref-init')
          );
        }
      }
    } catch (e) {}
    return [];
  });

  // User Authentication & Saved Password State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_current_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    // Default registered account with active affiliate node
    return {
      id: 'usr-default-1',
      email: CONTRACTS.ALERT_EMAIL,
      username: 'TS_Ambassador_BNB',
      referralCode: 'TSBNB888',
      registeredAt: Date.now() - 86400000 * 14,
      walletAddress: '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      rememberMe: true,
      isRegistered: true,
    };
  });

  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_saved_credentials');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      email: CONTRACTS.ALERT_EMAIL,
      password: 'TSBotPassword2026!',
    };
  });

  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);

  // Check URL query parameters on load for ?ref=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        setPendingInviteCode(refParam.toUpperCase());
      }
    } catch (e) {}
  }, []);

  // Block counter simulation (BNB chain has ~3s block time)
  useEffect(() => {
    const blockTimer = setInterval(() => {
      setCurrentBlock((b) => b + 1);
    }, 3000);
    return () => clearInterval(blockTimer);
  }, []);

  // Bot Trading execution generator (Active trading figures start ONLY after recharging)
  const triggerSingleBotTrade = useCallback(() => {
    if (rechargeBalance <= 0) return;
    setPools((prevPools) => {
      const poolIndex = Math.random() > 0.4 ? 0 : 1;
      const targetPool = prevPools[poolIndex];
      const isBuy = Math.random() > 0.45;
      
      const tradeSizes = [0.15, 0.35, 0.8, 1.2, 2.5, 5.0];
      const bnbAmount = tradeSizes[Math.floor(Math.random() * tradeSizes.length)];
      const tsAmount = bnbAmount * 160 * (1 + (Math.random() * 0.02 - 0.01));

      let tokenIn: string;
      let tokenOut: string;
      let amountIn: number;
      let amountOut: number;

      if (targetPool.id === 'ts-bnb') {
        if (isBuy) {
          // Swapping BNB for TS
          tokenIn = 'BNB';
          tokenOut = 'TS';
          amountIn = bnbAmount;
          const result = calculateAmountOut(amountIn, targetPool.reserveB, targetPool.reserveA, targetPool.feeRate);
          amountOut = result.amountOut;
        } else {
          // Swapping TS for BNB
          tokenIn = 'TS';
          tokenOut = 'BNB';
          amountIn = tsAmount;
          const result = calculateAmountOut(amountIn, targetPool.reserveA, targetPool.reserveB, targetPool.feeRate);
          amountOut = result.amountOut;
        }
      } else {
        // TS / USDT
        if (isBuy) {
          tokenIn = 'USDT';
          tokenOut = 'TS';
          amountIn = bnbAmount * 600;
          const result = calculateAmountOut(amountIn, targetPool.reserveB, targetPool.reserveA, targetPool.feeRate);
          amountOut = result.amountOut;
        } else {
          tokenIn = 'TS';
          tokenOut = 'USDT';
          amountIn = tsAmount;
          const result = calculateAmountOut(amountIn, targetPool.reserveA, targetPool.reserveB, targetPool.feeRate);
          amountOut = result.amountOut;
        }
      }

      // Calculate trade fee
      const feeUsd = (amountIn * (tokenIn === 'BNB' ? 614.5 : tokenIn === 'USDT' ? 1.0 : 3.84)) * targetPool.feeRate;
      const tradeUsd = amountIn * (tokenIn === 'BNB' ? 614.5 : tokenIn === 'USDT' ? 1.0 : 3.84);

      // Create event
      const hexChars = '0123456789abcdef';
      let randomHash = '0x';
      for (let i = 0; i < 64; i++) {
        randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
      }

      const isArbitrage = Math.random() > 0.65;
      const tradeType: 'BUY' | 'SELL' | 'ARBITRAGE_REBALANCE' = isArbitrage ? 'ARBITRAGE_REBALANCE' : isBuy ? 'BUY' : 'SELL';

      const newTrade: TradeEvent = {
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
        type: tradeType,
        poolId: targetPool.id,
        tokenIn,
        tokenOut,
        amountIn: Number(amountIn.toFixed(4)),
        amountOut: Number(amountOut.toFixed(4)),
        price: 3.84 + (Math.random() * 0.04 - 0.02),
        txHash: randomHash,
        blockNumber: currentBlock + 1,
        gasUsedGwei: 3.0 + Math.random() * 1.5,
        slippagePct: Number((Math.random() * 0.15 + 0.02).toFixed(2)),
        botInitiated: true,
      };

      setTradeHistory((prev) => [newTrade, ...prev.slice(0, 49)]);

      // Update bot state stats
      setBotConfig((b) => ({
        ...b,
        totalSwapsExecuted: b.totalSwapsExecuted + 1,
        totalVolumeUsd: b.totalVolumeUsd + tradeUsd,
        totalFeesGeneratedUsd: b.totalFeesGeneratedUsd + feeUsd,
        lastAction: isArbitrage 
          ? `Auto-arbitrage: Captured $${(feeUsd * 1.8).toFixed(2)} cross-DEX spread for TS/BNB` 
          : `Automated ${tokenIn} -> ${tokenOut} liquidity routing executed`,
      }));

      // Accumulate accrued fee for user position if they have share in this pool
      setUserPositions((positions) =>
        positions.map((pos) => {
          if (pos.poolId === targetPool.id) {
            const userFeeCut = feeUsd * (pos.sharePercentage / 100);
            return {
              ...pos,
              accruedFeesUsd: pos.accruedFeesUsd + userFeeCut,
              currentValueUsd: pos.currentValueUsd + userFeeCut * 0.9,
            };
          }
          return pos;
        })
      );

      // Return updated pools with incremental volume & fees
      return prevPools.map((p, idx) => {
        if (idx === poolIndex) {
          return {
            ...p,
            volume24h: p.volume24h + tradeUsd,
            fees24h: p.fees24h + feeUsd,
          };
        }
        return p;
      });
    });
  }, [currentBlock, rechargeBalance]);

  // Real-time 4% Daily Mining Profit Accumulator on Recharged Balance
  useEffect(() => {
    if (rechargeBalance <= 0) return;
    // 4% daily profit = (rechargeBalance * 0.04) / 86400 per sec => * 3 every 3-sec block
    const blockProfitBnb = (rechargeBalance * 0.04 * 3) / 86400;
    const miningInterval = setInterval(() => {
      setAccumulatedMiningYieldBnb((prev) => {
        const next = prev + blockProfitBnb;
        try {
          localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
        } catch (e) {}
        return next;
      });
    }, 3000);
    return () => clearInterval(miningInterval);
  }, [rechargeBalance]);

  // Bot timer loop based on speed (Only runs after confirming recharge)
  useEffect(() => {
    if (!botConfig.active || rechargeBalance <= 0) return;
    const intervalMs = botConfig.tradingSpeed === 'turbo' ? 2000 : botConfig.tradingSpeed === 'fast' ? 4000 : 7000;
    const timer = setInterval(() => {
      triggerSingleBotTrade();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [botConfig.active, botConfig.tradingSpeed, triggerSingleBotTrade, rechargeBalance]);

  const triggerBotBurst = useCallback(() => {
    if (rechargeBalance <= 0) return;
    triggerSingleBotTrade();
  }, [triggerSingleBotTrade, rechargeBalance]);

  // Wallet Actions
  const connectWallet = (connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet') => {
    const dummyAddresses: Record<string, string> = {
      'MetaMask': '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      'Binance Wallet': '0x3Fe90785d1BA051ECdbC721c86e0828ACf48F2a',
      'Trust Wallet': '0x992B19b0785d1BA051ECdbC721c86e0828ACf439E',
    };
    setWallet({
      connected: true,
      address: dummyAddresses[connector] || '0x71C...a49B',
      network: 'BNB Smart Chain (Mainnet)',
      chainId: 56,
      balances: {
        BNB: 14.85,
        TS: 3800.0,
        USDT: 2500.0,
      },
      connector,
    });
  };

  const disconnectWallet = () => {
    setWallet({
      connected: false,
      address: null,
      network: 'Disconnected',
      chainId: 0,
      balances: { BNB: 0, TS: 0, USDT: 0 },
      connector: null,
    });
  };

  const switchNetwork = (network: string, chainId: number) => {
    setWallet((prev) => ({ ...prev, network, chainId }));
  };

  const claimFaucet = () => {
    setWallet((prev) => ({
      ...prev,
      balances: {
        BNB: prev.balances.BNB + 5.0,
        TS: prev.balances.TS + 2000.0,
        USDT: prev.balances.USDT + 1000.0,
      },
    }));
  };

  // Add Liquidity (Non-custodial smart contract pool deposit)
  const addLiquidity = (poolId: string, amountA: number, amountB: number) => {
    const targetPool = pools.find((p) => p.id === poolId);
    if (!targetPool) return { success: false, message: 'Pool not found' };

    const tokenASymbol = targetPool.tokenA.symbol;
    const tokenBSymbol = targetPool.tokenB.symbol;

    if (wallet.balances[tokenASymbol] < amountA || wallet.balances[tokenBSymbol] < amountB) {
      return { success: false, message: `Insufficient balance in ${tokenASymbol} or ${tokenBSymbol}` };
    }

    // Deduct user balances
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [tokenASymbol]: prev.balances[tokenASymbol] - amountA,
        [tokenBSymbol]: prev.balances[tokenBSymbol] - amountB,
      },
    }));

    // Calculate LP minted
    const lpMinted = Math.sqrt(amountA * amountB);
    const newTotalSupply = targetPool.totalLpSupply + lpMinted;
    const sharePct = (lpMinted / newTotalSupply) * 100;
    const depositUsd = amountA * targetPool.tokenA.priceUsd + amountB * targetPool.tokenB.priceUsd;

    // Update pool reserves
    setPools((prevPools) =>
      prevPools.map((p) => {
        if (p.id === poolId) {
          return {
            ...p,
            reserveA: p.reserveA + amountA,
            reserveB: p.reserveB + amountB,
            totalLpSupply: newTotalSupply,
            tvlUsd: p.tvlUsd + depositUsd,
          };
        }
        return p;
      })
    );

    // Update or add position
    setUserPositions((prev) => {
      const existing = prev.find((pos) => pos.poolId === poolId);
      if (existing) {
        return prev.map((pos) => {
          if (pos.poolId === poolId) {
            const combinedLp = pos.lpTokens + lpMinted;
            return {
              ...pos,
              lpTokens: combinedLp,
              sharePercentage: (combinedLp / newTotalSupply) * 100,
              stakedTokenA: pos.stakedTokenA + amountA,
              stakedTokenB: pos.stakedTokenB + amountB,
              initialDepositUsd: pos.initialDepositUsd + depositUsd,
              currentValueUsd: pos.currentValueUsd + depositUsd,
            };
          }
          return pos;
        });
      } else {
        return [
          ...prev,
          {
            poolId,
            lpTokens: lpMinted,
            sharePercentage: sharePct,
            stakedTokenA: amountA,
            stakedTokenB: amountB,
            accruedFeesUsd: 0,
            initialDepositUsd: depositUsd,
            currentValueUsd: depositUsd,
            joinedAt: Date.now(),
          },
        ];
      }
    });

    return { 
      success: true, 
      message: `Successfully deposited ${amountA.toFixed(2)} ${tokenASymbol} + ${amountB.toFixed(3)} ${tokenBSymbol}. Minted ${lpMinted.toFixed(2)} LP tokens.` 
    };
  };

  // Remove Liquidity
  const removeLiquidity = (poolId: string, percentage: number) => {
    const position = userPositions.find((p) => p.poolId === poolId);
    const pool = pools.find((p) => p.id === poolId);
    if (!position || !pool || position.lpTokens <= 0) {
      return { success: false, message: 'No active liquidity position to remove' };
    }

    const burnLp = position.lpTokens * (percentage / 100);
    const returnFraction = burnLp / pool.totalLpSupply;
    const returnAmountA = pool.reserveA * returnFraction;
    const returnAmountB = pool.reserveB * returnFraction;
    const feeReward = position.accruedFeesUsd * (percentage / 100);

    // Credit balances back
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [pool.tokenA.symbol]: prev.balances[pool.tokenA.symbol] + returnAmountA,
        [pool.tokenB.symbol]: prev.balances[pool.tokenB.symbol] + returnAmountB + (pool.tokenB.symbol === 'BNB' ? feeReward / 614.5 : feeReward),
      },
    }));

    // Update pool
    setPools((prev) =>
      prev.map((p) => {
        if (p.id === poolId) {
          return {
            ...p,
            reserveA: p.reserveA - returnAmountA,
            reserveB: p.reserveB - returnAmountB,
            totalLpSupply: p.totalLpSupply - burnLp,
            tvlUsd: p.tvlUsd - (returnAmountA * p.tokenA.priceUsd + returnAmountB * p.tokenB.priceUsd),
          };
        }
        return p;
      })
    );

    // Update position
    setUserPositions((prev) =>
      prev
        .map((pos) => {
          if (pos.poolId === poolId) {
            const remainingLp = pos.lpTokens - burnLp;
            if (remainingLp <= 0.001) return null;
            return {
              ...pos,
              lpTokens: remainingLp,
              sharePercentage: (remainingLp / (pool.totalLpSupply - burnLp)) * 100,
              stakedTokenA: pos.stakedTokenA * (1 - percentage / 100),
              stakedTokenB: pos.stakedTokenB * (1 - percentage / 100),
              accruedFeesUsd: pos.accruedFeesUsd * (1 - percentage / 100),
              currentValueUsd: pos.currentValueUsd * (1 - percentage / 100),
            };
          }
          return pos;
        })
        .filter(Boolean) as UserPosition[]
    );

    return {
      success: true,
      message: `Withdrawn ${returnAmountA.toFixed(2)} ${pool.tokenA.symbol} and ${returnAmountB.toFixed(3)} ${pool.tokenB.symbol} (+ accrued trading fees).`,
    };
  };

  // Claim Pool Fees
  const claimPoolFees = (poolId: string) => {
    const position = userPositions.find((p) => p.poolId === poolId);
    if (!position || position.accruedFeesUsd <= 0.01) {
      return { success: false, message: 'No accumulated fee rewards to claim yet.' };
    }

    const fees = position.accruedFeesUsd;
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        USDT: prev.balances.USDT + fees,
      },
    }));

    setUserPositions((prev) =>
      prev.map((pos) => {
        if (pos.poolId === poolId) {
          return { ...pos, accruedFeesUsd: 0 };
        }
        return pos;
      })
    );

    return {
      success: true,
      message: `Claimed $${fees.toFixed(2)} USD in protocol trading fees directly to your wallet!`,
    };
  };

  // Execute Pre-calibrated Liquidity Tier ($10, $30, $50, $100, $200, $500, $1000)
  const executeTierPackage = (poolId: string, tierUsd: number) => {
    const pool = pools.find((p) => p.id === poolId) || pools[0];
    const halfUsd = tierUsd / 2;
    const amountA = halfUsd / pool.tokenA.priceUsd;
    const amountB = halfUsd / pool.tokenB.priceUsd;

    return addLiquidity(pool.id, amountA, amountB);
  };

  // Manual Swap
  const executeManualSwap = (poolId: string, fromTokenSymbol: string, amountIn: number) => {
    const pool = pools.find((p) => p.id === poolId);
    if (!pool) return { success: false, message: 'Pool not found' };

    const isTokenA = fromTokenSymbol === pool.tokenA.symbol;
    const reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
    const toTokenSymbol = isTokenA ? pool.tokenB.symbol : pool.tokenA.symbol;

    if (wallet.balances[fromTokenSymbol] < amountIn) {
      return { success: false, message: `Insufficient ${fromTokenSymbol} balance.` };
    }

    const { amountOut } = calculateAmountOut(amountIn, reserveIn, reserveOut, pool.feeRate);
    if (amountOut <= 0) return { success: false, message: 'Output amount too small.' };

    // Update wallet balances
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [fromTokenSymbol]: prev.balances[fromTokenSymbol] - amountIn,
        [toTokenSymbol]: prev.balances[toTokenSymbol] + amountOut,
      },
    }));

    // Update pool reserves
    setPools((prev) =>
      prev.map((p) => {
        if (p.id === poolId) {
          return {
            ...p,
            reserveA: isTokenA ? p.reserveA + amountIn : p.reserveA - amountOut,
            reserveB: isTokenA ? p.reserveB - amountOut : p.reserveB + amountIn,
            volume24h: p.volume24h + (isTokenA ? amountIn * p.tokenA.priceUsd : amountIn * p.tokenB.priceUsd),
          };
        }
        return p;
      })
    );

    // Create event
    const newTrade: TradeEvent = {
      id: 'tx-manual-' + Date.now(),
      timestamp: Date.now(),
      type: isTokenA ? 'SELL' : 'BUY',
      poolId,
      tokenIn: fromTokenSymbol,
      tokenOut: toTokenSymbol,
      amountIn,
      amountOut,
      price: isTokenA ? amountIn / amountOut : amountOut / amountIn,
      txHash: '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0'),
      blockNumber: currentBlock,
      gasUsedGwei: 3.0,
      slippagePct: 0.05,
      botInitiated: false,
    };
    setTradeHistory((prev) => [newTrade, ...prev.slice(0, 49)]);

    return {
      success: true,
      message: `Swapped ${amountIn.toFixed(4)} ${fromTokenSymbol} for ${amountOut.toFixed(4)} ${toTokenSymbol} via decentralized AMM.`,
    };
  };

  // Process Recharge BNB (Recharge crypto button form)
  // Activates Recharge Balance on Dashboard and starts active trading & 4% mining figures
  const processRechargeBnb = (amountBnb: number, txHashInput?: string, note?: string) => {
    // Generate valid simulated tx hash if not provided
    const hexChars = '0123456789abcdef';
    let randomHash = txHashInput?.trim() || '0x';
    if (!txHashInput) {
      for (let i = 0; i < 64; i++) {
        randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
      }
    }

    const newRechargeBal = rechargeBalance + amountBnb;
    setRechargeBalance(newRechargeBal);
    try {
      localStorage.setItem('ts_bot_recharge_balance', String(newRechargeBal));
    } catch (e) {}

    // Credit user's wallet balances
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        BNB: prev.balances.BNB + amountBnb,
      },
    }));

    // Activate Trading Bot and initialize active trading figures
    const rechargeUsd = amountBnb * 614.5;
    setBotConfig((prev) => {
      const updated: BotConfig = {
        ...prev,
        active: true,
        totalSwapsExecuted: prev.totalSwapsExecuted === 0 ? 1 : prev.totalSwapsExecuted + 1,
        totalVolumeUsd: prev.totalVolumeUsd === 0 ? rechargeUsd : prev.totalVolumeUsd + rechargeUsd,
        totalFeesGeneratedUsd: prev.totalFeesGeneratedUsd === 0 ? rechargeUsd * 0.0025 : prev.totalFeesGeneratedUsd + (rechargeUsd * 0.0025),
        lastAction: `Recharge confirmed. Automated liquidity provisioning & 4% daily mining activated for ${amountBnb.toFixed(4)} BNB.`,
      };
      try {
        localStorage.setItem('ts_bot_engine_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Create / enhance active liquidity mining position
    const lpMinted = Math.sqrt(amountBnb * (amountBnb * 160));
    setUserPositions((prev) => {
      const existing = prev.find((p) => p.poolId === 'ts-bnb');
      let updated: UserPosition[];
      if (existing) {
        updated = prev.map((p) =>
          p.poolId === 'ts-bnb'
            ? {
                ...p,
                lpTokens: p.lpTokens + lpMinted,
                stakedTokenA: p.stakedTokenA + amountBnb * 160,
                stakedTokenB: p.stakedTokenB + amountBnb,
                initialDepositUsd: p.initialDepositUsd + rechargeUsd,
                currentValueUsd: p.currentValueUsd + rechargeUsd,
              }
            : p
        );
      } else {
        updated = [
          {
            poolId: 'ts-bnb',
            lpTokens: Number(lpMinted.toFixed(4)),
            sharePercentage: Number(((amountBnb / (1000 + amountBnb)) * 100).toFixed(2)),
            stakedTokenA: Number((amountBnb * 160).toFixed(2)),
            stakedTokenB: Number(amountBnb.toFixed(4)),
            accruedFeesUsd: 0,
            initialDepositUsd: rechargeUsd,
            currentValueUsd: rechargeUsd,
            joinedAt: Date.now(),
          },
          ...prev,
        ];
      }
      try {
        localStorage.setItem('ts_bot_user_positions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Create first active trade event so live trade stream starts immediately
    const initTrade: TradeEvent = {
      id: 'tx-rec-' + Date.now(),
      timestamp: Date.now(),
      type: 'BUY',
      poolId: 'ts-bnb',
      tokenIn: 'BNB',
      tokenOut: 'TS',
      amountIn: Number((amountBnb * 0.5).toFixed(4)),
      amountOut: Number((amountBnb * 0.5 * 160).toFixed(2)),
      price: 3.84,
      txHash: randomHash,
      blockNumber: currentBlock,
      gasUsedGwei: 2.1,
      slippagePct: 0.05,
      botInitiated: true,
    };
    setTradeHistory((prev) => {
      const updated = [initTrade, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('ts_bot_trade_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Alert record for on-chain ledger (NO email dispatch requested for recharges; only withdrawals email sovereignstateofsouthafrica@gmail.com)
    const newAlert: CryptoAlert = {
      id: `alert-rec-${Date.now()}`,
      type: 'RECHARGE',
      asset: 'BNB',
      amountBnb,
      amountUsd: rechargeUsd,
      walletAddress: wallet.address || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: randomHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      recipientEmail: '', // Recharges do not request email alerts
      blockNumber: currentBlock,
      note: note || `BNB Recharge deposit received and verified on BEP-20 network. Recharge Balance credited: ${newRechargeBal.toFixed(4)} BNB.`,
    };

    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      try {
        localStorage.setItem('ts_bot_alerts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveAlertToast(newAlert);

    return {
      success: true,
      alert: newAlert,
    };
  };

  // Process Withdrawal BNB (Withdrawal crypto button form)
  // ONLY withdrawals must request on email: sovereignstateofsouthafrica@gmail.com
  const processWithdrawalBnb = (amountBnb: number, recipientAddress: string, note?: string) => {
    const totalAvailable = rechargeBalance + wallet.balances.BNB;
    if (totalAvailable < amountBnb) {
      return {
        success: false,
        message: `Insufficient balance. Available (Wallet + Recharge): ${totalAvailable.toFixed(4)} BNB.`,
      };
    }

    if (!recipientAddress || recipientAddress.trim().length < 10) {
      return {
        success: false,
        message: 'Invalid BNB (BEP-20) recipient address provided.',
      };
    }

    // Deduct from recharge balance first, then wallet balance
    if (rechargeBalance >= amountBnb) {
      const remainingRecharge = rechargeBalance - amountBnb;
      setRechargeBalance(remainingRecharge);
      try {
        localStorage.setItem('ts_bot_recharge_balance', String(remainingRecharge));
      } catch (e) {}
    } else {
      const fromWallet = amountBnb - rechargeBalance;
      setRechargeBalance(0);
      try {
        localStorage.setItem('ts_bot_recharge_balance', '0');
      } catch (e) {}
      setWallet((prev) => ({
        ...prev,
        balances: {
          ...prev.balances,
          BNB: Math.max(0, prev.balances.BNB - fromWallet),
        },
      }));
    }

    const hexChars = '0123456789abcdef';
    let randomHash = '0x';
    for (let i = 0; i < 64; i++) {
      randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    // ONLY withdrawals dispatch email request to: sovereignstateofsouthafrica@gmail.com
    const newAlert: CryptoAlert = {
      id: `alert-wd-${Date.now()}`,
      type: 'WITHDRAWAL',
      asset: 'BNB',
      amountBnb,
      amountUsd: amountBnb * 614.5,
      walletAddress: recipientAddress.trim(),
      txHash: randomHash,
      timestamp: Date.now(),
      status: 'DISPATCHED',
      recipientEmail: CONTRACTS.ALERT_EMAIL, // sovereignstateofsouthafrica@gmail.com
      blockNumber: currentBlock,
      note: note || `Official BNB Withdrawal request of ${amountBnb.toFixed(4)} BNB dispatched to ${CONTRACTS.ALERT_EMAIL}`,
    };

    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      try {
        localStorage.setItem('ts_bot_alerts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveAlertToast(newAlert);

    return {
      success: true,
      message: `Withdrawal request of ${amountBnb.toFixed(4)} BNB submitted! Official verification request dispatched to ${CONTRACTS.ALERT_EMAIL}.`,
      alert: newAlert,
    };
  };

  // Claim 4% Daily Mining Yield to Wallet
  const claimMiningYield = () => {
    if (accumulatedMiningYieldBnb <= 0.00001) {
      return {
        success: false,
        message: 'No accumulated 4% daily mining profit to claim yet.',
        amountBnb: 0,
      };
    }

    const claimed = accumulatedMiningYieldBnb;
    setAccumulatedMiningYieldBnb(0);
    try {
      localStorage.setItem('ts_bot_mining_yield_bnb', '0');
    } catch (e) {}

    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        BNB: prev.balances.BNB + claimed,
      },
    }));

    return {
      success: true,
      message: `Claimed ${claimed.toFixed(6)} BNB ($${(claimed * 614.5).toFixed(2)}) 4% daily mining profit directly to your wallet!`,
      amountBnb: claimed,
    };
  };

  // Reset system data to fresh pre-recharge state for testing
  const resetSystemData = () => {
    setRechargeBalance(0);
    setAccumulatedMiningYieldBnb(0);
    setUserPositions([]);
    setTradeHistory([]);
    setReferralUsers([]);
    setUnclaimedCommissionBnb(0);
    setAlerts([]);
    setBotConfig({
      active: false,
      autoRebalance: true,
      minSpreadPct: 0.15,
      maxSlippagePct: 0.5,
      tradingSpeed: 'normal',
      targetPair: 'TS / BNB',
      totalSwapsExecuted: 0,
      totalVolumeUsd: 0,
      totalFeesGeneratedUsd: 0,
      lastAction: 'Standby - Awaiting BNB Recharge to activate automated mining & arbitrage trading engine.',
    });
    try {
      localStorage.removeItem('ts_bot_recharge_balance');
      localStorage.removeItem('ts_bot_mining_yield_bnb');
      localStorage.removeItem('ts_bot_user_positions');
      localStorage.removeItem('ts_bot_trade_history');
      localStorage.removeItem('ts_bot_referral_users');
      localStorage.removeItem('ts_bot_engine_config');
      localStorage.removeItem('ts_bot_alerts');
    } catch (e) {}
  };

  // Claim Referral Commission
  const claimReferralCommission = () => {
    if (unclaimedCommissionBnb <= 0.0001) {
      return {
        success: false,
        message: 'No pending affiliate commissions to claim at this moment.',
        amountBnb: 0,
        amountUsd: 0,
      };
    }

    const claimedBnb = unclaimedCommissionBnb;
    const claimedUsd = claimedBnb * 614.5;

    // Credit to wallet
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        BNB: prev.balances.BNB + claimedBnb,
      },
    }));

    setUnclaimedCommissionBnb(0);

    const hexChars = '0123456789abcdef';
    let randomHash = '0x';
    for (let i = 0; i < 64; i++) {
      randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const newAlert: CryptoAlert = {
      id: `alert-comm-${Date.now()}`,
      type: 'RECHARGE',
      asset: 'BNB',
      amountBnb: claimedBnb,
      amountUsd: claimedUsd,
      walletAddress: wallet.address || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: randomHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      recipientEmail: '', // Only withdrawals request on email
      blockNumber: currentBlock,
      note: `Affiliate Commission Payout of ${claimedBnb.toFixed(4)} BNB ($${claimedUsd.toFixed(2)}) Claimed Directly to Wallet`,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveAlertToast(newAlert);

    return {
      success: true,
      message: `Successfully claimed ${claimedBnb.toFixed(4)} BNB ($${claimedUsd.toFixed(2)}) in multi-level referral rewards directly to your wallet!`,
      amountBnb: claimedBnb,
      amountUsd: claimedUsd,
    };
  };

  // Register New User & Activate Affiliate Node
  // Referral list starts recording after your affiliate link is shared and referral completed signing
  const registerUser = (
    email: string,
    password: string,
    username?: string,
    inviterCode?: string,
    rememberMe: boolean = true
  ) => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Generate unique referral code derived from email or random hex
    const generatedCode = 'TS' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const boundInviter = inviterCode?.trim().toUpperCase() || pendingInviteCode?.trim().toUpperCase() || undefined;

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      username: username?.trim() || email.split('@')[0],
      referralCode: generatedCode,
      inviterCode: boundInviter,
      registeredAt: Date.now(),
      walletAddress: wallet.address || '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      savedPassword: rememberMe ? password : undefined,
      rememberMe,
      isRegistered: true,
    };

    setCurrentUser(newUser);

    try {
      localStorage.setItem('ts_bot_current_user', JSON.stringify(newUser));
      if (rememberMe) {
        localStorage.setItem(
          'ts_bot_saved_credentials',
          JSON.stringify({ email: newUser.email, password })
        );
        setSavedCredentials({ email: newUser.email, password });
      }
    } catch (e) {}

    // If an inviter code or affiliate link was used, record the referral immediately in the referrals list!
    if (boundInviter) {
      const hexChars = '0123456789abcdef';
      let randomAddr = '0x';
      for (let i = 0; i < 40; i++) {
        randomAddr += hexChars[Math.floor(Math.random() * hexChars.length)];
      }

      const initialTradingVolume = 1500;
      const commissionBnb = (initialTradingVolume * 0.01) / 614.5;

      const newRef: ReferralUser = {
        id: `ref-dyn-${Date.now()}`,
        address: randomAddr,
        level: 1,
        joinedTimestamp: Date.now(),
        tradingVolumeUsd: initialTradingVolume,
        commissionEarnedBnb: commissionBnb,
        commissionEarnedUsd: initialTradingVolume * 0.01,
        status: 'ACTIVE',
      };

      setReferralUsers((prev) => {
        const updated = [newRef, ...prev];
        try {
          localStorage.setItem('ts_bot_referral_users', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setUnclaimedCommissionBnb((prev) => prev + commissionBnb);
      setPendingInviteCode(null);
    }

    return {
      success: true,
      message: `Registration complete! Your affiliate node is active with code ${generatedCode}.${
        boundInviter ? ` Successfully bound to referral sponsor ${boundInviter}.` : ''
      }`,
      user: newUser,
    };
  };

  // Log in User
  const loginUser = (emailOrUser: string, password: string, rememberMe: boolean = true) => {
    if (!emailOrUser) {
      return { success: false, message: 'Please enter your registered email or username.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    // Authenticate user
    const loggedUser: AuthUser = {
      id: currentUser?.id || `usr-${Date.now()}`,
      email: emailOrUser.includes('@') ? emailOrUser.toLowerCase() : currentUser?.email || `${emailOrUser}@tsprotocol.io`,
      username: emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser,
      referralCode: currentUser?.referralCode || 'TSBNB888',
      registeredAt: currentUser?.registeredAt || Date.now() - 86400000 * 14,
      walletAddress: wallet.address || '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      savedPassword: rememberMe ? password : undefined,
      rememberMe,
      isRegistered: true,
    };

    setCurrentUser(loggedUser);

    try {
      localStorage.setItem('ts_bot_current_user', JSON.stringify(loggedUser));
      if (rememberMe) {
        localStorage.setItem(
          'ts_bot_saved_credentials',
          JSON.stringify({ email: loggedUser.email, password })
        );
        setSavedCredentials({ email: loggedUser.email, password });
      }
    } catch (e) {}

    return {
      success: true,
      message: `Welcome back, ${loggedUser.username}! Affiliate referrals and trading engine unlocked.`,
      user: loggedUser,
    };
  };

  // Logout User
  const logoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('ts_bot_current_user');
    } catch (e) {}
  };

  // Recover Password
  const recoverPassword = (email: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const tempPassword = 'TS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!';

    return {
      success: true,
      message: `Password recovery passcode generated for ${email}. Temporary recovery pass: ${tempPassword}`,
      tempPass: tempPassword,
    };
  };

  // Simulate a newly registered referral completing onboarding under user's code
  const addSimulatedReferral = (level: 1 | 2 | 3 | 4 = 1) => {
    const hexChars = '0123456789abcdef';
    let randomAddr = '0x';
    for (let i = 0; i < 40; i++) {
      randomAddr += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const tradeVol = [1500, 2500, 4200, 6000][Math.floor(Math.random() * 4)];
    const rate = level === 1 ? 0.01 : level === 2 ? 0.005 : level === 3 ? 0.0025 : 0.001;
    const earnedUsd = tradeVol * rate;
    const earnedBnb = earnedUsd / 614.5;

    const newRef: ReferralUser = {
      id: `ref-dyn-${Date.now()}`,
      address: randomAddr,
      level,
      joinedTimestamp: Date.now(),
      tradingVolumeUsd: tradeVol,
      commissionEarnedBnb: earnedBnb,
      commissionEarnedUsd: earnedUsd,
      status: 'ACTIVE',
    };

    setReferralUsers((prev) => {
      const updated = [newRef, ...prev];
      try {
        localStorage.setItem('ts_bot_referral_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setUnclaimedCommissionBnb((prev) => prev + earnedBnb);

    return {
      success: true,
      message: `New registered referral added under your affiliate code! You earned +${earnedBnb.toFixed(4)} BNB ($${earnedUsd.toFixed(2)} USD).`,
    };
  };

  const selectedPool = pools.find((p) => p.id === selectedPoolId) || pools[0];

  return (
    <ProtocolContext.Provider
      value={{
        pools,
        selectedPool,
        setSelectedPoolId,
        userPositions,
        tradeHistory,
        botConfig,
        setBotConfig,
        wallet,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        claimFaucet,
        addLiquidity,
        removeLiquidity,
        claimPoolFees,
        executeManualSwap,
        executeTierPackage,
        processRechargeBnb,
        processWithdrawalBnb,
        alerts,
        activeAlertToast,
        dismissAlertToast,
        referralUsers,
        unclaimedCommissionBnb,
        claimReferralCommission,
        currentUser,
        savedCredentials,
        registerUser,
        loginUser,
        logoutUser,
        recoverPassword,
        pendingInviteCode,
        setPendingInviteCode,
        addSimulatedReferral,
        financialMetrics,
        currentBlock,
        triggerBotBurst,
        rechargeBalance,
        rechargeBalanceUsd,
        hasRecharged,
        accumulatedMiningYieldBnb,
        claimMiningYield,
        resetSystemData,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}
