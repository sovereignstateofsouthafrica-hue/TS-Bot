import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  Zap, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle, 
  ExternalLink, 
  Settings2, 
  Flame, 
  Sliders, 
  RotateCw,
  Clock,
  Radio
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, shortenAddress } from '../data/constants';

interface TradingBotViewProps {
  onOpenRecharge?: () => void;
  onOpenWithdrawal?: () => void;
}

export const TradingBotView: React.FC<TradingBotViewProps> = ({ onOpenRecharge, onOpenWithdrawal }) => {
  const { 
    botConfig, 
    setBotConfig, 
    tradeHistory, 
    triggerBotBurst, 
    currentBlock,
    pools,
    hasRecharged,
    rechargeBalance,
    rechargeBalanceUsd
  } = useProtocol();

  const [activeTab, setActiveTab] = useState<'live' | 'strategy' | 'settings'>('live');

  const tsBnbPool = pools.find(p => p.id === 'ts-bnb') || pools[0];

  const toggleBot = () => {
    if (!hasRecharged) {
      if (onOpenRecharge) onOpenRecharge();
      return;
    }
    setBotConfig(prev => ({ ...prev, active: !prev.active }));
  };

  const handleSpeedChange = (speed: 'normal' | 'fast' | 'turbo') => {
    setBotConfig(prev => ({ ...prev, tradingSpeed: speed }));
  };

  return (
    <div className="space-y-6">
      {/* Pre-recharge standby notice */}
      {!hasRecharged && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
            <div>
              <strong className="text-white block font-semibold">No Active Figures of Trading Before Recharging</strong>
              <span className="text-zinc-400">Active trading, AMM arbitrage, and 4% daily mining figures start after confirming your BNB recharge package.</span>
            </div>
          </div>
          {onOpenRecharge && (
            <button
              onClick={onOpenRecharge}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs hover:brightness-110 transition-all shrink-0"
            >
              Recharge BNB to Activate
            </button>
          )}
        </div>
      )}

      {/* Bot Hero Banner & Live Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        {/* Decorative Grid & Glow Background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Bot Identity & Visual Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {/* Animated Crypto Bot Graphic Container */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-amber-500/50 shadow-xl shadow-amber-500/20 group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 animate-pulse"></div>
                <Bot className="w-10 h-10 text-amber-400 z-10 transition-transform group-hover:scale-110 duration-300" />
                
                {/* Orbiting particles */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-950"></span>
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  TS BOT <span className="text-amber-400">BNB Yield Engine</span>
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                  botConfig.active 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  <Radio className={`w-3 h-3 ${botConfig.active ? 'animate-pulse text-emerald-400' : ''}`} />
                  {botConfig.active ? 'ENGINE ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Automated liquidity provisioning & arbitrage protocol for TS Token 
                <span className="text-zinc-200 font-mono ml-1 font-semibold">({shortenAddress(CONTRACTS.TS_TOKEN)})</span>. 
                Continuously synchronizes AMM bonding curves, captures swap slippage, and auto-compounds liquidity provider fee splits.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                  <span className="text-zinc-500">Target:</span>
                  <span className="text-amber-400 font-semibold">{botConfig.targetPair}</span>
                </span>
                <span className="flex items-center gap-1 font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                  <span className="text-zinc-500">Block:</span>
                  <span className="text-white">#{currentBlock}</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span>0.25% dynamic fee capture</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bot Control Center Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={toggleBot}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                botConfig.active 
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 hover:brightness-110'
              }`}
            >
              {botConfig.active ? (
                <>
                  <Pause className="w-4 h-4 fill-amber-400" />
                  <span>Pause Bot</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Activate Bot</span>
                </>
              )}
            </button>

            <button
              onClick={triggerBotBurst}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
              title="Execute an immediate arbitrage swap execution"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Trigger Swap Burst</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-[11px] font-semibold">
              <button
                onClick={() => handleSpeedChange('normal')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  botConfig.tradingSpeed === 'normal' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1x Normal
              </button>
              <button
                onClick={() => handleSpeedChange('fast')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  botConfig.tradingSpeed === 'fast' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2x Fast
              </button>
              <button
                onClick={() => handleSpeedChange('turbo')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  botConfig.tradingSpeed === 'turbo' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                Turbo
              </button>
            </div>
          </div>
        </div>

        {/* Live Bot Pulse Log */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-zinc-300">Latest Action:</span>
            <span className="font-mono text-zinc-400 truncate">{botConfig.lastAction}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Avg execution time: 0.8s</span>
          </div>
        </div>
      </div>

      {/* Cybernetic Bot Image Command Center */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl group">
        <div className="relative w-full h-80 sm:h-96 md:h-[420px] overflow-hidden">
          <img 
            src={CONTRACTS.BOT_IMAGE_PATH} 
            alt="TS BOT TRADING • BNB BOT - BNB CHAIN | AUTOMATED TRADING SYSTEM"
            className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-zinc-950/80 pointer-events-none"></div>

          {/* Top telemetry bar */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>TS BOT TRADING • BNB BOT</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-300">
                BLOCK: <span className="text-amber-400 font-bold">42,391,102</span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-300">
                GAS: <span className="text-emerald-400 font-bold">2.1 GWEI</span>
              </span>
            </div>
          </div>

          {/* Bottom telemetry overlay & quick actions */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                  AUTO TRADING ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold font-mono">
                  SCALPING V3.2
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                BNB Chain Automated Liquidity & Scalping Protocol
              </h3>
              <p className="text-xs text-zinc-300 font-medium line-clamp-2 drop-shadow">
                Real-time neural execution monitoring multi-pair liquidity books, arbitrage divergence, and instant fee payouts.
              </p>
            </div>

            {/* Quick Action Buttons on Bot Command Center */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenRecharge && (
                <button
                  onClick={onOpenRecharge}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs shadow-xl hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Recharge BNB</span>
                </button>
              )}
              {onOpenWithdrawal && (
                <button
                  onClick={onOpenWithdrawal}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-bold text-xs backdrop-blur-md shadow-xl transition-all"
                >
                  Withdrawal BNB
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bot Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">Total Algorithmic Volume</div>
          <div className="text-xl font-black text-white">{formatUSD(botConfig.totalVolumeUsd)}</div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Generated from automated rebalancing</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">Fees Captured for LP Holders</div>
          <div className="text-xl font-black text-amber-400">{formatUSD(botConfig.totalFeesGeneratedUsd)}</div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>Credited directly to pool reserves</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">Bot Algorithmic Efficiency</div>
          <div className="text-xl font-black text-emerald-400">99.82%</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            <span>Zero failed transactions on BSC</span>
          </div>
        </div>
      </div>

      {/* Tabs: Live Order Stream vs Strategy Explanation vs Parameters */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'live' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Execution Stream</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'strategy' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Bot Architecture & AMM Math</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Bot Configuration</span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-mono hidden sm:block">
            Pool Contract: {shortenAddress(tsBnbPool.contractAddress)}
          </div>
        </div>

        {/* Tab 1: Live Stream */}
        {activeTab === 'live' && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800/80 pb-2">
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Swapped</th>
                    <th className="py-2.5 px-3 font-semibold">Received</th>
                    <th className="py-2.5 px-3 font-semibold">Execution Price</th>
                    <th className="py-2.5 px-3 font-semibold">Slippage</th>
                    <th className="py-2.5 px-3 font-semibold">Gas (Gwei)</th>
                    <th className="py-2.5 px-3 font-semibold">Transaction Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {tradeHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <Activity className="w-8 h-8 text-zinc-600 mx-auto" />
                          <div className="font-bold text-white text-sm">No Active Figures of Trading Before Recharging</div>
                          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                            Active AMM trading volume, algorithmic swaps, and fee distributions start immediately after confirming your BNB recharge package.
                          </p>
                          {onOpenRecharge && (
                            <button
                              onClick={onOpenRecharge}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-sans transition-all shadow-md"
                            >
                              <span>Recharge BNB to Start Figures</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tradeHistory.slice(0, 12).map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : tx.type === 'SELL'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                          }`}>
                            {tx.type === 'ARBITRAGE_REBALANCE' ? 'ARBITRAGE' : tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-200">
                          {tx.amountIn.toFixed(3)} <span className="text-zinc-400">{tx.tokenIn}</span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-200">
                          {tx.amountOut.toFixed(3)} <span className="text-zinc-400">{tx.tokenOut}</span>
                        </td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">
                        ${tx.price.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {tx.slippagePct}%
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {tx.gasUsedGwei.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        <span className="flex items-center gap-1 text-zinc-400 hover:text-amber-400 cursor-pointer">
                          <span>{shortenAddress(tx.txHash)}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Strategy Architecture */}
        {activeTab === 'strategy' && (
          <div className="mt-4 space-y-4 text-xs text-zinc-300">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Automated Liquidity Provisioning & Constant Product Formula
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                The TS BOT engine does not operate as an opaque, custodial black-box. Instead, it interacts directly with decentralized Constant Product Market Makers ($x \times y = k$) on BNB Chain:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="font-bold text-amber-400 mb-1">1. Spread Detection</div>
                  <p className="text-zinc-400 text-[11px]">
                    The bot continuously monitors the price of TS Token across the TS/BNB pool, TS/USDT pool, and external decentralized routers.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="font-bold text-emerald-400 mb-1">2. Arbitrage Execution</div>
                  <p className="text-zinc-400 text-[11px]">
                    When cross-pool deviation exceeds 0.15%, the bot triggers an automated atomic flash-swap to bring pools back into mathematical parity.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="font-bold text-cyan-400 mb-1">3. Liquidity Fee Recycling</div>
                  <p className="text-zinc-400 text-[11px]">
                    Every trade incurs the protocol's 0.25% fee. 100% of collected liquidity fees are retained in the pool reserve, increasing the redemption value of all LP tokens.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-amber-300">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Transparent Non-Custodial Yield vs. Fixed Return Schemes:</span>
                <p className="text-zinc-300 text-[11px] mt-1 leading-relaxed">
                  Real decentralized yields are generated strictly from genuine swap fees and arbitrage rebalancing. 
                  Unlike fraudulent schemes that promise guaranteed 4% daily returns through Ponzi-style deposits to personal wallets, 
                  TS Protocol relies entirely on verifiable smart contracts, open liquidity pools, and mathematical market maker mechanics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bot Settings */}
        {activeTab === 'settings' && (
          <div className="mt-4 space-y-4 max-w-xl text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Minimum Arbitrage Spread Threshold</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.05"
                  max="1.5"
                  step="0.05"
                  value={botConfig.minSpreadPct}
                  onChange={(e) => setBotConfig(prev => ({ ...prev, minSpreadPct: parseFloat(e.target.value) }))}
                  className="w-full accent-amber-400"
                />
                <span className="font-mono text-amber-400 font-bold w-12">{botConfig.minSpreadPct}%</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Lower spread executes more frequent trades; higher spread captures larger profit margins per trade.</p>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <label className="block text-zinc-300 font-semibold mb-1">Max Slippage Tolerance</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={botConfig.maxSlippagePct}
                  onChange={(e) => setBotConfig(prev => ({ ...prev, maxSlippagePct: parseFloat(e.target.value) }))}
                  className="w-full accent-amber-400"
                />
                <span className="font-mono text-white font-bold w-12">{botConfig.maxSlippagePct}%</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Transactions with price impact exceeding this threshold will automatically revert.</p>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-zinc-300 font-semibold">Auto-Rebalance Liquidity Reserves</span>
                <p className="text-[11px] text-zinc-500">Automatically rebalances 50/50 token proportions during asymmetric market shifts.</p>
              </div>
              <input
                type="checkbox"
                checked={botConfig.autoRebalance}
                onChange={(e) => setBotConfig(prev => ({ ...prev, autoRebalance: e.target.checked }))}
                className="w-5 h-5 accent-amber-400 rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
