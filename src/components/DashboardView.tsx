import React, { useState } from 'react';
import { 
  Layers, 
  ArrowRight, 
  ArrowDownUp, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink, 
  Activity,
  Sliders,
  ShieldCheck,
  Zap,
  UserPlus,
  LogIn,
  Sparkles,
  Cpu,
  ArrowDown,
  Gift,
  Landmark
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, formatNumber, shortenAddress, calculateAmountOut, CONTRACTS, WITHDRAWAL_RULES, MINING_PACKAGE_RULES, MINING_FEED_RULES } from '../data/constants';
import { MiningMachinePackage } from '../types';
import { MiningMachinesSection } from './MiningMachinesSection';
import { BuyMachineModal } from './BuyMachineModal';

interface DashboardViewProps {
  onGoToBot: () => void;
  onGoToLiquidity: () => void;
  onGoToMining?: () => void;
  onGoToAirdrops?: () => void;
  onGoToStakePools?: () => void;
  onGoToPaycheck?: (address?: string) => void;
  onOpenRecharge?: () => void;
  onOpenWithdrawal?: () => void;
  onOpenAuth?: (mode: 'register' | 'login') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onGoToBot, 
  onGoToLiquidity,
  onGoToMining,
  onGoToAirdrops,
  onGoToStakePools,
  onGoToPaycheck,
  onOpenRecharge,
  onOpenWithdrawal,
  onOpenAuth 
}) => {
  const { 
    pools, 
    selectedPool, 
    setSelectedPoolId, 
    wallet, 
    executeManualSwap, 
    currentUser,
    rechargeBalance,
    rechargeBalanceUsd,
    hasRecharged,
    accumulatedMiningYieldBnb,
    achievedMiningTotalBnb,
    claimMiningYield,
    addMinedYieldBnb,
    binanceCloud,
    boostMiningEngine,
    cloudAirdropTokens,
    miningNfts,
    stakePools,
    adSlots,
    miningFeedAccumulatedUsd,
    miningFeedEnabled,
  } = useProtocol();

  const totalStakedRwaUsd = stakePools.reduce((sum, p) => sum + p.userStakedUsd, 0);

  const activeFeedTokens = cloudAirdropTokens.filter((t) => t.isFeedingMining);
  const activeFeedNfts = miningNfts.filter((n) => n.owned && n.isStakedFeeding);
  const activeAds = adSlots.filter((a) => a.connected);
  const dailyAssetFeedUsd =
    (miningFeedEnabled ? MINING_FEED_RULES.DAILY_ACCUMULATION_USD : 0) +
    activeFeedTokens.reduce((sum, t) => sum + t.dailyFeedUsd, 0) +
    activeFeedNfts.reduce((sum, n) => sum + n.dailyFeedUsd, 0) +
    activeAds.reduce((sum, a) => sum + a.dailyRevenueUsd, 0);

  // Swap State
  const [fromToken, setFromToken] = useState<'TS' | 'BNB'>('BNB');
  const [swapAmount, setSwapAmount] = useState<string>('0.5');
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  // Second Generation TS Mining Machine Package Purchase State
  const [selectedMachinePackage, setSelectedMachinePackage] = useState<MiningMachinePackage | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  const handleClaimMining = () => {
    const res = claimMiningYield();
    setClaimMsg(res.message);
    setTimeout(() => setClaimMsg(null), 5000);
  };

  const numAmount = parseFloat(swapAmount) || 0;
  const isFromTokenA = fromToken === selectedPool.tokenA.symbol;
  const reserveIn = isFromTokenA ? selectedPool.reserveA : selectedPool.reserveB;
  const reserveOut = isFromTokenA ? selectedPool.reserveB : selectedPool.reserveA;

  const quote = calculateAmountOut(numAmount, reserveIn, reserveOut, selectedPool.feeRate);
  const toToken = fromToken === 'TS' ? 'BNB' : 'TS';

  const handleSwap = () => {
    if (numAmount <= 0) {
      setSwapError('Please enter a valid swap amount');
      return;
    }
    const res = executeManualSwap(selectedPool.id, fromToken, numAmount);
    if (res.success) {
      setSwapSuccess(res.message);
      setSwapError(null);
    } else {
      setSwapError(res.message);
      setSwapSuccess(null);
    }
    setTimeout(() => {
      setSwapSuccess(null);
      setSwapError(null);
    }, 5000);
  };

  const toggleDirection = () => {
    setFromToken(fromToken === 'TS' ? 'BNB' : 'TS');
  };

  return (
    <div className="space-y-6">
      {/* Featured Dashboard Recharge Balance Command Card */}
      <div className={`p-6 rounded-3xl border shadow-2xl transition-all ${
        hasRecharged 
          ? 'bg-gradient-to-br from-zinc-900 via-amber-950/20 to-zinc-900 border-amber-500/50 shadow-amber-500/10'
          : 'bg-zinc-900/95 border-zinc-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                hasRecharged
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${hasRecharged ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                {hasRecharged 
                  ? 'PACKAGE 1 ($10 RECHARGED) • MINES $16.00 IN 5 DAYS (32%/DAY)' 
                  : 'AWAITING RECHARGE • TRADING FIGURES INACTIVE'}
              </span>
              <span className="text-zinc-600 text-xs hidden sm:inline">•</span>
              <span className="text-amber-400 text-xs font-mono font-semibold hidden sm:inline">
                Package 1: $10 Mines $16 in 5 Days
              </span>
              <span className="text-zinc-600 text-xs hidden sm:inline">•</span>
              {onGoToPaycheck ? (
                <button
                  type="button"
                  onClick={() => onGoToPaycheck(CONTRACTS.RECHARGE_ROUTER_DEFI)}
                  className="text-zinc-300 hover:text-amber-400 text-xs font-mono hidden sm:inline-flex items-center gap-1 underline-offset-4 hover:underline cursor-pointer"
                  title="Navigate paycheck for 0xdB19b0785d1BA051ECdbC721c86e0828ACf43Db0"
                >
                  <span>Paycheck: {shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-zinc-400 text-xs font-mono hidden sm:inline">
                  Router: {shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}
                </span>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Dashboard Recharge Balance:
              </span>
              <div className="flex flex-wrap items-baseline gap-3 mt-1">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {rechargeBalance.toFixed(4)} <span className="text-amber-400">BNB</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-zinc-400 font-mono">
                  ({formatUSD(rechargeBalanceUsd)})
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  Package 1 ($10 → $16 in 5d) Active
                </span>
              </div>
            </div>

            {hasRecharged ? (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-mono">
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500">32% Daily ($16 / 5d):</span>
                    <span className="text-emerald-400 font-bold">
                      +{(rechargeBalance * MINING_PACKAGE_RULES.DAILY_RATE).toFixed(4)} BNB/day ({formatUSD(rechargeBalance * MINING_PACKAGE_RULES.DAILY_RATE * 614.5)}/day · {formatUSD(rechargeBalance * MINING_PACKAGE_RULES.DAILY_RATE * 614.5 * MINING_PACKAGE_RULES.TARGET_DAYS)} in 5d)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-inner tabular-nums">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-400">Unified TS BOT & IRD Balance:</span>
                    <span className="text-amber-400 font-bold text-sm tracking-wide">
                      {accumulatedMiningYieldBnb.toFixed(6)} BNB
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      (≈ {formatUSD(accumulatedMiningYieldBnb * 614.5)} · Achieved: {achievedMiningTotalBnb.toFixed(4)} BNB)
                    </span>
                  </div>
                </div>

                {/* Miner Withdrawal Protocol Rule Badge */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Withdrawal starts from <strong className="text-white">$15.00</strong> • Miner must have mined <strong className="text-white">$16.00</strong> to withdraw $15.00 (<span className="text-amber-400 font-bold">$1.00</span> charge)
                    </span>
                  </div>
                  {accumulatedMiningYieldBnb * 614.5 < 16.0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const neededBnb = (16.50 / 614.5) - accumulatedMiningYieldBnb;
                        addMinedYieldBnb(Math.max(0.001, neededBnb));
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-semibold transition-colors"
                      title="Fast-forward miner earnings to test $16 withdrawal requirement"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Boost to $16.00 Mined</span>
                    </button>
                  )}
                </div>

                {/* Binance Mining Cloud Live Connection & Engine Boost Strip */}
                <div className="mt-2 p-3 rounded-2xl bg-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <span>🟡 Binance Mining Cloud:</span>
                        <span className="text-white font-black">{binanceCloud.hashrateTh.toFixed(1)} TH/s</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {binanceCloud.multiplier}x BOOST
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-sans block">
                        Direct Stratum cluster: <span className="text-zinc-200 font-mono">{binanceCloud.region}</span> • Accepted Shares: {binanceCloud.acceptedShares.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const res = boostMiningEngine();
                        setClaimMsg(res.message);
                        setTimeout(() => setClaimMsg(null), 6000);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-xs font-sans shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                      <span>Boost Mining Engine</span>
                    </button>

                    {onGoToMining && (
                      <button
                        type="button"
                        onClick={onGoToMining}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 font-semibold text-xs font-sans transition-all flex items-center gap-1"
                      >
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cloud Console</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed max-w-xl">
                <strong className="text-amber-300 font-semibold block mb-0.5">Zero figures before recharging:</strong>
                Active figures of trading and mining start after recharging. Confirm a BNB recharge package ($10 - $1,000) to activate the TS BNB trading bot ($10 package mines $16.00 in 5 days at 32%/day).
              </div>
            )}
          </div>

          {/* Action buttons on the Recharge Balance card */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenRecharge && (
              <button
                onClick={onOpenRecharge}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Coins className="w-4 h-4 fill-zinc-950" />
                <span>{hasRecharged ? 'Recharge More BNB' : 'Recharge BNB Packages ($10 - $1000)'}</span>
              </button>
            )}

            {hasRecharged && (
              <button
                onClick={handleClaimMining}
                className="px-4 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sync accumulated TS BOT & IRD mining profit to wallet without decreasing Mining Dashboard balance"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Sync Profit to Wallet ({accumulatedMiningYieldBnb.toFixed(4)} BNB)</span>
              </button>
            )}

            {onOpenWithdrawal && (
              <button
                onClick={onOpenWithdrawal}
                className="px-4 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-850 text-emerald-400 border border-zinc-750 font-bold text-xs transition-all shadow-md"
              >
                Withdrawal BNB
              </button>
            )}

            {onGoToPaycheck && (
              <button
                type="button"
                onClick={() => onGoToPaycheck(CONTRACTS.RECHARGE_ROUTER_DEFI)}
                className="px-4 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Inspect & withdraw paycheck for 0xdB19b0785d1BA051ECdbC721c86e0828ACf43Db0"
              >
                <span>Paycheck ({shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {claimMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{claimMsg}</span>
          </div>
        )}

        {/* Live Cloud Airdrops, Meme Tokens, TS Sovereign NFTs & Connected Ads Feeder Strip */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-amber-500/40 shrink-0">
              <img
                src={CONTRACTS.TS_SOVEREIGN_NFT_IMAGE}
                alt="TS Sovereign De-Coin NFT"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">
                TS Sovereign NFT, Connected Ads & 24h Mining Feed ($1.00 / 24h)
              </div>
              <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                Feed: <span className="text-amber-400 font-semibold">{formatUSD(miningFeedAccumulatedUsd)} / $1.00</span> · {activeFeedTokens.length} tokens · {activeFeedNfts.length} TS NFTs · {activeAds.length} Ads ·{' '}
                <span className="text-emerald-400 font-semibold">+{formatUSD(dailyAssetFeedUsd)}/day</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onGoToStakePools && (
              <button
                type="button"
                onClick={onGoToStakePools}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-emerald-500/40 text-emerald-400 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Stake Pools · Cardamom & RWA ({formatUSD(totalStakedRwaUsd)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onGoToAirdrops && (
              <button
                type="button"
                onClick={onGoToAirdrops}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create TS NFT & Connect Ads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Second Generation Product Quick Jump Action */}
      <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-amber-500/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-[10px] tracking-wider uppercase shadow-sm">
                Second Generation Product
              </span>
              <span className="text-xs font-bold text-white">TS Mining Machines & Packages</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono hidden sm:inline">
                $100 to $2000 Rigs
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Scroll down to view the <strong className="text-amber-300">TS BNB Professional Mining Rig Lineup</strong>, connect active hardware machines, and buy mining machine packages.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('ts-mining-machines');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer"
        >
          <span>Scroll Down: TS Mining Machines</span>
          <ArrowDown className="w-4 h-4 animate-bounce stroke-[3]" />
        </button>
      </div>

      {/* Featured TS BOT Image Station Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold font-mono">
                BNB CHAIN • LIVE TELEMETRY
              </span>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                hasRecharged ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${hasRecharged ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <span>{hasRecharged ? 'Auto Trading Active ($10 Mines $16 / 5d)' : 'Awaiting Recharge to Start Trading'}</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              TS BOT Automated Yield & Liquidity Station
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maximized daily yields on TS BNB pair (<span className="text-zinc-200 font-mono">0x639E8A...</span>) through algorithmic arbitrage routing and continuous fee distribution.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {onOpenRecharge && (
                <button
                  onClick={onOpenRecharge}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Recharge BNB</span>
                </button>
              )}
              {onOpenWithdrawal && (
                <button
                  onClick={onOpenWithdrawal}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 font-bold text-xs transition-all"
                >
                  Withdrawal BNB
                </button>
              )}
              <button
                onClick={onGoToBot}
                className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <span>Launch Bot Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {!currentUser && onOpenAuth && (
                <>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                    title="Register New Account & Node"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Register</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                    title="Log In"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>Log In</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bot visual thumbnail */}
          <div 
            onClick={onGoToBot}
            className="relative w-full md:w-80 h-44 rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl cursor-pointer group shrink-0"
          >
            <img
              src={CONTRACTS.BOT_IMAGE_PATH}
              alt="TS BOT Autonomous Trading Station"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono font-bold bg-zinc-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
              <span className="text-amber-400">TS BOT TRADING</span>
              <span className={hasRecharged ? 'text-emerald-400' : 'text-zinc-400'}>
                {hasRecharged ? 'ONLINE V3.2' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner with Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Pools Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Active AMM Liquidity Pools on BNB Chain
            </h2>
            <span className="text-xs text-zinc-400 font-mono">0.25% Protocol Swap Fee</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pools.map((pool) => {
              const totalApy = pool.apyBase + pool.apyReward;
              const isSelected = selectedPool.id === pool.id;

              return (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPoolId(pool.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-500/70 shadow-xl shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm">
                        <span>{pool.tokenA.icon}</span>
                        <span>{pool.tokenB.icon}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{pool.pairName}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{pool.feeRate * 100}% Fee Tier</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase">Organic APY</span>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {totalApy.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono py-2.5 border-y border-zinc-800/80 my-2">
                    <div className="flex justify-between text-zinc-400">
                      <span>Total TVL:</span>
                      <span className="font-bold text-white">{formatUSD(pool.tvlUsd)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>24h Volume:</span>
                      <span className="text-amber-400 font-bold">{formatUSD(pool.volume24h)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>24h LP Fees:</span>
                      <span className="text-cyan-400 font-bold">{formatUSD(pool.fees24h)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-zinc-500 font-mono">
                      {shortenAddress(pool.contractAddress)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoolId(pool.id);
                        onGoToLiquidity();
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>Supply LP</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Constant Product Market Maker Visualization */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Decentralized Bonding Curve Visualizer ($x \cdot y = k$)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                k = {(selectedPool.reserveA * selectedPool.reserveB / 1e6).toFixed(2)}M
              </span>
            </div>

            {/* SVG Hyperbola Curve Graph */}
            <div className="h-44 w-full bg-zinc-950 rounded-xl p-3 relative flex items-center justify-center border border-zinc-800/80">
              <svg className="w-full h-full" viewBox="0 0 400 140" fill="none">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="380" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="380" y2="60" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="380" y2="100" stroke="#27272a" strokeDasharray="3 3" />
                
                {/* Axes */}
                <line x1="40" y1="10" x2="40" y2="120" stroke="#52525b" strokeWidth="1.5" />
                <line x1="40" y1="120" x2="380" y2="120" stroke="#52525b" strokeWidth="1.5" />

                {/* Hyperbolic AMM Curve (x * y = k) */}
                <path
                  d="M 50 20 Q 90 90 360 115"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  fill="none"
                />

                {/* Equilibrium point */}
                <circle cx="160" cy="85" r="5" fill="#10b981" stroke="#09090b" strokeWidth="2" />
                <text x="175" y="80" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Equilibrium (${selectedPool.tokenA.priceUsd.toFixed(2)})
                </text>

                {/* Labels */}
                <text x="45" y="15" fill="#71717a" fontSize="9" fontFamily="monospace">Reserve Y (BNB)</text>
                <text x="320" y="132" fill="#71717a" fontSize="9" fontFamily="monospace">Reserve X (TS)</text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Dynamic automated price discovery without centralized bookkeepers.</span>
              <button
                onClick={onGoToBot}
                className="text-amber-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Real-Time Bot Execution</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Decentralized Instant Swap Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Decentralized AMM Swap
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                Router V2
              </span>
            </div>

            {swapSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                {swapSuccess}
              </div>
            )}
            {swapError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {swapError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {/* Pay token */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>You Pay</span>
                  <span>Bal: {wallet.balances[fromToken]?.toFixed(2)} {fromToken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="bg-transparent text-xl font-bold text-white focus:outline-none w-2/3"
                    placeholder="0.0"
                  />
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold text-amber-400">
                    {fromToken}
                  </span>
                </div>
              </div>

              {/* Invert button */}
              <div className="flex justify-center -my-1">
                <button
                  onClick={toggleDirection}
                  className="p-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowDownUp className="w-4 h-4" />
                </button>
              </div>

              {/* Receive token */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>You Receive (Estimated)</span>
                  <span>Bal: {wallet.balances[toToken]?.toFixed(2)} {toToken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {quote.amountOut.toFixed(4)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-200">
                    {toToken}
                  </span>
                </div>
              </div>

              {/* Price details */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Price Impact:</span>
                  <span className={`font-semibold ${quote.priceImpact > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidity Provider Fee:</span>
                  <span>0.25% ({(numAmount * 0.0025).toFixed(4)} {fromToken})</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Gas:</span>
                  <span className="text-zinc-300">~0.00045 BNB (~$0.28)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleSwap}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
            >
              Swap via TS AMM Router
            </button>

            <button
              onClick={onGoToLiquidity}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Provide Liquidity to Earn Fees</span>
            </button>
          </div>
        </div>
      </div>

      {/* Second Generation Product: TS Mining Machines (Connect Machines & Packages) */}
      <MiningMachinesSection
        id="ts-mining-machines"
        onBuyPackage={(pkg) => {
          setSelectedMachinePackage(pkg);
          setBuyModalOpen(true);
        }}
        onOpenWithdrawal={onOpenWithdrawal}
      />

      {/* Buy Mining Machines Packages Modal */}
      <BuyMachineModal
        isOpen={buyModalOpen}
        onClose={() => {
          setBuyModalOpen(false);
          setSelectedMachinePackage(null);
        }}
        selectedPackage={selectedMachinePackage}
      />
    </div>
  );
};
