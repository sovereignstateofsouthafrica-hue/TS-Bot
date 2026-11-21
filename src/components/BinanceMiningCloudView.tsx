import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Server, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight, 
  Coins, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  RotateCw, 
  Copy, 
  ExternalLink,
  Sliders,
  Clock,
  Terminal,
  Radio,
  Gift
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { BINANCE_CLOUD_MINING, CONTRACTS, WITHDRAWAL_RULES, formatUSD, shortenAddress } from '../data/constants';

interface BinanceMiningCloudViewProps {
  onOpenWithdrawal?: () => void;
  onOpenRecharge?: () => void;
  onGoToAirdrops?: () => void;
}

export const BinanceMiningCloudView: React.FC<BinanceMiningCloudViewProps> = ({ 
  onOpenWithdrawal, 
  onOpenRecharge,
  onGoToAirdrops
}) => {
  const {
    binanceCloud,
    cloudShares,
    connectBinanceMiningCloud,
    disconnectBinanceMiningCloud,
    boostMiningEngine,
    setCloudRegion,
    setMiningMultiplier,
    accumulatedMiningYieldBnb,
    achievedMiningTotalBnb,
    claimMiningYield,
    rechargeBalance,
    currentBlock,
  } = useProtocol();

  const [copiedStratum, setCopiedStratum] = useState(false);
  const [boostToast, setBoostToast] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'nodes' | 'console'>('monitor');

  const bnbPrice = WITHDRAWAL_RULES.BNB_PRICE_USD;
  const currentMinedUsd = accumulatedMiningYieldBnb * bnbPrice;
  const minMinedReqUsd = WITHDRAWAL_RULES.MIN_MINED_REQUIRED_USD; // $16.00
  const minMinedProgress = Math.min(100, Math.max(0, (currentMinedUsd / minMinedReqUsd) * 100));

  const copyStratum = () => {
    navigator.clipboard.writeText(binanceCloud.poolEndpoint);
    setCopiedStratum(true);
    setTimeout(() => setCopiedStratum(false), 2000);
  };

  const handleBoostClick = (mult?: number) => {
    setIsBoosting(true);
    setTimeout(() => {
      const res = boostMiningEngine(mult);
      setBoostToast(res.message);
      setIsBoosting(false);
      setTimeout(() => setBoostToast(null), 6000);
    }, 400);
  };

  const handleClaim = () => {
    const res = claimMiningYield();
    setBoostToast(res.message);
    setTimeout(() => setBoostToast(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Stratum Cloud Connection State */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-zinc-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
              <span className="text-2xl font-mono">🟡</span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5">
                  <Radio className={`w-3 h-3 ${binanceCloud.connected ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                  {binanceCloud.connected ? 'BINANCE MINING CLOUD • ONLINE' : 'CLOUD STANDBY'}
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs font-mono text-zinc-300">
                  Worker: <strong className="text-white">{binanceCloud.activeWorkerId}</strong>
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs font-mono text-amber-400">
                  Region: {binanceCloud.region}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                TS BNB Token <span className="text-amber-400">Binance Mining Cloud</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
                Direct Stratum cloud connection to Binance Pool BEP-20 PoSA ASIC hashing clusters. Continuous block mining, automated yield compression, and overclocked engine multipliers.
              </p>
            </div>
          </div>

          {/* Connection Toggle & Copy Stratum */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={copyStratum}
              className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm"
              title="Copy Binance Stratum URL"
            >
              {copiedStratum ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStratum ? 'Stratum Copied!' : 'Copy Stratum'}</span>
            </button>

            {binanceCloud.connected ? (
              <button
                onClick={disconnectBinanceMiningCloud}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={() => connectBinanceMiningCloud('Frankfurt (EU-Central)')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Connect Binance Cloud</span>
              </button>
            )}
          </div>
        </div>

        {/* Boost Banner Feedback */}
        {boostToast && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{boostToast}</span>
            </div>
            <button 
              onClick={() => setBoostToast(null)}
              className="text-emerald-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/50"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Hero Telemetry Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Hashrate Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Cloud Hashrate</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
            {binanceCloud.connected ? `${binanceCloud.hashrateTh.toFixed(1)} TH/s` : '0.0 TH/s'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{binanceCloud.multiplier}x Multiplier Active</span>
          </div>
        </div>

        {/* Mining Multiplier */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Engine Overclock</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1.5">
            <span>{binanceCloud.multiplier}x</span>
            <span className="text-xs font-sans text-rose-400 uppercase tracking-wider font-bold">
              {binanceCloud.multiplier === 1 ? 'Standard' : binanceCloud.multiplier === 2 ? 'Accelerated' : binanceCloud.multiplier === 5 ? 'Turbo' : 'Quantum'}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Daily Rate: <span className="text-emerald-400 font-semibold">{(32.0 * binanceCloud.multiplier).toFixed(1)}% / day ($16/5d base)</span>
          </div>
        </div>

        {/* Mined Dashboard Count */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Unified TS BOT & IRD Balance</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight tabular-nums">
            {accumulatedMiningYieldBnb.toFixed(6)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
            ≈ {formatUSD(currentMinedUsd)} USD · Achieved: {achievedMiningTotalBnb.toFixed(4)} BNB
          </div>
        </div>

        {/* Cloud Efficiency */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Binance Pool Shares</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight">
            {binanceCloud.acceptedShares.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Accepted: 99.97% • Rej: {binanceCloud.rejectedShares}
          </div>
        </div>
      </div>

      {/* Main Boost Mining Engine Interactive Command Center */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>BINANCE CLOUD ASIC ACCELERATOR</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Boost Mining Engine Overclock
            </h2>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Supercharge your TS BNB cloud hashrate directly through Binance Cloud allocation clusters. Boosting increases daily percentage yields and instantly mines new block solutions, fast-tracking your balance toward the withdrawal requirement.
            </p>

            {/* Overclock Multiplier Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-zinc-400 font-semibold block">
                Select Overclock Engine Tier:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BINANCE_CLOUD_MINING.BOOST_TIERS.map((tier) => (
                  <button
                    key={tier.level}
                    type="button"
                    onClick={() => setMiningMultiplier(tier.multiplier)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      binanceCloud.multiplier === tier.multiplier
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold'
                        : 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-mono font-black">{tier.multiplier}x {tier.name}</div>
                    <div className="text-[10px] opacity-80 font-mono">
                      {tier.dailyYieldRate}% / day (+{tier.bonusHashTh} TH)
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger Box */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-inner space-y-4 shrink-0 lg:w-80 text-center">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-500/60 shadow-xl shadow-amber-500/20">
              <Cpu className={`w-10 h-10 text-amber-400 ${isBoosting ? 'animate-spin' : 'animate-pulse'}`} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-950"></span>
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="text-xs font-mono text-zinc-400">Current Overclock Status:</div>
              <div className="text-base font-black text-amber-400 font-mono">
                {binanceCloud.multiplier}x SPEED ({binanceCloud.hashrateTh.toFixed(1)} TH/s)
              </div>
            </div>

            {/* Giant Boost Button */}
            <button
              onClick={() => handleBoostClick()}
              disabled={isBoosting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Zap className="w-5 h-5 fill-zinc-950" />
              <span>{isBoosting ? 'Overclocking Cloud...' : '⚡ BOOST MINING ENGINE'}</span>
            </button>

            <span className="text-[10px] text-zinc-500 font-mono">
              Instantly accelerates hash rate & credits immediate block reward
            </span>
          </div>
        </div>
      </div>

      {/* Withdrawal Requirement Bridge Card ($15 min / $16 mined) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
                WITHDRAWAL PROTOCOL
              </span>
              <h3 className="text-sm font-bold text-white">
                Withdrawal Rule: Starts from $15.00 ($16.00 Mined Required)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              BNB miner must have mined at least <strong>$16.00 USD</strong> to authorize a <strong>$15.00 USD</strong> withdrawal because of the <strong>$1.00 Withdrawal Charges</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onGoToAirdrops && (
              <button
                type="button"
                onClick={onGoToAirdrops}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Airdrops & NFTs Feed</span>
              </button>
            )}

            {onOpenWithdrawal && (
              <button
                onClick={onOpenWithdrawal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Withdrawal BNB</span>
              </button>
            )}

            <button
              onClick={handleClaim}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 font-semibold text-xs transition-all flex items-center gap-1.5"
              title="Claim accumulated mining profit to wallet"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Claim to Wallet</span>
            </button>
          </div>
        </div>

        {/* Progress Toward $16 Mined Requirement */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Miner Progress to $16.00 Requirement:</span>
            <span className={currentMinedUsd >= 16.0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {formatUSD(currentMinedUsd)} / $16.00 USD ({minMinedProgress.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
            <div 
              className={`h-full transition-all duration-500 ${
                currentMinedUsd >= 16.0 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
              }`}
              style={{ width: `${minMinedProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs: Shares Stream vs Stratum Nodes vs Console */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'monitor'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Binance Cloud Shares Stream</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('nodes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'nodes'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Cloud Server Clusters</span>
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'console'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Stratum Protocol Log</span>
            </button>
          </div>

          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            Protocol: BEP-20 PoSA Stratum v1.0
          </span>
        </div>

        {/* Tab 1: Live Cloud Shares Stream */}
        {activeTab === 'monitor' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Block Height</th>
                  <th className="py-2.5 px-3">Nonce</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Hashrate</th>
                  <th className="py-2.5 px-3">Reward</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {cloudShares.map((share) => (
                  <tr key={share.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        share.shareStatus === 'BOOSTED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : share.shareStatus === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      }`}>
                        {share.shareStatus === 'BOOSTED' && <Sparkles className="w-3 h-3" />}
                        {share.shareStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold">
                      #{share.blockNumber}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">
                      {share.nonce}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {share.difficulty}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-semibold">
                      {share.hashrateTh.toFixed(1)} TH/s
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      +{share.rewardBnb.toFixed(6)} BNB
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500">
                      {new Date(share.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Cloud Server Clusters */}
        {activeTab === 'nodes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {BINANCE_CLOUD_MINING.REGIONS.map((reg) => {
              const isSelected = binanceCloud.region.includes(reg.id.toUpperCase()) || binanceCloud.region.includes(reg.name.split(' ')[0]);
              return (
                <div
                  key={reg.id}
                  onClick={() => setCloudRegion(reg.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">{reg.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                      {reg.ping}ms
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                    <div>IP: {reg.ip}</div>
                    <div>Port: 8888 (Stratum)</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] font-mono font-semibold text-amber-400 flex items-center justify-between">
                    <span>{isSelected ? '✓ CONNECTED NODE' : 'CLICK TO CONNECT'}</span>
                    <Radio className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Stratum Protocol Console Log */}
        {activeTab === 'console' && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5 max-h-60 overflow-y-auto">
            <div className="text-zinc-500">// Binance Mining Cloud Stratum Client Console (Session #{currentBlock})</div>
            <div className="text-emerald-400">[CONNECT] Resolved stratum+tcp://bnb-cloud.binancepool.com:8888 -&gt; 185.122.56.12:8888</div>
            <div className="text-zinc-300">[HANDSHAKE] stratum.subscribe("TS_BNB_Miner/3.2.0") =&gt; OK (ExtraNonce1: 0x4a91b)</div>
            <div className="text-zinc-300">[AUTH] mining.authorize("{binanceCloud.activeWorkerId}", "x") =&gt; TRUE</div>
            <div className="text-amber-400">[SET_DIFF] mining.set_difficulty(131072.0)</div>
            <div className="text-cyan-400">[ENGINE] PoSA Hasher active on TS/BNB pair. Current hashrate: {binanceCloud.hashrateTh.toFixed(1)} TH/s</div>
            <div className="text-emerald-400">[SHARE_ACCEPTED] Nonce 0x7f9a21b4 submitted =&gt; Valid share accepted in 18ms</div>
            <div className="text-yellow-400">[OVERCLOCK] Active Multiplier: {binanceCloud.multiplier}x (Overclock Engine Running)</div>
          </div>
        )}
      </div>
    </div>
  );
};
