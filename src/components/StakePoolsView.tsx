import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  Landmark,
  Layers,
  Link2,
  Megaphone,
  PlusCircle,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { StakePool, StakePoolCategory } from '../types';
import { CONTRACTS, formatUSD, shortenAddress, WITHDRAWAL_RULES } from '../data/constants';

interface StakePoolsViewProps {
  onOpenWithdrawal?: () => void;
  onGoToCreateNft?: () => void;
}

type CategoryFilter = 'ALL' | StakePoolCategory;

export const StakePoolsView: React.FC<StakePoolsViewProps> = ({
  onOpenWithdrawal,
  onGoToCreateNft,
}) => {
  const {
    stakePools,
    stakeHistory,
    stakeIntoPool,
    unstakeFromPool,
    claimStakeReward,
    toggleStakeFeedToMining,
    miningNfts,
    adSlots,
    toggleNftStakePoolConnection,
    linkAllNftsToRwaAndTsBnb,
    connectStakePoolWithAllNfts,
    toggleAdConnection,
    connectAllAds,
    googleAdsConfig,
    openPopupBusinessAd,
    wallet,
    rechargeBalanceUsd,
    accumulatedMiningYieldBnb,
  } = useProtocol();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPoolId, setSelectedPoolId] = useState<string>(stakePools[0]?.id || 'cardamom-rwa');
  const [stakeAmountUsd, setStakeAmountUsd] = useState<string>('50');
  const [paymentMethod, setPaymentMethod] = useState<'USDT' | 'BNB' | 'RECHARGE'>('USDT');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const ownedNfts = miningNfts.filter((n) => n.owned);
  const connectedAds = adSlots.filter((a) => a.connected);

  const getPoolNftBoost = (poolId: string) => {
    const linkedNfts = ownedNfts.filter((n) => (n.connectedPoolIds || []).includes(poolId));
    const boostApyPct = linkedNfts.reduce((sum, n) => sum + (n.stakePoolApyBoostPct ?? 4.0), 0);
    return {
      linkedNfts,
      boostApyPct,
      boostDailyPct: boostApyPct / 30,
    };
  };

  const totalStakedUsd = stakePools.reduce((sum, p) => sum + p.userStakedUsd, 0);
  const totalDailyYieldUsd = stakePools.reduce((sum, p) => {
    const { boostDailyPct } = getPoolNftBoost(p.id);
    return sum + p.userStakedUsd * ((p.dailyRatePct + boostDailyPct) / 100);
  }, 0);
  const totalAccruedRewardsUsd = stakePools.reduce((sum, p) => sum + p.accruedRewardsUsd, 0);
  const totalProtocolTvlUsd = stakePools.reduce((sum, p) => sum + p.tvlUsd, 0);

  const selectedPool: StakePool =
    stakePools.find((p) => p.id === selectedPoolId) || stakePools[0];
  const selectedPoolBoost = getPoolNftBoost(selectedPool.id);
  const selectedEffectiveApy = selectedPool.apyPct + selectedPoolBoost.boostApyPct;
  const selectedEffectiveDailyRate = selectedPool.dailyRatePct + selectedPoolBoost.boostDailyPct;

  const filteredPools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stakePools.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.symbol.toLowerCase().includes(q) ||
        p.assetBacking.toLowerCase().includes(q) ||
        p.custodian.toLowerCase().includes(q)
      );
    });
  }, [stakePools, categoryFilter, searchQuery]);

  const categoryLabel = (cat: StakePoolCategory) => {
    switch (cat) {
      case 'COMMODITY_RWA':
        return 'Commodity RWA';
      case 'TREASURY_MONEY':
        return 'Real-Money Treasury';
      case 'REAL_ESTATE_RWA':
        return 'Real Estate RWA';
      case 'CRYPTO_STAKE':
        return 'PoS Validator Stake';
    }
  };

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(stakeAmountUsd);
    if (isNaN(usd) || usd <= 0) {
      showFeedback('error', 'Please enter a valid stake amount in USD.');
      return;
    }
    const res = stakeIntoPool(selectedPool.id, usd, paymentMethod);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  return (
    <div className="space-y-8">
      {/* Overview Header & 4-Metric Hairline KPI Strip */}
      <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-amber-400">
              Real-Money Asset Pools · Cardamom Commodity, TS Sovereign NFTs & Connected Ads
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Stake Pools & Real-Money Asset Vaults
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Stake USDT, BNB, or Recharge Balance into real-money asset pools—including Green Cardamom Export Receipts, US Treasury Cash Reserves, Allocated Gold, Commercial Real Estate, and Cardano ADA Validators. Connect TS Sovereign NFTs for bonus APY boosts and link Partner Ads for daily revenue streams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onGoToCreateNft && (
              <button
                type="button"
                onClick={onGoToCreateNft}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Create TS NFT & Ads</span>
              </button>
            )}
            {onOpenWithdrawal && (
              <button
                type="button"
                onClick={onOpenWithdrawal}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Withdraw BNB Profits
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-zinc-800">
          <div>
            <div className="text-xs text-zinc-400">Your Staked Real Assets</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums mt-1">
              {formatUSD(totalStakedUsd)}
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {(totalStakedUsd / WITHDRAWAL_RULES.BNB_PRICE_USD).toFixed(4)} BNB equiv
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Daily Real-Asset Yield</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
              +{formatUSD(totalDailyYieldUsd)}/day
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {stakePools.filter((p) => p.userStakedUsd > 0).length} active vaults · {ownedNfts.length} TS NFTs · {connectedAds.length} Ads
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Claimable Stake Rewards</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums mt-1">
              {formatUSD(totalAccruedRewardsUsd)}
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              Mining Pool: {accumulatedMiningYieldBnb.toFixed(5)} BNB
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Total RWA Pool Liquidity</div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono tabular-nums mt-1">
              {formatUSD(totalProtocolTvlUsd)}
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              USDT Bal: {formatUSD(wallet.balances.USDT)}
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/70 border-rose-800 text-rose-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}
      </section>

      {/* Active Staking Allocation Console + Category Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Filterable Real-Money Asset & Stake Pools Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: `All Pools (${stakePools.length})` },
                  { id: 'COMMODITY_RWA', label: 'Cardamom & Commodities' },
                  { id: 'TREASURY_MONEY', label: 'Real-Money USD' },
                  { id: 'REAL_ESTATE_RWA', label: 'Real Estate' },
                  { id: 'CRYPTO_STAKE', label: 'Cardano ADA' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === tab.id
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Cardamom, Treasury..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {filteredPools.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-10 text-center space-y-3">
              <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-sm font-bold text-white">No Matching Stake Pools</div>
              <p className="text-xs text-zinc-400">
                Reset filters to view Cardamom RWA, Treasury Bills, Real Estate, and Cardano ADA stake pools.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
              >
                Show All Stake Pools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPools.map((pool) => {
                const isSelected = selectedPool?.id === pool.id;
                const { linkedNfts, boostApyPct, boostDailyPct } = getPoolNftBoost(pool.id);
                const effectiveApyPct = pool.apyPct + boostApyPct;
                const effectiveDailyPct = pool.dailyRatePct + boostDailyPct;
                const dailyEarnedUsd = pool.userStakedUsd * (effectiveDailyPct / 100);
                const allOwnedConnected =
                  ownedNfts.length > 0 && linkedNfts.length >= ownedNfts.length;

                return (
                  <div
                    key={pool.id}
                    onClick={() => setSelectedPoolId(pool.id)}
                    className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 border-amber-500/70'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="text-xs text-zinc-400 font-mono flex items-center justify-between gap-2">
                        <span>
                          {categoryLabel(pool.category)} · {pool.symbol}
                        </span>
                        <span className="text-zinc-500">
                          {pool.lockPeriodDays === 0 ? 'Flexible' : `${pool.lockPeriodDays}d Term`}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-white leading-snug">
                          {pool.name}
                        </h3>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-400 font-mono tabular-nums block">
                            {effectiveApyPct.toFixed(1)}% APY
                          </span>
                          {boostApyPct > 0 && (
                            <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                              +{boostApyPct.toFixed(1)}% NFT Boost
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-zinc-400">
                        <span className="text-zinc-300 font-medium">{pool.assetBacking}</span>
                        <span className="text-zinc-600"> · </span>
                        <span>{pool.custodian}</span>
                      </div>

                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                        {pool.description}
                      </p>

                      <div className="pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                        <div>
                          <span className="text-zinc-500 block">Your Stake</span>
                          <span className="text-white font-bold">
                            {formatUSD(pool.userStakedUsd)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Daily Yield</span>
                          <span className="text-emerald-400 font-bold">
                            +{formatUSD(dailyEarnedUsd)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">TS NFTs</span>
                          <span className="text-amber-400 font-bold">
                            {linkedNfts.length} linked
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const res = toggleStakeFeedToMining(pool.id);
                          showFeedback(res.success ? 'success' : 'error', res.message);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          pool.feedToMiningProfits
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                        }`}
                      >
                        {pool.feedToMiningProfits ? 'Feeding Mining Profits' : 'Settling to USDT'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const res = connectStakePoolWithAllNfts(pool.id);
                            showFeedback(res.success ? 'success' : 'error', res.message);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                            allOwnedConnected
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:text-amber-300'
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>{allOwnedConnected ? 'NFTs Linked' : 'Connect NFTs'}</span>
                        </button>
                        {pool.accruedRewardsUsd > 0.001 && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = claimStakeReward(pool.id);
                              showFeedback(res.success ? 'success' : 'error', res.message);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs whitespace-nowrap cursor-pointer"
                          >
                            Claim
                          </button>
                        )}
                        {pool.userStakedUsd > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = unstakeFromPool(pool.id, 100);
                              showFeedback(res.success ? 'success' : 'error', res.message);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs whitespace-nowrap cursor-pointer"
                          >
                            Unstake
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Stake Ticket */}
        <aside className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5">
          <div className="pb-3 border-b border-zinc-800">
            <div className="text-xs font-mono text-amber-400">
              {categoryLabel(selectedPool.category)} · {selectedPool.symbol}
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Stake into {selectedPool.name}</span>
            </h2>
          </div>

          <form onSubmit={handleStakeSubmit} className="space-y-4 text-xs">
            {/* Payment Source */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                Funding Source
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                {(
                  [
                    { id: 'USDT', label: 'USDT' },
                    { id: 'BNB', label: 'BNB' },
                    { id: 'RECHARGE', label: 'Recharge' },
                  ] as const
                ).map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setPaymentMethod(src.id)}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      paymentMethod === src.id
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1.5 tabular-nums">
                {paymentMethod === 'USDT' && `Available: ${formatUSD(wallet.balances.USDT)} USDT`}
                {paymentMethod === 'BNB' &&
                  `Available: ${wallet.balances.BNB.toFixed(4)} BNB (${formatUSD(
                    wallet.balances.BNB * WITHDRAWAL_RULES.BNB_PRICE_USD
                  )})`}
                {paymentMethod === 'RECHARGE' &&
                  `Available Recharge: ${formatUSD(rechargeBalanceUsd)}`}
              </div>
            </div>

            {/* Stake Amount USD */}
            <div>
              <div className="flex justify-between text-zinc-400 mb-1.5">
                <label className="font-semibold">Stake Amount (USD)</label>
                <span className="font-mono">Min ${selectedPool.minStakeUsd}</span>
              </div>
              <input
                type="number"
                step="1"
                min={selectedPool.minStakeUsd}
                value={stakeAmountUsd}
                onChange={(e) => setStakeAmountUsd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-lg font-bold text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />

              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[10, 50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStakeAmountUsd(String(amt))}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      Number(stakeAmountUsd) === amt
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Yield Projection */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-zinc-400">
                <span>Asset Backing:</span>
                <span className="text-zinc-200 text-right max-w-[170px] truncate">
                  {selectedPool.assetBacking}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Effective APY:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedEffectiveApy.toFixed(1)}%
                  {selectedPoolBoost.boostApyPct > 0
                    ? ` (+${selectedPoolBoost.boostApyPct.toFixed(1)}% NFT)`
                    : ''}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Daily Yield ({selectedEffectiveDailyRate.toFixed(2)}%/day):</span>
                <span className="text-emerald-400 font-bold">
                  +{formatUSD((parseFloat(stakeAmountUsd) || 0) * (selectedEffectiveDailyRate / 100))}/day
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>30-Day Est. Payout:</span>
                <span className="text-amber-400 font-bold">
                  +{formatUSD((parseFloat(stakeAmountUsd) || 0) * (selectedEffectiveDailyRate / 100) * 30)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Pool TVL:</span>
                <span className="text-white">{formatUSD(selectedPool.tvlUsd)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const res = connectStakePoolWithAllNfts(selectedPool.id);
                showFeedback(res.success ? 'success' : 'error', res.message);
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Link All Owned TS NFTs ({selectedPoolBoost.linkedNfts.length}/{ownedNfts.length})
              </span>
            </button>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Zap className="w-4 h-4 stroke-[2.5]" />
              <span>Stake ${parseFloat(stakeAmountUsd) || 0} into {selectedPool.symbol}</span>
            </button>
          </form>
        </aside>
      </div>

      {/* TS Sovereign NFTs & Connected Ads Bridge */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected TS NFTs Bridge */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>TS NFT Connectors → {selectedPool.symbol}</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Link TS MEM & Sovereign NFTs ($1.00 TS BNB RWA Value) to {selectedPool.name} for +APY boosts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const res = linkAllNftsToRwaAndTsBnb();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                Link NFTs ↔ RWA ($1 TS BNB)
              </button>
              {onGoToCreateNft && (
                <button
                  type="button"
                  onClick={onGoToCreateNft}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  + Create TS MEM NFT
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {ownedNfts.map((nft) => {
              const isLinked = (nft.connectedPoolIds || []).includes(selectedPool.id);
              const boostPct = nft.stakePoolApyBoostPct ?? 4.0;
              const rwaUsd = nft.rwaValueUsd ?? 1.00;
              return (
                <div
                  key={nft.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-amber-500/30 shrink-0">
                      <img
                        src={nft.image || CONTRACTS.TS_MEM_GOLD_BNB_IMAGE}
                        alt={nft.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {nft.name}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 tabular-nums mt-0.5">
                        {nft.tokenId} · <span className="text-emerald-400 font-bold">${rwaUsd.toFixed(2)} RWA (TS BNB)</span> · +{boostPct.toFixed(1)}% APY · {(nft.linkedNftIds || []).length} NFTs
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const res = toggleNftStakePoolConnection(nft.id, selectedPool.id);
                      showFeedback(res.success ? 'success' : 'error', res.message);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isLinked
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {isLinked ? 'Connected' : `Connect ${selectedPool.symbol}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connect Appearing Google Business Ads Panel */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-400" />
                <span>Appearing Business Google Ads · Truworths, Jet, Game</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Appearing retail business pop-up Google Ads ({googleAdsConfig.googleTagId}) streaming daily yield into Stake Pools & Mining Profits.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openPopupBusinessAd()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                Pop Up Business Ad
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = connectAllAds();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs whitespace-nowrap cursor-pointer"
              >
                Connect All Ads
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {adSlots.slice(0, 4).map((ad) => (
              <div
                key={ad.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {ad.advertiser} — {ad.headlineOffer || ad.title}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 tabular-nums mt-0.5 truncate">
                    {ad.brandDomain || 'business.google.com'} · <span className="text-emerald-400 font-bold">+{formatUSD(ad.dailyRevenueUsd)}/day</span> · {ad.impressions24h.toLocaleString()} pop-ups
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openPopupBusinessAd(ad.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    Pop Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = toggleAdConnection(ad.id);
                      showFeedback(res.success ? 'success' : 'error', res.message);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      ad.connected
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black'
                    }`}
                  >
                    {ad.connected ? 'Ad Connected' : 'Connect Ad'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stake & Real-Money Asset Activity Ledger */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Stake Pools & RWA Settlement Ledger</span>
            </h2>
            <p className="text-xs text-zinc-400">
              On-chain staking deposits, real-money asset yield claims, and Mining Profit feeds.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {stakeHistory.length} Events Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="py-2.5 pr-4 font-semibold">Pool Name</th>
                <th className="py-2.5 px-4 font-semibold">Action</th>
                <th className="py-2.5 px-4 font-semibold">Asset</th>
                <th className="py-2.5 px-4 font-semibold">Block</th>
                <th className="py-2.5 px-4 font-semibold">Tx Hash</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
              {stakeHistory.slice(0, 12).map((evt) => (
                <tr key={evt.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 pr-4 text-white font-sans font-semibold">
                    {evt.poolName}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-amber-400 font-semibold">
                    {evt.action.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-4 text-zinc-300">{evt.paymentMethod}</td>
                  <td className="py-2.5 px-4 text-zinc-400">#{evt.blockNumber}</td>
                  <td className="py-2.5 px-4 text-zinc-400">{shortenAddress(evt.txHash)}</td>
                  <td className="py-2.5 pl-4 text-right font-bold text-emerald-400">
                    {formatUSD(evt.amountUsd)} ({evt.amountBnb.toFixed(4)} BNB)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
