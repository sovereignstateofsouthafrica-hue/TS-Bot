import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, ShieldCheck, DollarSign, Activity, Cpu, RefreshCw, Wallet } from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, formatNumber } from '../data/constants';

export const HeaderStats: React.FC = () => {
  const {
    pools,
    botConfig,
    hasRecharged,
    rechargeBalance,
    binanceCloud,
    wallet,
    refreshTokenBalances,
    lastBalanceRefreshAt,
    alerts,
  } = useProtocol();

  const [displayedBalances, setDisplayedBalances] = useState<{ BNB: number; TS: number }>({
    BNB: wallet.balances.BNB,
    TS: wallet.balances.TS,
  });
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const lastHandledAlertIdRef = useRef<string | null>(alerts[0]?.id ?? null);
  const syncTimerRef = useRef<number | null>(null);

  const triggerSyncFlash = useCallback((label: string) => {
    setSyncNotice(label);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      setSyncNotice(null);
    }, 2200);
  }, []);

  // Automatically refreshes the user's BNB and TS token balances in HeaderStats
  const refreshHeaderTokenBalances = useCallback(
    (source: 'RECHARGE' | 'WITHDRAWAL' | 'MANUAL' = 'MANUAL') => {
      const updated = refreshTokenBalances(source);
      setDisplayedBalances({
        BNB: updated.BNB,
        TS: updated.TS,
      });
      triggerSyncFlash(
        source === 'RECHARGE'
          ? 'Recharge Synced'
          : source === 'WITHDRAWAL'
          ? 'Withdrawal Synced'
          : 'Synced'
      );
      return updated;
    },
    [refreshTokenBalances, triggerSyncFlash]
  );

  // Keep HeaderStats token balances synced whenever wallet or lastBalanceRefreshAt updates
  useEffect(() => {
    setDisplayedBalances({
      BNB: wallet.balances.BNB,
      TS: wallet.balances.TS,
    });
  }, [wallet.balances.BNB, wallet.balances.TS, lastBalanceRefreshAt]);

  // Automatically refresh BNB & TS balances whenever a Recharge or Withdrawal transaction completes
  useEffect(() => {
    const latestAlert = alerts[0];
    if (!latestAlert) return;
    if (latestAlert.id === lastHandledAlertIdRef.current) return;

    lastHandledAlertIdRef.current = latestAlert.id;
    if (latestAlert.type === 'RECHARGE' || latestAlert.type === 'WITHDRAWAL') {
      refreshHeaderTokenBalances(latestAlert.type);
    }
  }, [alerts, refreshHeaderTokenBalances]);

  // Listen for direct balance-refresh events dispatched by RechargeModal / WithdrawalModal / ProtocolContext
  useEffect(() => {
    const handleBalancesRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<{
        BNB?: number;
        TS?: number;
        source?: 'RECHARGE' | 'WITHDRAWAL' | 'MANUAL';
      }>;
      const detail = customEvent.detail;
      if (detail && typeof detail.BNB === 'number' && typeof detail.TS === 'number') {
        setDisplayedBalances({
          BNB: detail.BNB,
          TS: detail.TS,
        });
        triggerSyncFlash(
          detail.source === 'RECHARGE'
            ? 'Recharge Synced'
            : detail.source === 'WITHDRAWAL'
            ? 'Withdrawal Synced'
            : 'Synced'
        );
      }
    };

    window.addEventListener('ts:token-balances-refreshed', handleBalancesRefreshed);
    return () => {
      window.removeEventListener('ts:token-balances-refreshed', handleBalancesRefreshed);
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [triggerSyncFlash]);

  const totalTvl = pools.reduce((acc, p) => acc + p.tvlUsd, 0);
  const totalVolume24h = pools.reduce((acc, p) => acc + p.volume24h, 0);
  const totalFees24h = pools.reduce((acc, p) => acc + p.fees24h, 0);
  const tsPrice = pools[0].tokenA.priceUsd;
  const tsChange = pools[0].tokenA.change24h;

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Announcement & Live Token Balances Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Non-Custodial Smart Contract Pool
            </span>
            <span className="hidden sm:inline-block text-zinc-500">|</span>
            <span className="text-zinc-400 hidden lg:inline-block">
              Zero centralized counterparty risk. Active figures start after confirming recharge.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-nums">
            <span className="text-zinc-400">
              TS Price: <span className="text-white font-bold">${tsPrice.toFixed(2)}</span>
              <span className={`ml-1 font-semibold ${tsChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tsChange >= 0 ? `+${tsChange}%` : `${tsChange}%`}
              </span>
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">
              BNB Price: <span className="text-amber-400 font-bold">$614.50</span>
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <span>Binance Cloud:</span>
              <span className="text-white">{binanceCloud.connected ? `${binanceCloud.hashrateTh.toFixed(1)} TH/s` : 'Standby'}</span>
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300 font-semibold flex items-center gap-1" data-testid="header-bnb-balance">
              <Wallet className="w-3 h-3 text-amber-400" />
              <span>BNB:</span>
              <span className="text-amber-300 font-bold">{displayedBalances.BNB.toFixed(4)}</span>
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300 font-semibold" data-testid="header-ts-balance">
              TS: <span className="text-emerald-300 font-bold">{formatNumber(displayedBalances.TS, 2)}</span>
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-amber-300 font-bold" data-testid="header-recharge-balance">
              Recharge Bal: <span className="text-white">{rechargeBalance.toFixed(4)} BNB</span>
            </span>
            <button
              type="button"
              onClick={() => refreshHeaderTokenBalances('MANUAL')}
              title="Refresh BNB and TS balances"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              {syncNotice && <span className="text-emerald-400 font-semibold">{syncNotice}</span>}
            </button>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">Total Value Locked (TVL)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono tabular-nums">
              {formatUSD(totalTvl)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">+4.2%</span>
              <span>across 3 active AMM pairs</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">24h Trading Volume</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight font-mono tabular-nums">
              {formatUSD(totalVolume24h)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Real AMM swap volume</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">24h LP Fee Distribution</span>
              <CoinsIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight font-mono tabular-nums">
              {formatUSD(totalFees24h)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              <span>0.25% fee directly to LP holders</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">TS Bot Executions</span>
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-violet-300 tracking-tight font-mono tabular-nums">
              {hasRecharged ? formatNumber(botConfig.totalSwapsExecuted, 0) : '0 Trades'}
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-1.5">
              {hasRecharged ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400">Arbitrage & 32%/d ($16/5d) Active</span>
                </>
              ) : (
                <span className="text-zinc-500">Standby • Starts after Recharge</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}
