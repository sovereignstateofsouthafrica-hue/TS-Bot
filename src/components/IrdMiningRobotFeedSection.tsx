import React, { useState } from 'react';
import {
  Bot,
  Zap,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Wallet,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Mail,
  Link as LinkIcon,
  Check,
  TrendingUp,
  Send,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import {
  CONTRACTS,
  MINING_FEED_RULES,
  WITHDRAWAL_RULES,
  formatUSD,
  shortenAddress,
} from '../data/constants';
import { GoogleSignInButton } from './GoogleSignInButton';

interface IrdMiningRobotFeedSectionProps {
  onOpenWithdrawal?: () => void;
}

export const IrdMiningRobotFeedSection: React.FC<IrdMiningRobotFeedSectionProps> = ({
  onOpenWithdrawal,
}) => {
  const {
    wallet,
    connectedMachines,
    accumulatedMiningYieldBnb,
    achievedMiningTotalBnb,
    totalWithdrawnFromMinerBnb,
    irdWalletAddress,
    setIrdWalletAddress,
    irdFeedHistory,
    isMiningRobotFeedingIrd,
    toggleMiningRobotAutoFeed,
    feedMinesToIrd,
    linkMachineToIrd,
    miningFeedEnabled,
    miningFeedAccumulatedUsd,
    miningFeedTotalSettledUsd,
    toggleMiningFeed,
    collectMiningFeedToProfits,
    advance24hMiningFeed,
    claimMiningYield,
    addMinedYieldBnb,
    processWithdrawalBnb,
    refreshTokenBalances,
    gmailAuthorized,
    gmailNeedsAuth,
    gmailAccountEmail,
    isGmailSigningIn,
    connectGmailAuthorization,
    dispatchWithdrawalEmailForAlert,
  } = useProtocol();

  const bnbPrice = WITHDRAWAL_RULES.BNB_PRICE_USD;
  const minWithdrawalUsd = WITHDRAWAL_RULES.MIN_WITHDRAWAL_USD; // $15.00
  const minWithdrawalBnb = minWithdrawalUsd / bnbPrice;
  const minMinedRequiredUsd = WITHDRAWAL_RULES.MIN_MINED_REQUIRED_USD; // $16.00
  const withdrawalChargeUsd = WITHDRAWAL_RULES.WITHDRAWAL_CHARGE_USD; // $1.00
  const withdrawalChargeBnb = withdrawalChargeUsd / bnbPrice;

  const unifiedMinedUsd = accumulatedMiningYieldBnb * bnbPrice;
  const achievedMinedUsd = achievedMiningTotalBnb * bnbPrice;
  const withdrawProgressPct = Math.min(100, Math.max(0, (unifiedMinedUsd / minMinedRequiredUsd) * 100));
  const isWithdrawEligible = unifiedMinedUsd >= minMinedRequiredUsd - 0.05;

  const [customIrdInput, setCustomIrdInput] = useState(irdWalletAddress);
  const [showAddressEdit, setShowAddressEdit] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Inline Same-View Profit Withdrawal State
  const [withdrawBnbInput, setWithdrawBnbInput] = useState<string>(minWithdrawalBnb.toFixed(4));
  const [recipientInput, setRecipientInput] = useState<string>(
    wallet.address && wallet.address.startsWith('0x') && wallet.address.length > 12
      ? wallet.address
      : irdWalletAddress || CONTRACTS.RECHARGE_ROUTER_DEFI
  );
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [pendingInlineConfirm, setPendingInlineConfirm] = useState(false);
  const [withdrawReceipt, setWithdrawReceipt] = useState<any | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleSaveIrdAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIrdInput || !customIrdInput.startsWith('0x')) return;
    setIrdWalletAddress(customIrdInput);
    setRecipientInput(customIrdInput);
    setShowAddressEdit(false);
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 3000);
  };

  const handleSyncUnified = (machineId?: string) => {
    setIsSyncing(true);
    setActionMsg(null);
    setTimeout(() => {
      const res = feedMinesToIrd(machineId);
      setIsSyncing(false);
      setActionMsg(res.message);
      setTimeout(() => setActionMsg(null), 6000);
    }, 450);
  };

  const handleSyncToWallet = () => {
    const res = claimMiningYield();
    setActionMsg(res.message);
    setTimeout(() => setActionMsg(null), 6000);
  };

  const handleBoostTo16 = () => {
    const targetBnb = 16.5 / bnbPrice;
    const toAdd = Math.max(0.001, targetBnb - accumulatedMiningYieldBnb);
    addMinedYieldBnb(toAdd);
    setWithdrawError(null);
    setActionMsg(
      `Boosted unified TS BOT & IRD Mining Balance by +${toAdd.toFixed(6)} BNB (+$${(toAdd * bnbPrice).toFixed(2)}) above the $16.00 withdrawal threshold.`
    );
    setTimeout(() => setActionMsg(null), 5000);
  };

  const handleSetWithdrawPreset = (usd: number) => {
    setWithdrawBnbInput((usd / bnbPrice).toFixed(4));
    setWithdrawError(null);
  };

  const handleSetMaxWithdraw = () => {
    const maxNet = Math.max(0, accumulatedMiningYieldBnb - withdrawalChargeBnb);
    setWithdrawBnbInput(maxNet.toFixed(4));
    setWithdrawError(null);
  };

  const handleInlineValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawReceipt(null);

    const amount = parseFloat(withdrawBnbInput);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid BNB withdrawal amount.');
      return;
    }

    const requestedUsd = amount * bnbPrice;
    if (requestedUsd < minWithdrawalUsd - 0.05) {
      setWithdrawError(
        `Withdrawal starts from $${minWithdrawalUsd.toFixed(2)} USD (${minWithdrawalBnb.toFixed(4)} BNB).`
      );
      return;
    }

    const neededMinedUsd = Math.max(minMinedRequiredUsd, requestedUsd + withdrawalChargeUsd);
    if (unifiedMinedUsd < neededMinedUsd - 0.05) {
      setWithdrawError(
        `Unified TS BOT & IRD Miner must have mined at least $${neededMinedUsd.toFixed(2)} USD to withdraw $${requestedUsd.toFixed(2)} USD ($1.00 charge included). Current balance: $${unifiedMinedUsd.toFixed(2)} USD.`
      );
      return;
    }

    if (!recipientInput || recipientInput.trim().length < 10) {
      setWithdrawError('Please enter a valid BEP-20 destination address starting with 0x.');
      return;
    }

    setPendingInlineConfirm(true);
  };

  const handleConfirmInlineWithdraw = async () => {
    const amount = parseFloat(withdrawBnbInput);
    if (isNaN(amount) || amount <= 0) return;

    const requestedUsd = amount * bnbPrice;
    setIsWithdrawing(true);

    const res = processWithdrawalBnb(
      amount,
      recipientInput.trim(),
      `Unified TS BOT & IRD Mining Profit Withdrawal: ${amount.toFixed(4)} BNB ($${requestedUsd.toFixed(2)}) dispatched in-app with $1.00 charge.`,
      'miner'
    );

    if (res.success && res.alert) {
      refreshTokenBalances('WITHDRAWAL');
      const emailRes = await dispatchWithdrawalEmailForAlert(res.alert);
      setWithdrawReceipt({
        ...res.alert,
        gmailDeliveryStatus: emailRes.delivered
          ? 'SENT'
          : emailRes.needsAuth
          ? 'NEEDS_AUTH'
          : 'FAILED',
        gmailMessageId: emailRes.messageId,
        gmailError: emailRes.error,
      });
    } else {
      setWithdrawError(res.message);
    }

    setPendingInlineConfirm(false);
    setIsWithdrawing(false);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-amber-950/20 to-zinc-950 border-2 border-amber-500/45 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 space-y-6">
      {/* Unified Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-amber-500/25">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 flex items-center gap-1.5">
              <Bot className="w-4 h-4 fill-zinc-950" />
              Unified TS BOT & IRD Engine
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Same App • Shared Non-Decreasing Balance
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Unified TS BOT & IRD Mining Hub
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            TS BOT and IRD Mining share <strong className="text-amber-300">one unified BNB mining balance</strong> inside the same app and view. Syncing or claiming profits never resets or decreases your Mining Dashboard progress, and withdrawal authorization emails send directly via Gmail to <strong className="text-white font-mono">{CONTRACTS.ALERT_EMAIL}</strong>.
          </p>
        </div>

        {/* Single Unified Balance & IRD Node Card */}
        <div className="bg-zinc-950/95 rounded-2xl border border-amber-500/35 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-[310px] font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Unified TS BOT & IRD Balance
            </span>
            <button
              type="button"
              onClick={() => setShowAddressEdit(!showAddressEdit)}
              className="text-[11px] text-amber-400 hover:underline cursor-pointer"
            >
              {showAddressEdit ? 'Cancel' : 'Set IRD Address'}
            </button>
          </div>

          <div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {accumulatedMiningYieldBnb.toFixed(6)} BNB
            </div>
            <div className="text-[11px] text-zinc-400 tabular-nums mt-0.5 flex items-center justify-between">
              <span>Available to Withdraw: {formatUSD(unifiedMinedUsd)}</span>
              <span className="text-emerald-400 font-bold">
                Achieved: {achievedMiningTotalBnb.toFixed(4)} BNB
              </span>
            </div>
          </div>

          {!showAddressEdit ? (
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-zinc-500">IRD Node:</span>
              <span className="text-zinc-200 font-semibold truncate">
                {shortenAddress(irdWalletAddress)}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSaveIrdAddress} className="space-y-2 pt-1">
              <input
                type="text"
                value={customIrdInput}
                onChange={(e) => setCustomIrdInput(e.target.value)}
                placeholder="0x... IRD Wallet Address"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-white text-xs font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Save IRD Address
              </button>
            </form>
          )}

          {addressSaved && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>IRD Address Updated in App!</span>
            </div>
          )}
        </div>
      </div>

      {/* Same-View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Unified Mining Engine, 24h Feed & Non-Decreasing Sync */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mining Robot & IRD Profit Sync</h3>
                <div className="text-[11px] text-emerald-400 font-mono">
                  SINGLE BALANCE • NEVER RESETS TO ZERO ON SYNC
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMiningRobotAutoFeed}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                isMiningRobotFeedingIrd
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              {isMiningRobotFeedingIrd ? 'Auto-Sync: ON' : 'Auto-Sync: OFF'}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs space-y-2 tabular-nums">
            <div className="flex justify-between">
              <span className="text-zinc-400">Unified Mining Balance (Withdrawable):</span>
              <span className="text-amber-400 font-bold">
                {accumulatedMiningYieldBnb.toFixed(6)} BNB ({formatUSD(unifiedMinedUsd)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Lifetime Total Achieved (Non-Decreasing):</span>
              <span className="text-emerald-400 font-bold">
                {achievedMiningTotalBnb.toFixed(6)} BNB ({formatUSD(achievedMinedUsd)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Withdrawn to Date:</span>
              <span className="text-zinc-200 font-semibold">
                {totalWithdrawnFromMinerBnb.toFixed(6)} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Connected Hardware Fleet:</span>
              <span className="text-white font-bold">{connectedMachines.length} Active Rigs</span>
            </div>
          </div>

          {/* 24h Mining Feed ($1.00 / 24h) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono tabular-nums">
              <span className="text-zinc-400">24h Mining Feed Cycle ($1.00 / 24h):</span>
              <span className="text-amber-400 font-bold">
                {formatUSD(miningFeedAccumulatedUsd)} / $1.00
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (miningFeedAccumulatedUsd / MINING_FEED_RULES.DAILY_ACCUMULATION_USD) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                Settled: {formatUSD(miningFeedTotalSettledUsd)}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMiningFeed}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    miningFeedEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {miningFeedEnabled ? 'Feed ON' : 'Feed OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = collectMiningFeedToProfits();
                    setActionMsg(res.message);
                    setTimeout(() => setActionMsg(null), 5000);
                  }}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer"
                >
                  Collect Feed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = advance24hMiningFeed();
                    setActionMsg(res.message);
                    setTimeout(() => setActionMsg(null), 5000);
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold cursor-pointer"
                >
                  +24h ($1)
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSyncUnified()}
              disabled={isSyncing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Unified Ledger...' : 'Sync TS BOT & IRD Balance'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToWallet}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sync profit to wallet BNB balance without decreasing your Mining Dashboard"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Sync Profit to Wallet</span>
            </button>
          </div>

          {actionMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono">
              {actionMsg}
            </div>
          )}
        </div>

        {/* Right: Direct Same-View Profit Withdrawal with Gmail Auth */}
        <div className="bg-zinc-950 border border-emerald-500/35 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                Withdraw Unified Profits (Same View)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Withdraw from your combined TS BOT & IRD balance right here ($15 min · $16 mined · $1 charge).
              </p>
            </div>
            {onOpenWithdrawal && (
              <button
                type="button"
                onClick={onOpenWithdrawal}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 font-semibold shrink-0 cursor-pointer"
              >
                Full Modal
              </button>
            )}
          </div>

          {/* Gmail Authorization Sync Status */}
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <div className="text-white font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Gmail Auth: {CONTRACTS.ALERT_EMAIL}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                {gmailAuthorized
                  ? `Synced (${gmailAccountEmail || CONTRACTS.ALERT_EMAIL})`
                  : 'Connect Google to receive real withdrawal emails'}
              </div>
            </div>
            {gmailNeedsAuth ? (
              <GoogleSignInButton
                onClick={() => connectGmailAuthorization()}
                disabled={isGmailSigningIn}
                label={isGmailSigningIn ? 'Connecting...' : 'Sign in with Google'}
              />
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-mono text-[10px] font-bold">
                GMAIL SYNCED
              </span>
            )}
          </div>

          {/* $16 Mined Progress Bar */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5 font-mono text-[11px] tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Progress to $16.00 Mined Unlock:</span>
              <span className={isWithdrawEligible ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {formatUSD(unifiedMinedUsd)} / $16.00 ({withdrawProgressPct.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${
                  isWithdrawEligible
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${withdrawProgressPct}%` }}
              />
            </div>
            {!isWithdrawEligible && (
              <div className="flex items-center justify-between pt-1 font-sans">
                <span className="text-[11px] text-zinc-400">Need $16.00 mined to test withdrawal?</span>
                <button
                  type="button"
                  onClick={handleBoostTo16}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-bold cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Boost to $16.00 Mined</span>
                </button>
              </div>
            )}
          </div>

          {withdrawReceipt ? (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/60 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Withdrawal Dispatched: {withdrawReceipt.amountBnb.toFixed(4)} BNB ({formatUSD(withdrawReceipt.amountUsd)})
                </span>
              </div>
              <div className="font-mono text-[11px] text-zinc-300 space-y-1">
                <div>Tx Hash: {shortenAddress(withdrawReceipt.txHash)}</div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {withdrawReceipt.gmailDeliveryStatus === 'SENT'
                      ? `Gmail Delivered to ${withdrawReceipt.recipientEmail} (ID: ${shortenAddress(withdrawReceipt.gmailMessageId || '')})`
                      : `Target Email: ${withdrawReceipt.recipientEmail} (Sign in with Google to send via Gmail)`}
                  </span>
                </div>
              </div>
              {withdrawReceipt.gmailDeliveryStatus !== 'SENT' && (
                <div className="flex flex-wrap items-center gap-2">
                  {gmailNeedsAuth ? (
                    <GoogleSignInButton
                      onClick={() => connectGmailAuthorization()}
                      disabled={isGmailSigningIn}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await dispatchWithdrawalEmailForAlert(withdrawReceipt);
                        setWithdrawReceipt((prev: any) =>
                          prev
                            ? {
                                ...prev,
                                gmailDeliveryStatus: res.delivered ? 'SENT' : 'FAILED',
                                gmailMessageId: res.messageId,
                              }
                            : prev
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Gmail Auth Now</span>
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setWithdrawReceipt(null)}
                className="w-full py-2 rounded-lg bg-emerald-500 text-zinc-950 font-black text-xs cursor-pointer"
              >
                New Withdrawal
              </button>
            </div>
          ) : pendingInlineConfirm ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-3 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Confirm Withdrawal & Gmail Email Dispatch</span>
              </div>
              <p className="text-zinc-200 leading-relaxed">
                Send withdrawal authorization email to <strong className="font-mono text-white">{CONTRACTS.ALERT_EMAIL}</strong> and withdraw{' '}
                <strong className="font-mono text-amber-300">
                  {(parseFloat(withdrawBnbInput) || 0).toFixed(4)} BNB
                </strong>{' '}
                to <span className="font-mono">{shortenAddress(recipientInput)}</span>?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingInlineConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInlineWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black cursor-pointer disabled:opacity-50"
                >
                  {isWithdrawing ? 'Sending...' : 'Confirm & Send Email'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInlineValidate} className="space-y-3 text-xs">
              {withdrawError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{withdrawError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span>Withdraw Amount (BNB)</span>
                  <span className="font-mono text-amber-400 font-semibold tabular-nums">
                    ≈ {formatUSD((parseFloat(withdrawBnbInput) || 0) * bnbPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.001"
                    value={withdrawBnbInput}
                    onChange={(e) => setWithdrawBnbInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleSetWithdrawPreset(15)}
                    className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    $15
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetWithdrawPreset(25)}
                    className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    $25
                  </button>
                  <button
                    type="button"
                    onClick={handleSetMaxWithdraw}
                    className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-bold cursor-pointer"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Destination BEP-20 Address</label>
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500/60"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isWithdrawing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  Review & Withdraw {(parseFloat(withdrawBnbInput) || 0).toFixed(4)} BNB
                </span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Connected Hardware Fleet (Unified with TS BOT & IRD Balance) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-amber-400" />
            Hardware Mining Rigs (Crediting Unified TS BOT & IRD Balance)
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {connectedMachines.length} Active Rigs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectedMachines.map((machine) => {
            const isOverclocked = machine.status === 'OVERCLOCKED';
            return (
              <div
                key={machine.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      UNIFIED TS + IRD
                    </span>
                    <span className="text-zinc-400">{machine.tier}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1.5 font-sans">
                    {machine.name}
                  </h4>
                  <div className="text-[10px] text-zinc-500">S/N: {machine.serialNumber}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-[11px] tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hashrate:</span>
                    <span className="text-white font-bold">
                      {isOverclocked ? (machine.hashrateTh * 1.2).toFixed(1) : machine.hashrateTh} TH/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Rig Yield Synced:</span>
                    <span className="text-emerald-400 font-bold">
                      +{(machine.totalMinedBnb ?? 0).toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Bound IRD Node:</span>
                    <span className="text-amber-300">
                      {shortenAddress(machine.irdWalletAddress || irdWalletAddress)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSyncUnified(machine.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Credit to Unified Balance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => linkMachineToIrd(machine.id)}
                    className="py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Verify Link
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified Block Stream */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Live Unified TS BOT & IRD Block Stream
          </h3>
          <span className="text-xs text-zinc-500 font-mono">Every 3-Second Block Generation</span>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 divide-y divide-zinc-800 font-mono text-xs">
          {irdFeedHistory.slice(0, 8).map((evt) => (
            <div
              key={evt.id}
              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <span>{evt.machineName || 'TS BOT & IRD Miner'}</span>
                    <span className="text-[10px] text-zinc-500">•</span>
                    <span className="text-amber-400 text-[11px]">
                      Unified Node ({shortenAddress(evt.targetIrdWallet)})
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Tx: {shortenAddress(evt.txHash)} • Block #{evt.blockNumber}
                  </div>
                </div>
              </div>

              <div className="text-right sm:shrink-0 tabular-nums">
                <span className="text-emerald-400 font-bold block">+{evt.amountBnb.toFixed(6)} BNB</span>
                <span className="text-[10px] text-zinc-500">+{formatUSD(evt.amountUsd)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
