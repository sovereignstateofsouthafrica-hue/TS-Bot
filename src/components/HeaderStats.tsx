import React from 'react';
import { TrendingUp, ShieldCheck, DollarSign, Activity, Cpu } from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, formatNumber } from '../data/constants';

export const HeaderStats: React.FC = () => {
  const { pools, botConfig, hasRecharged, rechargeBalance } = useProtocol();

  const totalTvl = pools.reduce((acc, p) => acc + p.tvlUsd, 0);
  const totalVolume24h = pools.reduce((acc, p) => acc + p.volume24h, 0);
  const totalFees24h = pools.reduce((acc, p) => acc + p.fees24h, 0);
  const tsPrice = pools[0].tokenA.priceUsd;
  const tsChange = pools[0].tokenA.change24h;

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Announcement Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Non-Custodial Smart Contract Pool
            </span>
            <span className="hidden sm:inline-block text-zinc-500">|</span>
            <span className="text-zinc-400 hidden sm:inline-block">
              Zero centralized counterparty risk. Active figures start after confirming recharge.
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
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
            <span className="text-amber-300 font-bold">
              Recharge Bal: <span className="text-white">{rechargeBalance.toFixed(2)} BNB</span>
            </span>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-medium">Total Value Locked (TVL)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
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
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
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
            <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight">
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
            <div className="text-xl sm:text-2xl font-black text-violet-300 tracking-tight font-mono">
              {hasRecharged ? formatNumber(botConfig.totalSwapsExecuted, 0) : '0 Trades'}
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-1">
              {hasRecharged ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-emerald-400">Arbitrage & 4% Yield Active</span>
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
