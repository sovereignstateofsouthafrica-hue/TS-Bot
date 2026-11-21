import React, { useState } from 'react';
import {
  Coins,
  Gift,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Pause,
  Play,
  ShieldCheck,
  Image as ImageIcon,
  PlusCircle,
  Link2,
  Megaphone,
  Landmark,
  Film,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, MINING_FEED_RULES, shortenAddress, WITHDRAWAL_RULES } from '../data/constants';
import { AdCampaignSlot, MiningNftAsset } from '../types';

interface AirdropsMemeNftViewProps {
  onOpenWithdrawal?: () => void;
  onGoToStakePools?: () => void;
  onGoToGov?: () => void;
}

export const AirdropsMemeNftView: React.FC<AirdropsMemeNftViewProps> = ({
  onOpenWithdrawal,
  onGoToStakePools,
  onGoToGov,
}) => {
  const {
    cloudAirdropTokens,
    miningNfts,
    stakePools,
    adSlots,
    miningProfitFeedHistory,
    accumulatedMiningYieldBnb,
    claimMiningYield,
    claimAirdropToken,
    toggleTokenFeedMining,
    mintOrClaimNft,
    toggleNftFeedMining,
    createTsNft,
    toggleNftStakePoolConnection,
    toggleNftToNftLink,
    linkAllNftsToRwaAndTsBnb,
    connectNftToAllStakePools,
    toggleAdConnection,
    connectAllAds,
    createAdConnection,
    googleAdsConfig,
    googleAdsConversions,
    updateGoogleAdsConfig,
    toggleGoogleAdsStatus,
    triggerGoogleAdsConversion,
    popupAdEnabled,
    togglePopupAdEnabled,
    openPopupBusinessAd,
    isVideoNftPlaying,
    setIsVideoNftPlaying,
    videoPlayEarningsUsd,
    videoNftPoolEarningsUsd,
    collectVideoAndNftPoolMoney,
    harvestAllFeedsToMiningProfits,
    wallet,
    miningFeedEnabled,
    miningFeedAccumulatedUsd,
    miningFeedTotalSettledUsd,
    collectMiningFeedToProfits,
    advance24hMiningFeed,
  } = useProtocol();

  const [filterTab, setFilterTab] = useState<'ALL' | 'CLOUD_AIRDROP' | 'MEME_TOKEN' | 'NFT' | 'ADS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create TS MEM / TS NFT Studio State
  const [showCreateNft, setShowCreateNft] = useState<boolean>(true);
  const [nftMediaPreset, setNftMediaPreset] = useState<
    'TS_MEM_VIDEO' | 'TS_MEM_GOLD' | 'SOVEREIGN_VIDEO' | 'SOVEREIGN_GOLD'
  >('TS_MEM_VIDEO');
  const [newNftName, setNewNftName] = useState<string>('TS MEM · Isiphahla Royal ZEE BNB NFT');
  const [newNftCollection, setNewNftCollection] = useState<string>(
    'TS MEM NFT · Isiphahla Royal Dynasty ($1 TS BNB RWA)'
  );
  const [newNftRarity, setNewNftRarity] = useState<MiningNftAsset['rarity']>('Legendary');
  const [newNftRwaUsd, setNewNftRwaUsd] = useState<string>('1.00');
  const [selectedPoolIdsForNewNft, setSelectedPoolIdsForNewNft] = useState<string[]>(() =>
    stakePools.map((p) => p.id)
  );
  const [expandedNftPoolsId, setExpandedNftPoolsId] = useState<string | null>(null);

  // Custom Business Ad & Google Ads Integration State
  const [businessCategoryFilter, setBusinessCategoryFilter] = useState<
    'ALL' | 'FASHION_RETAIL' | 'SUPERSTORE_TECH' | 'GROCERY_FOOD' | 'FINANCE_TELECOM'
  >('ALL');
  const [newAdTitle, setNewAdTitle] = useState<string>('');
  const [newAdAdvertiser, setNewAdAdvertiser] = useState<string>('');
  const [newAdBrandDomain, setNewAdBrandDomain] = useState<string>('');
  const [newAdHeadlineOffer, setNewAdHeadlineOffer] = useState<string>('');
  const [newAdBusinessCategory, setNewAdBusinessCategory] = useState<
    NonNullable<AdCampaignSlot['businessCategory']>
  >('FASHION_RETAIL');
  const [newAdTarget, setNewAdTarget] = useState<AdCampaignSlot['connectedTarget']>('STAKE_POOLS');
  const [newAdNetwork, setNewAdNetwork] = useState<AdCampaignSlot['network']>('GOOGLE_ADS');
  const [newAdCampaignType, setNewAdCampaignType] = useState<AdCampaignSlot['campaignType']>('DISPLAY');
  const [tagIdInput, setTagIdInput] = useState<string>(googleAdsConfig.googleTagId);
  const [convLabelInput, setConvLabelInput] = useState<string>(googleAdsConfig.conversionLabel);
  const [budgetInput, setBudgetInput] = useState<string>(String(googleAdsConfig.dailyBudgetUsd));

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Aggregate telemetry calculations
  const activeTokens = cloudAirdropTokens.filter((t) => t.isFeedingMining);
  const activeNfts = miningNfts.filter((n) => n.owned && n.isStakedFeeding);
  const activeAds = adSlots.filter((a) => a.connected);

  const baseMiningFeedUsd = miningFeedEnabled ? MINING_FEED_RULES.DAILY_ACCUMULATION_USD : 0;
  const totalTokenDailyUsd = activeTokens.reduce((sum, t) => sum + t.dailyFeedUsd, 0);
  const totalNftDailyUsd = activeNfts.reduce((sum, n) => sum + n.dailyFeedUsd, 0);
  const totalAdsDailyUsd = activeAds.reduce((sum, a) => sum + a.dailyRevenueUsd, 0);
  const combinedDailyFeedUsd = baseMiningFeedUsd + totalTokenDailyUsd + totalNftDailyUsd + totalAdsDailyUsd;
  const combinedDailyFeedBnb = combinedDailyFeedUsd / WITHDRAWAL_RULES.BNB_PRICE_USD;

  const totalBoostPct = activeTokens.reduce((sum, t) => sum + t.miningBoostPct, 0);
  const totalNftMult = activeNfts.reduce((sum, n) => sum + n.miningProfitMultiplier, 0);

  const totalFedByAssetsBnb =
    cloudAirdropTokens.reduce((sum, t) => sum + t.totalFedBnb, 0) +
    miningNfts.reduce((sum, n) => sum + n.totalFedBnb, 0);

  const collectableVideoAndPoolUsd = Number(
    (
      videoPlayEarningsUsd +
      videoNftPoolEarningsUsd +
      stakePools.reduce((sum, p) => sum + p.accruedRewardsUsd, 0)
    ).toFixed(2)
  );

  const query = searchQuery.trim().toLowerCase();

  const filteredTokens = cloudAirdropTokens.filter((t) => {
    if (filterTab === 'NFT' || filterTab === 'ADS') return false;
    if (filterTab === 'CLOUD_AIRDROP' && t.category !== 'CLOUD_AIRDROP') return false;
    if (filterTab === 'MEME_TOKEN' && t.category !== 'MEME_TOKEN') return false;
    if (!query) return true;
    return (
      t.name.toLowerCase().includes(query) ||
      t.symbol.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  });

  const filteredNfts = miningNfts.filter((n) => {
    if (filterTab === 'CLOUD_AIRDROP' || filterTab === 'MEME_TOKEN' || filterTab === 'ADS') return false;
    if (!query) return true;
    return (
      n.name.toLowerCase().includes(query) ||
      n.collection.toLowerCase().includes(query) ||
      n.tokenId.toLowerCase().includes(query)
    );
  });

  const filteredAds = adSlots.filter((a) => {
    if (filterTab !== 'ALL' && filterTab !== 'ADS') return false;
    if (businessCategoryFilter !== 'ALL' && a.businessCategory !== businessCategoryFilter) return false;
    if (!query) return true;
    return (
      a.title.toLowerCase().includes(query) ||
      a.advertiser.toLowerCase().includes(query) ||
      (a.brandDomain || '').toLowerCase().includes(query) ||
      (a.headlineOffer || '').toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    );
  });

  const handleCreateTsNft = (e: React.FormEvent) => {
    e.preventDefault();
    const isMeme = nftMediaPreset === 'TS_MEM_VIDEO' || nftMediaPreset === 'TS_MEM_GOLD';
    const selectedImage = isMeme
      ? CONTRACTS.TS_MEM_GOLD_BNB_IMAGE
      : CONTRACTS.TS_SOVEREIGN_NFT_IMAGE;
    const selectedVideo =
      nftMediaPreset === 'TS_MEM_VIDEO'
        ? CONTRACTS.TS_MEM_VIDEO_NFT
        : nftMediaPreset === 'SOVEREIGN_VIDEO'
        ? CONTRACTS.TS_SOVEREIGN_VIDEO_NFT
        : undefined;
    const rwaUsd = Math.max(0.01, parseFloat(newNftRwaUsd) || 1.00);
    const autoLinkedNftIds = miningNfts.filter((n) => n.owned).slice(0, 4).map((n) => n.id);

    const res = createTsNft({
      name: newNftName,
      collection: newNftCollection,
      rarity: newNftRarity,
      connectPoolIds: selectedPoolIdsForNewNft,
      linkedNftIds: autoLinkedNftIds,
      rwaValueUsd: rwaUsd,
      isMemeNft: isMeme,
      image: selectedImage,
      videoUrl: selectedVideo,
    });
    showFeedback(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setFilterTab('NFT');
    }
  };

  const handleToggleNewNftPool = (poolId: string) => {
    setSelectedPoolIdsForNewNft((prev) =>
      prev.includes(poolId) ? prev.filter((id) => id !== poolId) : [...prev, poolId]
    );
  };

  const handleAddCustomAd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedDomain = newAdBrandDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const res = createAdConnection({
      title: newAdTitle,
      advertiser: newAdAdvertiser,
      placement: newAdTarget === 'TS_NFT' ? 'NFT_SHOWCASE' : newAdTarget === 'STAKE_POOLS' ? 'STAKE_POOL_SPONSOR' : 'MINING_CLOUD',
      connectedTarget: newAdTarget,
      dailyRevenueUsd: newAdNetwork === 'GOOGLE_ADS' ? 4.80 : 3.20,
      network: newAdNetwork,
      campaignType: newAdCampaignType,
      businessCategory: newAdBusinessCategory,
      brandDomain: cleanedDomain || undefined,
      destinationUrl: cleanedDomain ? `https://${cleanedDomain}` : undefined,
      headlineOffer: newAdHeadlineOffer.trim() || newAdTitle,
    });
    showFeedback(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setNewAdTitle('');
      setNewAdAdvertiser('');
      setNewAdBrandDomain('');
      setNewAdHeadlineOffer('');
    }
  };

  const handleSaveGoogleTag = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateGoogleAdsConfig({
      googleTagId: tagIdInput,
      conversionLabel: convLabelInput,
      dailyBudgetUsd: parseFloat(budgetInput) || 25,
    });
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleHarvestAll = () => {
    const res = harvestAllFeedsToMiningProfits();
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleClaimYield = () => {
    const res = claimMiningYield();
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  return (
    <div className="space-y-8">
      {/* Header Overview & Primary Harvest Action */}
      <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-amber-400">
              BEP-20 Liquidity Catalysts · Autonomous Mining Yield Feeders
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cloud Air Drops, Meme Tokens & Mining NFTs
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Claim BEP-20 cloud airdrop allocations, route meme token swap liquidity, and stake Mining Relic NFTs to continuously feed BNB yield directly into your Mining Profits balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setFilterTab('NFT');
                setShowCreateNft(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-black text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create TS MEM NFT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const res = linkAllNftsToRwaAndTsBnb();
                showFeedback(res.success ? 'success' : 'error', res.message);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-black text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>Link NFTs ↔ RWA ($1 TS BNB)</span>
            </button>

            {onGoToStakePools && (
              <button
                type="button"
                onClick={onGoToStakePools}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Landmark className="w-4 h-4" />
                <span>Connect Stake Pools</span>
              </button>
            )}

            {onGoToGov && (
              <button
                type="button"
                onClick={onGoToGov}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit CIP-95 to Gov</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleHarvestAll}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 stroke-[2.5]" />
              <span>Harvest & Feed Profits</span>
            </button>

            <button
              type="button"
              onClick={handleClaimYield}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Claim {accumulatedMiningYieldBnb.toFixed(4)} BNB</span>
            </button>

            {onOpenWithdrawal && (
              <button
                type="button"
                onClick={onOpenWithdrawal}
                className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Withdraw BNB
              </button>
            )}
          </div>
        </div>

        {/* Clean 4-Metric Hairline-Divided KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-zinc-800">
          <div>
            <div className="text-xs text-zinc-400">Daily Asset, Ads & Mining Feed</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
              +{formatUSD(combinedDailyFeedUsd)}/24h
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              Base: $1/24h · Ads: +{formatUSD(totalAdsDailyUsd)} · +{combinedDailyFeedBnb.toFixed(4)} BNB
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">24h Base Mining Feed</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums mt-1">
              {formatUSD(miningFeedAccumulatedUsd)} / $1.00
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5 flex items-center gap-2">
              <span>Accumulates $1.00 every 24h</span>
              <button
                type="button"
                onClick={() => {
                  const res = advance24hMiningFeed();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="text-amber-400 hover:underline font-sans font-semibold cursor-pointer"
              >
                +24h ($1)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  const res = collectMiningFeedToProfits();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="text-emerald-400 hover:underline font-sans font-semibold cursor-pointer"
              >
                Collect
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Live Mining Profits Pool</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums mt-1">
              {accumulatedMiningYieldBnb.toFixed(6)} BNB
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {formatUSD(accumulatedMiningYieldBnb * WITHDRAWAL_RULES.BNB_PRICE_USD)} · +{totalBoostPct.toFixed(1)}% · +{totalNftMult.toFixed(2)}x
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">TS NFTs & Connected Ads</div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono tabular-nums mt-1">
              {miningNfts.filter((n) => n.owned).length} NFTs · {activeAds.length} Ads
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              Fed: {totalFedByAssetsBnb.toFixed(4)} BNB · {formatUSD(miningFeedTotalSettledUsd)} 24h feed
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

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Assets ({cloudAirdropTokens.length + miningNfts.length + adSlots.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('NFT')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterTab === 'NFT'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            TS NFTs ({miningNfts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ADS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterTab === 'ADS'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Business Pop-Up Ads ({adSlots.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('CLOUD_AIRDROP')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterTab === 'CLOUD_AIRDROP'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cloud Airdrops ({cloudAirdropTokens.filter((t) => t.category === 'CLOUD_AIRDROP').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('MEME_TOKEN')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterTab === 'MEME_TOKEN'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Meme Tokens ({cloudAirdropTokens.filter((t) => t.category === 'MEME_TOKEN').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tokens or NFTs..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Cloud Air Drops & Meme Tokens Catalog */}
      {filteredTokens.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-white">
              Cloud Air Drops & Meme Tokens Feeding Mining Profits
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              BEP-20 Verified Pools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTokens.map((token) => {
              const isClaimable = token.status === 'CLAIMABLE';
              const isFeeding = token.isFeedingMining;
              const dailyBnb = token.dailyFeedUsd / WITHDRAWAL_RULES.BNB_PRICE_USD;
              const positionUsd = (token.claimedAmount || token.claimableAmount) * token.priceUsd;

              return (
                <div
                  key={token.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                    isFeeding
                      ? 'bg-zinc-900 border-amber-500/50'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="text-xs text-zinc-400 font-mono flex items-center justify-between">
                      <span>
                        {token.category === 'CLOUD_AIRDROP' ? 'Cloud Airdrop' : 'Meme Token'} · {token.symbol}
                      </span>
                      <span className={isFeeding ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                        {isClaimable ? 'Ready to Claim' : isFeeding ? 'Feeding Mining' : 'Claimed · Paused'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{token.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {token.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                      <div>
                        <span className="text-zinc-500 block">Allocation</span>
                        <span className="text-white font-bold">
                          {(token.claimedAmount || token.claimableAmount).toLocaleString()} {token.symbol}
                        </span>
                        <span className="text-zinc-500 text-[11px] block">
                          ≈ {formatUSD(positionUsd)}
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block">Mining Profit Feed</span>
                        <span className="text-emerald-400 font-bold">
                          +{formatUSD(token.dailyFeedUsd)}/day
                        </span>
                        <span className="text-amber-400 text-[11px] block">
                          +{token.miningBoostPct}% boost ({dailyBnb.toFixed(4)} BNB)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
                      <span>Contract: {shortenAddress(token.contractAddress)}</span>
                      <span className="text-zinc-300 tabular-nums">
                        Fed: {token.totalFedBnb.toFixed(4)} BNB
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800">
                    {isClaimable ? (
                      <button
                        type="button"
                        onClick={() => {
                          const res = claimAirdropToken(token.id);
                          showFeedback(res.success ? 'success' : 'error', res.message);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Gift className="w-4 h-4 stroke-[2.5]" />
                        <span>Claim Airdrop & Feed Mining</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const res = toggleTokenFeedMining(token.id);
                          showFeedback(res.success ? 'success' : 'error', res.message);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                          isFeeding
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                      >
                        {isFeeding ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Actively Feeding · Pause Feed</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Activate Feed to Mining Profits</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Create TS NFT Studio & TS Vault NFTs Feeding Profits + Stake Pools */}
      {(filterTab === 'ALL' || filterTab === 'NFT') && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">
                TS Sovereign NFTs & Stake Pool Connectors
              </h2>
              <p className="text-xs text-zinc-400">
                Create BEP-721 TS NFTs backed by the Federal De-Coins medallion and connect them directly to RWA & Validator Stake Pools.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateNft((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-400 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showCreateNft ? 'Hide TS NFT Creator' : '+ Open TS NFT Creator'}
            </button>
          </div>

          {/* Interactive Create TS MEM & Sovereign NFT Studio */}
          {showCreateNft && (
            <form
              onSubmit={handleCreateTsNft}
              className="rounded-2xl bg-zinc-900 border border-amber-500/40 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Artwork / Compact 16:9 Video Token Preview (No Fullscreen) */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-3">
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 flex flex-col items-center justify-center gap-2.5 min-h-[190px]">
                  {nftMediaPreset === 'TS_MEM_VIDEO' || nftMediaPreset === 'SOVEREIGN_VIDEO' ? (
                    <>
                      <div
                        className="relative aspect-video w-full max-w-[196px] mx-auto rounded-lg bg-black border border-amber-500/40 overflow-hidden cursor-pointer"
                        onClick={() => setIsVideoNftPlaying(!isVideoNftPlaying)}
                        title="Compact 16:9 NFT Token Video (No Fullscreen)"
                      >
                        <video
                          src={
                            nftMediaPreset === 'TS_MEM_VIDEO'
                              ? CONTRACTS.TS_MEM_VIDEO_NFT
                              : CONTRACTS.TS_SOVEREIGN_VIDEO_NFT
                          }
                          poster={
                            nftMediaPreset === 'TS_MEM_VIDEO'
                              ? CONTRACTS.TS_MEM_GOLD_BNB_IMAGE
                              : CONTRACTS.TS_SOVEREIGN_NFT_IMAGE
                          }
                          autoPlay={isVideoNftPlaying}
                          loop
                          muted
                          playsInline
                          disablePictureInPicture
                          controlsList="nodownload nofullscreen noremoteplayback"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 tabular-nums text-center">
                        16:9 {nftMediaPreset === 'TS_MEM_VIDEO' ? 'TS MEM ZEE BNB' : 'Sovereign'} · RWA:{' '}
                        <span className="text-emerald-400 font-bold">${(parseFloat(newNftRwaUsd) || 1.0).toFixed(2)} TS BNB</span>
                      </div>
                    </>
                  ) : (
                    <div className="relative aspect-square w-full max-w-[180px] mx-auto rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
                      <img
                        src={
                          nftMediaPreset === 'TS_MEM_GOLD'
                            ? CONTRACTS.TS_MEM_GOLD_BNB_IMAGE
                            : CONTRACTS.TS_SOVEREIGN_NFT_IMAGE
                        }
                        alt="TS MEM & Gold BNB NFT Medallion"
                        referrerPolicy="no-referrer"
                        className="relative z-10 w-full h-full object-cover object-center"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNftMediaPreset('TS_MEM_VIDEO')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer border whitespace-nowrap ${
                      nftMediaPreset === 'TS_MEM_VIDEO'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <Film className="w-3 h-3" />
                    <span>TS MEM Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNftMediaPreset('TS_MEM_GOLD')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer border whitespace-nowrap ${
                      nftMediaPreset === 'TS_MEM_GOLD'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>ZB 10z Gold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNftMediaPreset('SOVEREIGN_VIDEO')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer border whitespace-nowrap ${
                      nftMediaPreset === 'SOVEREIGN_VIDEO'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <Film className="w-3 h-3" />
                    <span>Sovereign 16:9</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNftMediaPreset('SOVEREIGN_GOLD')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center justify-center gap-1 cursor-pointer border whitespace-nowrap ${
                      nftMediaPreset === 'SOVEREIGN_GOLD'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Sovereign Coin</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-zinc-400 text-center">
                  Contract: {shortenAddress(CONTRACTS.TS_NFT_CONTRACT)} · RWA $1.00 TS BNB
                </div>
              </div>

              {/* Form Fields & Stake Pool Connections */}
              <div className="lg:col-span-8 flex flex-col justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1.5">
                      TS MEM / NFT Name
                    </label>
                    <input
                      type="text"
                      value={newNftName}
                      onChange={(e) => setNewNftName(e.target.value)}
                      placeholder="e.g. TS MEM · ZEE BNB Gold NFT"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1.5">
                      Collection / Inscription
                    </label>
                    <input
                      type="text"
                      value={newNftCollection}
                      onChange={(e) => setNewNftCollection(e.target.value)}
                      placeholder="TS MEM NFT · Isiphahla Royal Dynasty"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1.5">
                      RWA Value (USD · TS BNB)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newNftRwaUsd}
                      onChange={(e) => setNewNftRwaUsd(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono font-bold tabular-nums focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Rarity Tier Selector */}
                <div className="text-xs">
                  <span className="block text-zinc-400 font-semibold mb-1.5">
                    NFT Tier & Stake Pool APY Boost
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { rarity: 'Legendary' as const, desc: '+6.5% Pool APY · $16/day' },
                        { rarity: 'Epic' as const, desc: '+4.5% Pool APY · $11.5/day' },
                        { rarity: 'Rare' as const, desc: '+3.0% Pool APY · $8/day' },
                      ]
                    ).map((tier) => (
                      <button
                        key={tier.rarity}
                        type="button"
                        onClick={() => setNewNftRarity(tier.rarity)}
                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          newNftRarity === tier.rarity
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold">{tier.rarity}</div>
                        <div className="text-[11px] font-mono text-amber-400 mt-0.5">{tier.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connect Stake Pools Multi-Select */}
                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-semibold">
                      Connect to Stake Pools ({selectedPoolIdsForNewNft.length}/{stakePools.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPoolIdsForNewNft(
                          selectedPoolIdsForNewNft.length === stakePools.length
                            ? []
                            : stakePools.map((p) => p.id)
                        )
                      }
                      className="text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedPoolIdsForNewNft.length === stakePools.length
                        ? 'Clear Selection'
                        : 'Select All Stake Pools'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {stakePools.map((pool) => {
                      const checked = selectedPoolIdsForNewNft.includes(pool.id);
                      return (
                        <button
                          key={pool.id}
                          type="button"
                          onClick={() => handleToggleNewNftPool(pool.id)}
                          className={`px-3 py-2 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            checked
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span className="truncate font-medium">{pool.name}</span>
                          <span className="font-mono text-[11px] shrink-0">
                            {checked ? 'Connected' : '+Link'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Auto-stakes into Mining Profits & boosts selected RWA Stake Pools immediately
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Create & Mint TS NFT</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* NFT Cards Grid */}
          {filteredNfts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredNfts.map((nft) => {
                const dailyBnb = nft.dailyFeedUsd / WITHDRAWAL_RULES.BNB_PRICE_USD;
                const connectedPoolIds = nft.connectedPoolIds || [];
                const linkedNftIds = nft.linkedNftIds || [];
                const rwaValUsd = nft.rwaValueUsd ?? 1.00;
                const isPoolsExpanded = expandedNftPoolsId === nft.id;

                return (
                  <div
                    key={nft.id}
                    className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-colors ${
                      nft.isStakedFeeding
                        ? 'bg-zinc-900 border-amber-500/60'
                        : 'bg-zinc-900/80 border-zinc-800'
                    }`}
                  >
                    <div>
                      {/* NFT Media Frame (Compact 16:9 Small Screen for Video NFT or Image Medallion — No Fullscreen) */}
                      {nft.videoUrl ? (
                        <div className="p-4 pb-3 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
                          <div className="aspect-video w-full max-w-[196px] mx-auto rounded-lg bg-black border border-amber-500/45 overflow-hidden">
                            <video
                              src={nft.videoUrl}
                              poster={nft.image}
                              autoPlay={isVideoNftPlaying}
                              loop
                              muted
                              playsInline
                              disablePictureInPicture
                              controlsList="nodownload nofullscreen noremoteplayback"
                              className="w-full h-full object-contain bg-black"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-300">
                            <span className="font-bold text-amber-300">{nft.tokenId} · 16:9</span>
                            <span className="text-emerald-400 font-semibold">
                              RWA ${rwaValUsd.toFixed(2)} TS BNB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden border-b border-zinc-800">
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 p-4 text-center">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium">{nft.name}</span>
                          </div>
                          <img
                            src={nft.image}
                            alt={`${nft.name} ${nft.tokenId}`}
                            referrerPolicy="no-referrer"
                            className="relative z-10 w-full h-full object-cover object-center"
                          />
                          <div className="absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-3.5 right-3.5 z-20 flex items-center justify-between text-xs font-mono text-white">
                            <span className="font-bold">{nft.tokenId}</span>
                            <span className="text-emerald-300 font-semibold">
                              RWA ${rwaValUsd.toFixed(2)} TS BNB
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-2.5">
                        <div className="text-xs font-mono text-zinc-400 flex items-center justify-between gap-2">
                          <span className="truncate">
                            {nft.collection} · {nft.rarity}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white leading-snug">{nft.name}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {nft.description}
                        </p>

                        <div className="pt-2.5 border-t border-zinc-800 grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                          <div>
                            <span className="text-zinc-500 block">RWA Value (TS BNB)</span>
                            <span className="text-emerald-400 font-bold">
                              {formatUSD(rwaValUsd)} TS BNB
                            </span>
                            <span className="text-zinc-500 text-[11px] block">
                              Feed: +{formatUSD(nft.dailyFeedUsd)}/d ({dailyBnb.toFixed(4)} BNB)
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">NFT & RWA Links</span>
                            <span className="text-amber-400 font-bold">
                              +{(nft.stakePoolApyBoostPct ?? 4.0).toFixed(1)}% APY
                            </span>
                            <span className="text-zinc-400 text-[11px] block">
                              {linkedNftIds.length} NFTs · {connectedPoolIds.length} RWA pools
                            </span>
                          </div>
                        </div>

                        {/* Cross-NFT & RWA Stake Pool Connector Drawer inside Card */}
                        {nft.owned && isPoolsExpanded && (
                          <div className="pt-2.5 border-t border-zinc-800 space-y-3 text-[11px]">
                            {/* Link RWA Stake Pools */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-zinc-400 font-semibold">
                                <span>Link RWA Stake Pools:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = connectNftToAllStakePools(nft.id);
                                    showFeedback(res.success ? 'success' : 'error', res.message);
                                  }}
                                  className="text-amber-400 hover:underline cursor-pointer"
                                >
                                  Connect All
                                </button>
                              </div>
                              <div className="space-y-1 max-h-28 overflow-y-auto">
                                {stakePools.map((sp) => {
                                  const linked = connectedPoolIds.includes(sp.id);
                                  return (
                                    <button
                                      key={sp.id}
                                      type="button"
                                      onClick={() => {
                                        const res = toggleNftStakePoolConnection(nft.id, sp.id);
                                        showFeedback(res.success ? 'success' : 'error', res.message);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                                        linked
                                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      <span className="truncate">{sp.name}</span>
                                      <span className="font-mono shrink-0 ml-2">{linked ? 'Linked' : 'Connect'}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Link Cross-NFTs ($1 TS BNB Parity Mesh) */}
                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                              <div className="flex items-center justify-between text-zinc-400 font-semibold">
                                <span>Link Other NFTs ($1 TS BNB):</span>
                                <span className="text-emerald-400 font-mono">{linkedNftIds.length} linked</span>
                              </div>
                              <div className="space-y-1 max-h-28 overflow-y-auto">
                                {miningNfts
                                  .filter((other) => other.id !== nft.id)
                                  .map((other) => {
                                    const isLinkedToOther = linkedNftIds.includes(other.id);
                                    return (
                                      <button
                                        key={`${nft.id}-${other.id}`}
                                        type="button"
                                        onClick={() => {
                                          const res = toggleNftToNftLink(nft.id, other.id);
                                          showFeedback(res.success ? 'success' : 'error', res.message);
                                        }}
                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                                          isLinkedToOther
                                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        <span className="truncate">
                                          {other.tokenId} · {other.name}
                                        </span>
                                        <span className="font-mono shrink-0 ml-2">
                                          {isLinkedToOther ? 'Linked' : '+Link'}
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 space-y-2">
                      {!nft.owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            const res = mintOrClaimNft(nft.id);
                            showFeedback(res.success ? 'success' : 'error', res.message);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Mint & Feed ({nft.mintCostBnb} BNB)</span>
                        </button>
                      ) : (
                        <>
                          {nft.videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = collectVideoAndNftPoolMoney();
                                showFeedback(res.success ? 'success' : 'error', res.message);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>
                                Collect Play + Pool ({formatUSD(collectableVideoAndPoolUsd)})
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNftPoolsId(isPoolsExpanded ? null : nft.id)
                            }
                            className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>
                              {isPoolsExpanded
                                ? 'Done Linking NFTs & RWA'
                                : `Link NFTs (${linkedNftIds.length}) & RWA (${connectedPoolIds.length})`}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const res = toggleNftFeedMining(nft.id);
                              showFeedback(res.success ? 'success' : 'error', res.message);
                            }}
                            className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                              nft.isStakedFeeding
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                            }`}
                          >
                            {nft.isStakedFeeding ? (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Staked & Feeding · Unstake</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-4 h-4 text-amber-400" />
                                <span>Stake NFT to Feed Profits</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Google Ads Integration & Appearing Business Pop-Up Ads Section */}
      {(filterTab === 'ALL' || filterTab === 'ADS') && (
        <section className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>Appearing Business Google Ads (Truworths · Jet · Game · Pop-Ups)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Only appearing retail business pop-up Google Ads (Truworths, Jet, Game, Woolworths, Takealot, Pick n Pay, Makro) streaming yield into Stake Pools, TS NFTs & Mining Profits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={togglePopupAdEnabled}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  popupAdEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Auto Pop-Up Ads: {popupAdEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => openPopupBusinessAd()}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Show Pop-Up Business Ad
              </button>

              <button
                type="button"
                onClick={() => {
                  const res = connectAllAds();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Connect All Ads (+{formatUSD(adSlots.reduce((s, a) => s + a.dailyRevenueUsd, 0))}/day)
              </button>
            </div>
          </div>

          {/* Business Category Filter Strip */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto w-fit max-w-full">
            {(
              [
                { id: 'ALL', label: `All Business Ads (${adSlots.length})` },
                { id: 'FASHION_RETAIL', label: 'Fashion (Truworths, Jet, PEP, Ackermans, MRP, Woolworths)' },
                { id: 'SUPERSTORE_TECH', label: 'Superstores & DIY (Game, Takealot, Makro, Builders)' },
                { id: 'GROCERY_FOOD', label: 'Grocery & Health (Pick n Pay, Checkers, Shoprite, Clicks)' },
                { id: 'FINANCE_TELECOM', label: 'Gov & Telecom (Vodacom Business, MTN)' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setBusinessCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  businessCategoryFilter === cat.id
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Google Ads Verified Advertiser & gtag.js Conversion Console */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Google Ads Advertiser Verified</span>
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-300">{googleAdsConfig.jurisdiction}</span>
                  <span className="text-zinc-600">·</span>
                  <span className={googleAdsConfig.campaignStatus === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {googleAdsConfig.campaignStatus === 'ACTIVE' ? 'gtag.js Active' : 'Paused'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {googleAdsConfig.advertiserName}
                </h3>
                <p className="text-xs text-zinc-400">
                  {googleAdsConfig.entityType} — {googleAdsConfig.verifiedChecks.join(' · ')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const res = toggleGoogleAdsStatus();
                    showFeedback(res.success ? 'success' : 'error', res.message);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    googleAdsConfig.campaignStatus === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500 text-zinc-950 font-black'
                  }`}
                >
                  {googleAdsConfig.campaignStatus === 'ACTIVE' ? 'Google Ads: Active' : 'Activate Google Ads'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const res = triggerGoogleAdsConversion('Stake Pools & TS NFT Attribution', 16.0);
                    showFeedback(res.success ? 'success' : 'error', res.message);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Fire gtag Conversion
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveGoogleTag} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Google Ads Tag ID (gtag.js)
                </label>
                <input
                  type="text"
                  value={tagIdInput}
                  onChange={(e) => setTagIdInput(e.target.value)}
                  placeholder="AW-1684920315"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Conversion Event Label
                </label>
                <input
                  type="text"
                  value={convLabelInput}
                  onChange={(e) => setConvLabelInput(e.target.value)}
                  placeholder="ts_protocol_yield"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Daily Ad Budget (USD)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                Save Google Ads Tag
              </button>
            </form>

            {googleAdsConversions.length > 0 && (
              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-zinc-400">
                <span>
                  Latest gtag Conversion: <span className="text-white font-semibold">{googleAdsConversions[0].sendTo}</span> · {googleAdsConversions[0].source}
                </span>
                <span className="text-emerald-400 font-bold">
                  +${googleAdsConversions[0].valueUsd.toFixed(2)} {googleAdsConversions[0].currency} · {googleAdsConversions.length} events tracked
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAds.map((ad) => (
              <div
                key={ad.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                  ad.connected
                    ? 'bg-zinc-900 border-emerald-500/40'
                    : 'bg-zinc-900/80 border-zinc-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="text-xs font-mono text-zinc-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      Google Business Pop-Up · {ad.brandDomain || 'business.google.com'}
                    </span>
                    <span className={ad.connected ? 'text-emerald-400 font-bold shrink-0' : 'text-zinc-500 shrink-0'}>
                      {ad.connected ? 'Appearing · Connected' : 'Ready to Appear'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{ad.title}</h3>
                    {ad.headlineOffer && (
                      <div className="text-xs font-semibold text-amber-300 mt-0.5">
                        {ad.headlineOffer}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{ad.description}</p>

                  <div className="pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-zinc-500 block">Daily Ad Yield</span>
                      <span className="text-emerald-400 font-bold">+{formatUSD(ad.dailyRevenueUsd)}/day</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">24h Pop-Ups</span>
                      <span className="text-white font-bold">{ad.impressions24h.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Routed Target</span>
                      <span className="text-amber-400 font-bold">{ad.connectedTarget.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-500 tabular-nums truncate">
                    {ad.advertiser} · Earned {formatUSD(ad.totalEarnedUsd)}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openPopupBusinessAd(ad.id)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Pop Up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = toggleAdConnection(ad.id);
                        showFeedback(res.success ? 'success' : 'error', res.message);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        ad.connected
                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black'
                      }`}
                    >
                      {ad.connected ? 'Connected · Pause Ad' : 'Connect Ad'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Appearing Business Google Ad */}
          <form
            onSubmit={handleAddCustomAd}
            className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-center"
          >
            <input
              type="text"
              value={newAdAdvertiser}
              onChange={(e) => setNewAdAdvertiser(e.target.value)}
              placeholder="Business Name (e.g. Pep Stores, Ackermans, Builders)"
              className="md:col-span-4 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              required
            />
            <input
              type="text"
              value={newAdBrandDomain}
              onChange={(e) => setNewAdBrandDomain(e.target.value)}
              placeholder="Business Domain (e.g. pepstores.com)"
              className="md:col-span-4 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={newAdTitle}
              onChange={(e) => setNewAdTitle(e.target.value)}
              placeholder="Pop-Up Ad Headline / Offer"
              className="md:col-span-4 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              required
            />
            <select
              value={newAdBusinessCategory}
              onChange={(e) =>
                setNewAdBusinessCategory(
                  e.target.value as NonNullable<AdCampaignSlot['businessCategory']>
                )
              }
              className="md:col-span-3 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="FASHION_RETAIL">Fashion & Retail</option>
              <option value="SUPERSTORE_TECH">Superstore & Tech</option>
              <option value="GROCERY_FOOD">Grocery & Retail</option>
              <option value="FINANCE_TELECOM">Finance & Telecom</option>
            </select>
            <select
              value={newAdNetwork}
              onChange={(e) => setNewAdNetwork(e.target.value as AdCampaignSlot['network'])}
              className="md:col-span-3 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="GOOGLE_ADS">Google Business Ads</option>
              <option value="WEB3_PARTNER">Retail Partner</option>
            </select>
            <select
              value={newAdTarget}
              onChange={(e) => setNewAdTarget(e.target.value as AdCampaignSlot['connectedTarget'])}
              className="md:col-span-3 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="STAKE_POOLS">Route to Stake Pools</option>
              <option value="TS_NFT">Route to TS NFT</option>
              <option value="MINING_PROFITS">Route to Mining Profits</option>
            </select>
            <button
              type="submit"
              className="md:col-span-3 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black whitespace-nowrap cursor-pointer"
            >
              + Add Business Pop-Up Ad
            </button>
          </form>
        </section>
      )}

      {/* Empty Search Result State */}
      {filteredTokens.length === 0 && filteredNfts.length === 0 && filteredAds.length === 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-10 text-center space-y-3">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Matching Airdrops, Meme Tokens, NFTs, or Ads</h3>
          <p className="text-xs text-zinc-400">
            Clear your search filter or switch categories to view available BEP-20 profit feeders and ad connectors.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterTab('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Mining Profit Feed Settlement Ledger */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">
              Mining Profit Feed Ledger
            </h2>
            <p className="text-xs text-zinc-400">
              Verified yield settlements routed from TS NFTs, Connected Ads, Cloud Airdrops, and Meme Tokens into Mining Profits.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {miningProfitFeedHistory.length} Feed Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="py-2.5 pr-4 font-semibold">Asset Source</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Block</th>
                <th className="py-2.5 px-4 font-semibold">Transaction Hash</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Fed to Mining Profits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
              {miningProfitFeedHistory.slice(0, 10).map((evt) => (
                <tr key={evt.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 pr-4 text-white font-sans font-semibold">
                    {evt.sourceName} <span className="text-zinc-400 font-mono text-[11px]">({evt.symbolOrId})</span>
                  </td>
                  <td className="py-2.5 px-4 text-zinc-400 font-sans">
                    {evt.sourceType === 'NFT_RELIC'
                      ? 'TS NFT Relic'
                      : evt.sourceType === 'MEME_TOKEN'
                      ? 'Meme Token'
                      : evt.sourceType === 'MINING_FEED'
                      ? '24h Mining Feed'
                      : evt.sourceType === 'AD_REVENUE'
                      ? 'Connected Ad'
                      : 'Cloud Airdrop'}
                  </td>
                  <td className="py-2.5 px-4 text-zinc-400">#{evt.blockNumber}</td>
                  <td className="py-2.5 px-4 text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <span>{shortenAddress(evt.txHash)}</span>
                      <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-right font-bold text-emerald-400">
                    +{evt.amountBnb.toFixed(6)} BNB ({formatUSD(evt.amountUsd)})
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
