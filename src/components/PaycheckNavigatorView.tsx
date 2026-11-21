import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Coins,
  Copy,
  Download,
  ExternalLink,
  Search,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import {
  CONTRACTS,
  MINING_FEED_RULES,
  MINING_PACKAGE_RULES,
  WITHDRAWAL_RULES,
  formatUSD,
  shortenAddress,
} from '../data/constants';

interface PaycheckNavigatorViewProps {
  initialAddress?: string;
  onWithdrawToAddress?: (address: string) => void;
  onOpenRecharge?: () => void;
}

type PaycheckFilter = 'ALL' | 'WITHDRAWAL' | 'RECHARGE' | 'IRD_FEED' | 'ASSET_FEED';

interface LedgerEntry {
  id: string;
  timestamp: number;
  category: Exclude<PaycheckFilter, 'ALL'>;
  categoryLabel: string;
  address: string;
  txHash: string;
  blockNumber: number;
  amountBnb: number;
  amountUsd: number;
  status: string;
  description: string;
}

export const PaycheckNavigatorView: React.FC<PaycheckNavigatorViewProps> = ({
  initialAddress = CONTRACTS.RECHARGE_ROUTER_DEFI,
  onWithdrawToAddress,
  onOpenRecharge,
}) => {
  const {
    wallet,
    rechargeBalance,
    rechargeBalanceUsd,
    accumulatedMiningYieldBnb,
    claimMiningYield,
    unclaimedCommissionBnb,
    claimReferralCommission,
    userPositions,
    claimPoolFees,
    connectedMachines,
    cloudAirdropTokens,
    miningNfts,
    adSlots,
    harvestAllFeedsToMiningProfits,
    alerts,
    irdFeedHistory,
    miningProfitFeedHistory,
    totalMinesFedToIrdBnb,
    irdWalletAddress,
    addMinedYieldBnb,
    miningFeedEnabled,
    miningFeedAccumulatedUsd,
    collectMiningFeedToProfits,
  } = useProtocol();

  const [inspectedAddress, setInspectedAddress] = useState<string>(initialAddress);
  const [addressInput, setAddressInput] = useState<string>(initialAddress);
  const [copied, setCopied] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<PaycheckFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const bnbPrice = WITHDRAWAL_RULES.BNB_PRICE_USD;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(inspectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectAddress = (addr: string) => {
    setInspectedAddress(addr);
    setAddressInput(addr);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = addressInput.trim();
    if (!cleaned || cleaned.length < 10) {
      showFeedback('error', 'Enter a valid BEP-20 address starting with 0x.');
      return;
    }
    setInspectedAddress(cleaned);
    showFeedback('success', `Paycheck ledger navigated to ${shortenAddress(cleaned)}.`);
  };

  // Income & Paycheck Stream Math
  const totalLpFeesUsd = userPositions.reduce((s, p) => s + p.accruedFeesUsd, 0);
  const totalLpFeesBnb = totalLpFeesUsd / bnbPrice;

  const miningYieldUsd = accumulatedMiningYieldBnb * bnbPrice;
  const commissionUsd = unclaimedCommissionBnb * bnbPrice;

  const totalPaycheckAvailableBnb =
    accumulatedMiningYieldBnb + unclaimedCommissionBnb + totalLpFeesBnb;
  const totalPaycheckAvailableUsd = totalPaycheckAvailableBnb * bnbPrice;

  const packageDailyUsd = rechargeBalanceUsd * MINING_PACKAGE_RULES.DAILY_RATE;
  const packageFiveDayUsd = packageDailyUsd * MINING_PACKAGE_RULES.TARGET_DAYS;

  const machinesDailyUsd = connectedMachines
    .filter((m) => m.status === 'ONLINE' || m.status === 'OVERCLOCKED')
    .reduce((sum, m) => {
      const mult = m.status === 'OVERCLOCKED' ? 1.2 : 1.0;
      return sum + m.priceUsd * (m.dailyYieldPct / 100) * mult;
    }, 0);

  const tokensDailyUsd = cloudAirdropTokens
    .filter((t) => t.isFeedingMining)
    .reduce((sum, t) => sum + t.dailyFeedUsd, 0);

  const nftsDailyUsd = miningNfts
    .filter((n) => n.owned && n.isStakedFeeding)
    .reduce((sum, n) => sum + n.dailyFeedUsd, 0);

  const activeAds = adSlots.filter((a) => a.connected);
  const adsDailyUsd = activeAds.reduce((sum, a) => sum + a.dailyRevenueUsd, 0);

  const baseMiningFeedDailyUsd = miningFeedEnabled ? MINING_FEED_RULES.DAILY_ACCUMULATION_USD : 0;

  const combinedDailyPaycheckUsd =
    packageDailyUsd + machinesDailyUsd + tokensDailyUsd + nftsDailyUsd + adsDailyUsd + baseMiningFeedDailyUsd;
  const combinedDailyPaycheckBnb = combinedDailyPaycheckUsd / bnbPrice;

  const totalWithdrawnBnb = alerts
    .filter((a) => a.type === 'WITHDRAWAL')
    .reduce((sum, a) => sum + a.amountBnb, 0);
  const totalAssetFedBnb =
    cloudAirdropTokens.reduce((s, t) => s + t.totalFedBnb, 0) +
    miningNfts.reduce((s, n) => s + n.totalFedBnb, 0);
  const totalSettledBnb = totalWithdrawnBnb + totalMinesFedToIrdBnb + totalAssetFedBnb;

  const minMinedUsd = WITHDRAWAL_RULES.MIN_MINED_REQUIRED_USD;
  const withdrawalReady = miningYieldUsd >= minMinedUsd - 0.05;
  const withdrawalProgressPct = Math.min(100, Math.max(0, (miningYieldUsd / minMinedUsd) * 100));

  // Build unified settlement ledger
  const unifiedLedger: LedgerEntry[] = useMemo(() => {
    const alertEntries: LedgerEntry[] = alerts.map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      category: a.type === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'RECHARGE',
      categoryLabel: a.type === 'WITHDRAWAL' ? 'Withdrawal Payout' : 'Recharge Deposit',
      address: a.walletAddress || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: a.txHash,
      blockNumber: a.blockNumber,
      amountBnb: a.amountBnb,
      amountUsd: a.amountUsd,
      status: a.status,
      description: a.note || `${a.type} settlement for ${shortenAddress(a.walletAddress || CONTRACTS.RECHARGE_ROUTER_DEFI)}`,
    }));

    const irdEntries: LedgerEntry[] = irdFeedHistory.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      category: 'IRD_FEED',
      categoryLabel: 'IRD Mining Feed',
      address: e.targetIrdWallet,
      txHash: e.txHash,
      blockNumber: e.blockNumber,
      amountBnb: e.amountBnb,
      amountUsd: e.amountUsd,
      status: 'FED_TO_IRD',
      description: `${e.machineName} · ${e.note}`,
    }));

    const assetEntries: LedgerEntry[] = miningProfitFeedHistory.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      category: 'ASSET_FEED',
      categoryLabel:
        e.sourceType === 'NFT_RELIC'
          ? 'TS NFT Feed'
          : e.sourceType === 'MEME_TOKEN'
          ? 'Meme Token Feed'
          : e.sourceType === 'MINING_FEED'
          ? '24h Mining Feed'
          : e.sourceType === 'AD_REVENUE'
          ? 'Connected Ad Feed'
          : 'Cloud Airdrop Feed',
      address: CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: e.txHash,
      blockNumber: e.blockNumber,
      amountBnb: e.amountBnb,
      amountUsd: e.amountUsd,
      status: 'CREDITED',
      description: `${e.sourceName} (${e.symbolOrId}) fed mining paycheck`,
    }));

    return [...alertEntries, ...irdEntries, ...assetEntries].sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }, [alerts, irdFeedHistory, miningProfitFeedHistory]);

  const filteredLedger = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return unifiedLedger.filter((entry) => {
      if (filterCategory !== 'ALL' && entry.category !== filterCategory) return false;
      if (!q) return true;
      return (
        entry.txHash.toLowerCase().includes(q) ||
        entry.address.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [unifiedLedger, filterCategory, searchTerm]);

  // 5-Day Paycheck Schedule based on active recharge package (defaults to $10 -> $16 in 5 days)
  const scheduleBaseUsd = rechargeBalanceUsd > 0 ? rechargeBalanceUsd : MINING_PACKAGE_RULES.PACKAGE_1_USD;
  const dailyScheduleUsd = scheduleBaseUsd * MINING_PACKAGE_RULES.DAILY_RATE;
  const fiveDayRows = [1, 2, 3, 4, 5].map((day) => {
    const cumulativeUsd = dailyScheduleUsd * day;
    const cumulativeBnb = cumulativeUsd / bnbPrice;
    const netWithdrawUsd = Math.max(0, cumulativeUsd - WITHDRAWAL_RULES.WITHDRAWAL_CHARGE_USD);
    const eligible = cumulativeUsd >= WITHDRAWAL_RULES.MIN_MINED_REQUIRED_USD - 0.01;
    return {
      day,
      dailyUsd: dailyScheduleUsd,
      cumulativeUsd,
      cumulativeBnb,
      netWithdrawUsd,
      eligible,
    };
  });

  const handleClaimAllPoolFees = () => {
    const claimable = userPositions.filter((p) => p.accruedFeesUsd > 0.01);
    if (claimable.length === 0) {
      showFeedback('error', 'No accrued LP fee paycheck ready to claim yet.');
      return;
    }
    const res = claimPoolFees(claimable[0].poolId);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleExportPaycheckCsv = () => {
    const header = 'Category,Address,TxHash,Block,AmountBNB,AmountUSD,Status,Description\n';
    const rows = filteredLedger
      .map(
        (r) =>
          `"${r.categoryLabel}","${r.address}","${r.txHash}",${r.blockNumber},${r.amountBnb.toFixed(6)},${r.amountUsd.toFixed(2)},"${r.status}","${r.description.replace(/"/g, '""')}"`
      )
      .join('\n');
    const encoded = encodeURI('data:text/csv;charset=utf-8,' + header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute(
      'download',
      `TS_Paycheck_${shortenAddress(inspectedAddress)}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', `Exported paycheck statement for ${shortenAddress(inspectedAddress)}.`);
  };

  const isOfficialRouter =
    inspectedAddress.toLowerCase() === CONTRACTS.RECHARGE_ROUTER_DEFI.toLowerCase();

  return (
    <div className="space-y-8">
      {/* Address Navigator & Paycheck Header */}
      <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-amber-400">
              BEP-20 Address Paycheck Navigator · BNB Smart Chain
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Paycheck & Payout Explorer
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="text-zinc-200 font-bold break-all select-all">
                {inspectedAddress}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-sans font-semibold">
                {isOfficialRouter ? 'Official Protocol Paycheck Router' : 'Custom BEP-20 Target'}
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="font-sans">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`https://bscscan.com/address/${inspectedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors font-sans"
              >
                <span>BscScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onWithdrawToAddress && (
              <button
                type="button"
                onClick={() => onWithdrawToAddress(inspectedAddress)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>Withdraw Paycheck to Address</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportPaycheckCsv}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Address Switcher Bar */}
        <form
          onSubmit={handleAddressSubmit}
          className="flex flex-col md:flex-row md:items-center gap-3 pt-4 border-t border-zinc-800"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Navigate paycheck for BEP-20 address (0x...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Load Address Paycheck
            </button>

            <button
              type="button"
              onClick={() => handleSelectAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}
              className={`px-3 py-2.5 rounded-xl text-xs font-mono border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isOfficialRouter
                  ? 'bg-zinc-800 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Router ({shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)})
            </button>

            {wallet.address && (
              <button
                type="button"
                onClick={() => handleSelectAddress(wallet.address!)}
                className={`px-3 py-2.5 rounded-xl text-xs font-mono border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  inspectedAddress.toLowerCase() === wallet.address.toLowerCase()
                    ? 'bg-zinc-800 text-amber-400 border-amber-500/40'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Wallet ({shortenAddress(wallet.address)})
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectAddress(irdWalletAddress)}
              className={`px-3 py-2.5 rounded-xl text-xs font-mono border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                inspectedAddress.toLowerCase() === irdWalletAddress.toLowerCase()
                  ? 'bg-zinc-800 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              IRD ({shortenAddress(irdWalletAddress)})
            </button>
          </div>
        </form>

        {/* Clean 4-Metric Hairline KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-zinc-800">
          <div>
            <div className="text-xs text-zinc-400">Available Paycheck Balance</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
              {totalPaycheckAvailableBnb.toFixed(6)} BNB
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {formatUSD(totalPaycheckAvailableUsd)} claimable now
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Daily Paycheck Run Rate</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums mt-1">
              +{formatUSD(combinedDailyPaycheckUsd)}/day
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              +{combinedDailyPaycheckBnb.toFixed(4)} BNB / 24h
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">5-Day Package Paycheck</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums mt-1">
              {formatUSD(packageFiveDayUsd || 16.0)}
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {formatUSD(rechargeBalanceUsd || 10.0)} principal · 32%/day
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Total Settled & Fed</div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono tabular-nums mt-1">
              {totalSettledBnb.toFixed(4)} BNB
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {formatUSD(totalSettledBnb * bnbPrice)} lifetime routed
            </div>
          </div>
        </div>

        {/* Withdrawal Readiness Progress */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-zinc-300 font-medium">
              Miner Paycheck Withdrawal Eligibility (Starts from $15.00 · Requires $16.00 Mined with $1.00 Charge)
            </span>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className={withdrawalReady ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {formatUSD(miningYieldUsd)} / $16.00 ({withdrawalProgressPct.toFixed(1)}%)
              </span>
              {!withdrawalReady && (
                <button
                  type="button"
                  onClick={() => {
                    const neededBnb = 16.5 / bnbPrice - accumulatedMiningYieldBnb;
                    addMinedYieldBnb(Math.max(0.001, neededBnb));
                    showFeedback('success', 'Paycheck miner count boosted above $16.00 withdrawal threshold.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-sans font-bold text-[11px] whitespace-nowrap cursor-pointer"
                >
                  Simulate 5-Day $16 Mined
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-500 ${
                withdrawalReady
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${withdrawalProgressPct}%` }}
            />
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

      {/* Two-Column Breakdown: Paycheck Income Streams & 5-Day Payout Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Streams Table */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>Address Paycheck Streams</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Claim or route each paycheck stream associated with {shortenAddress(inspectedAddress)}.
              </p>
            </div>
            {onOpenRecharge && (
              <button
                type="button"
                onClick={onOpenRecharge}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                + Top Up Package
              </button>
            )}
          </div>

          <div className="divide-y divide-zinc-800 text-xs">
            {/* Stream 1: Mining Package Yield */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">Mining Package Yield (32%/day)</div>
                <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                  {accumulatedMiningYieldBnb.toFixed(6)} BNB ({formatUSD(miningYieldUsd)})
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = claimMiningYield();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Claim Yield
              </button>
            </div>

            {/* Stream 2: 24-Hour Mining Feed ($1.00 / 24h) */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">Mining Feed Accumulation ($1.00 / 24h)</div>
                <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                  {formatUSD(miningFeedAccumulatedUsd)} / $1.00 cycle · +$1.00 every 24 hours
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = collectMiningFeedToProfits();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Collect Feed
              </button>
            </div>

            {/* Stream 3: Cloud Airdrops, Memes, TS NFTs & Connected Ads */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">Airdrops, Meme Tokens, TS NFTs & Ads</div>
                <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                  +{formatUSD(tokensDailyUsd + nftsDailyUsd + adsDailyUsd)}/day ({activeAds.length} Ads) · Fed {totalAssetFedBnb.toFixed(4)} BNB
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = harvestAllFeedsToMiningProfits();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Harvest Feeds</span>
              </button>
            </div>

            {/* Stream 3: Affiliate Referral Commission */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">4-Tier Affiliate Commissions</div>
                <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                  {unclaimedCommissionBnb.toFixed(4)} BNB ({formatUSD(commissionUsd)})
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = claimReferralCommission();
                  showFeedback(res.success ? 'success' : 'error', res.message);
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Claim Commission
              </button>
            </div>

            {/* Stream 4: AMM Liquidity Provider Fees */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">AMM Liquidity Provider Fees</div>
                <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                  {totalLpFeesBnb.toFixed(4)} BNB ({formatUSD(totalLpFeesUsd)}) across {userPositions.length} pools
                </div>
              </div>
              <button
                type="button"
                onClick={handleClaimAllPoolFees}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Claim LP Fees
              </button>
            </div>

            {/* Stream 5: Connected Hardware Rigs */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white">TS Mining Machines Fleet ({connectedMachines.length} Rigs)</div>
                <div className="text-zinc-400 font-mono tabular-nums mt-0.5">
                  +{formatUSD(machinesDailyUsd)}/day · Unified TS BOT & IRD: {totalMinesFedToIrdBnb.toFixed(4)} BNB
                </div>
              </div>
              {onWithdrawToAddress && (
                <button
                  type="button"
                  onClick={() => onWithdrawToAddress(inspectedAddress)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Payout BNB
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 5-Day Mining Package Paycheck Schedule */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>5-Day Mining Paycheck Schedule</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Principal {formatUSD(scheduleBaseUsd)} generates {formatUSD(dailyScheduleUsd)}/day → {formatUSD(scheduleBaseUsd * 1.6)} in 5 days.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">32% Daily</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="py-2 pr-3 font-semibold">Day</th>
                  <th className="py-2 px-3 font-semibold">Daily Mined</th>
                  <th className="py-2 px-3 font-semibold">Cumulative Paycheck</th>
                  <th className="py-2 pl-3 font-semibold text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
                {fiveDayRows.map((row) => (
                  <tr key={row.day} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-3 text-white font-sans font-bold">
                      Day {row.day}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      +{formatUSD(row.dailyUsd)}
                    </td>
                    <td className="py-2.5 px-3 text-white font-semibold">
                      {formatUSD(row.cumulativeUsd)} ({row.cumulativeBnb.toFixed(4)} BNB)
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      {row.eligible ? (
                        <span className="text-emerald-400 font-bold font-sans">
                          {formatUSD(row.netWithdrawUsd)} Eligible
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-sans">Accruing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Unified Address Paycheck Settlement Ledger */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Paycheck Settlement & Payout History</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Complete on-chain payout, recharge, IRD robot feed, and asset feed ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'WITHDRAWAL', label: 'Withdrawals' },
                  { id: 'RECHARGE', label: 'Recharges' },
                  { id: 'IRD_FEED', label: 'IRD Feeds' },
                  { id: 'ASSET_FEED', label: 'Airdrops & NFTs' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filterCategory === tab.id
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search hash or address..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Coins className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-sm font-bold text-white">No Matching Paycheck Entries</div>
            <p className="text-xs text-zinc-400">
              Adjust your category filter or search term to inspect paycheck settlements.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterCategory('ALL');
                setSearchTerm('');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="py-2.5 pr-4 font-semibold">Stream</th>
                  <th className="py-2.5 px-4 font-semibold">Address</th>
                  <th className="py-2.5 px-4 font-semibold">Tx Hash</th>
                  <th className="py-2.5 px-4 font-semibold">Block</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 pl-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
                {filteredLedger.slice(0, 15).map((item) => {
                  const matchesInspected =
                    item.address.toLowerCase() === inspectedAddress.toLowerCase();
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 pr-4 font-sans">
                        <div className="font-semibold text-white">{item.categoryLabel}</div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs">
                          {item.description}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={matchesInspected ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                          {shortenAddress(item.address)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400">
                        {shortenAddress(item.txHash)}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400">#{item.blockNumber}</td>
                      <td className="py-2.5 px-4 font-sans">
                        <span className="text-emerald-400 font-semibold">{item.status}</span>
                      </td>
                      <td className="py-2.5 pl-4 text-right font-bold text-emerald-400">
                        +{item.amountBnb.toFixed(6)} BNB ({formatUSD(item.amountUsd)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
