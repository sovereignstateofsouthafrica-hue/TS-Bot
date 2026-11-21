import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  ShieldCheck,
  AlertCircle,
  Coins,
  Cpu,
  Sparkles,
  Send,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, WITHDRAWAL_RULES, formatUSD, shortenAddress } from '../data/constants';
import { GoogleSignInButton } from './GoogleSignInButton';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientAddress?: string;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  defaultRecipientAddress,
}) => {
  const {
    wallet,
    processWithdrawalBnb,
    rechargeBalance,
    accumulatedMiningYieldBnb,
    addMinedYieldBnb,
    refreshTokenBalances,
    gmailAuthorized,
    gmailNeedsAuth,
    gmailAccountEmail,
    isGmailSigningIn,
    connectGmailAuthorization,
    dispatchWithdrawalEmailForAlert,
  } = useProtocol();

  const bnbPrice = WITHDRAWAL_RULES.BNB_PRICE_USD; // 614.50
  const minWithdrawalUsd = WITHDRAWAL_RULES.MIN_WITHDRAWAL_USD; // 15.00
  const minWithdrawalBnb = minWithdrawalUsd / bnbPrice; // ~0.02441 BNB
  const minMinedRequiredUsd = WITHDRAWAL_RULES.MIN_MINED_REQUIRED_USD; // 16.00
  const minMinedRequiredBnb = minMinedRequiredUsd / bnbPrice; // ~0.02604 BNB
  const withdrawalChargeUsd = WITHDRAWAL_RULES.WITHDRAWAL_CHARGE_USD; // 1.00
  const withdrawalChargeBnb = withdrawalChargeUsd / bnbPrice; // ~0.001627 BNB

  const [withdrawSource, setWithdrawSource] = useState<'miner' | 'wallet'>('miner');
  const [withdrawBnbAmount, setWithdrawBnbAmount] = useState<string>(minWithdrawalBnb.toFixed(4));
  const [recipientAddress, setRecipientAddress] = useState<string>(defaultRecipientAddress || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [boostedNotice, setBoostedNotice] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  useEffect(() => {
    if (isOpen && defaultRecipientAddress) {
      setRecipientAddress(defaultRecipientAddress);
    }
  }, [isOpen, defaultRecipientAddress]);

  if (!isOpen) return null;

  const currentMinedBnb = accumulatedMiningYieldBnb;
  const currentMinedUsd = currentMinedBnb * bnbPrice;
  const availableWalletBnb = rechargeBalance + wallet.balances.BNB;
  const availableWalletUsd = availableWalletBnb * bnbPrice;

  const numAmountBnb = parseFloat(withdrawBnbAmount) || 0;
  const numAmountUsd = numAmountBnb * bnbPrice;
  const totalRequiredBnb = numAmountBnb + withdrawalChargeBnb;
  const totalRequiredUsd = numAmountUsd + withdrawalChargeUsd;
  const netReceivedBnb = numAmountBnb;
  const netReceivedUsd = numAmountUsd;

  const isMinerEligibleForMinWithdrawal = currentMinedUsd >= minMinedRequiredUsd - 0.05;
  const minedProgressPct = Math.min(100, Math.max(0, (currentMinedUsd / minMinedRequiredUsd) * 100));

  const handleSetUsdPreset = (usd: number) => {
    const bnb = (usd / bnbPrice).toFixed(4);
    setWithdrawBnbAmount(bnb);
    setErrorMsg(null);
  };

  const handleMaxMined = () => {
    if (withdrawSource === 'miner') {
      const maxNetBnb = Math.max(0, currentMinedBnb - withdrawalChargeBnb);
      setWithdrawBnbAmount(maxNetBnb.toFixed(4));
    } else {
      const maxNetBnb = Math.max(0, availableWalletBnb - withdrawalChargeBnb);
      setWithdrawBnbAmount(maxNetBnb.toFixed(4));
    }
    setErrorMsg(null);
  };

  const handleSimulateMined16 = () => {
    const neededUsd = Math.max(16.5, minMinedRequiredUsd + 0.5);
    const neededBnb = neededUsd / bnbPrice;
    const toAdd = Math.max(0.001, neededBnb - currentMinedBnb + 0.002);
    addMinedYieldBnb(toAdd);
    setBoostedNotice(
      `Added +${(toAdd * bnbPrice).toFixed(2)} USD (${toAdd.toFixed(4)} BNB) to your BNB Miner. Total mined is now over $16.00!`
    );
    setErrorMsg(null);
    setTimeout(() => setBoostedNotice(null), 5000);
  };

  const handleValidateAndOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawBnbAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    const requestedUsd = amount * bnbPrice;

    if (requestedUsd < minWithdrawalUsd - 0.05) {
      setErrorMsg(
        `Withdrawal starts from $${minWithdrawalUsd.toFixed(2)} USD (${minWithdrawalBnb.toFixed(4)} BNB). You entered $${requestedUsd.toFixed(2)} USD.`
      );
      return;
    }

    if (withdrawSource === 'miner') {
      const neededMinedUsd = Math.max(minMinedRequiredUsd, requestedUsd + withdrawalChargeUsd);
      if (currentMinedUsd < neededMinedUsd - 0.05) {
        setErrorMsg(
          `BNB miner must have mined at least $${neededMinedUsd.toFixed(2)} USD to withdraw $${requestedUsd.toFixed(2)} USD because of the $${withdrawalChargeUsd.toFixed(2)} withdrawal charge. Your miner has mined $${currentMinedUsd.toFixed(2)} USD.`
        );
        return;
      }
    } else {
      const totalReq = amount + withdrawalChargeBnb;
      if (totalReq > availableWalletBnb) {
        setErrorMsg(
          `Insufficient wallet balance. Total required with $${withdrawalChargeUsd.toFixed(2)} charge: ${totalReq.toFixed(4)} BNB.`
        );
        return;
      }
    }

    if (!recipientAddress || recipientAddress.trim().length < 10) {
      setErrorMsg('Please enter a valid BEP-20 destination address starting with 0x.');
      return;
    }

    setErrorMsg(null);
    setPendingConfirm(true);
  };

  const handleConfirmWithdrawalAndEmail = async () => {
    const amount = parseFloat(withdrawBnbAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = processWithdrawalBnb(
      amount,
      recipientAddress.trim(),
      `BNB Withdrawal of ${amount.toFixed(4)} BNB ($${(amount * bnbPrice).toFixed(2)}) processed via ${
        withdrawSource === 'miner' ? 'Unified TS BOT & IRD Miner' : 'Wallet Balance'
      }. $${withdrawalChargeUsd.toFixed(2)} withdrawal charge applied.`,
      withdrawSource
    );

    if (res.success && res.alert) {
      refreshTokenBalances('WITHDRAWAL');
      const emailRes = await dispatchWithdrawalEmailForAlert(res.alert);
      setReceipt({
        ...res.alert,
        gmailDeliveryStatus: emailRes.delivered
          ? 'SENT'
          : emailRes.needsAuth
          ? 'NEEDS_AUTH'
          : 'FAILED',
        gmailMessageId: emailRes.messageId,
        gmailSentFrom: emailRes.sentFrom,
        gmailError: emailRes.error,
      });
      setPendingConfirm(false);
    } else {
      setErrorMsg(res.message);
      setPendingConfirm(false);
    }
    setIsSubmitting(false);
  };

  const handleRetrySendReceiptEmail = async () => {
    if (!receipt) return;
    setIsResendingEmail(true);
    const emailRes = await dispatchWithdrawalEmailForAlert(receipt);
    setReceipt((prev: any) =>
      prev
        ? {
            ...prev,
            gmailDeliveryStatus: emailRes.delivered
              ? 'SENT'
              : emailRes.needsAuth
              ? 'NEEDS_AUTH'
              : 'FAILED',
            gmailMessageId: emailRes.messageId,
            gmailSentFrom: emailRes.sentFrom,
            gmailError: emailRes.error,
          }
        : prev
    );
    setIsResendingEmail(false);
  };

  const handleResetAndClose = () => {
    setReceipt(null);
    setPendingConfirm(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-zinc-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Withdrawal Crypto (BNB)</h3>
              <p className="text-xs text-zinc-400 font-mono">Network: BNB Smart Chain (BEP-20)</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receipt ? (
          /* Success Receipt */
          <div className="space-y-4 text-xs animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">Withdrawal Broadcasted!</h4>
              <p className="text-emerald-300 font-sans text-xs">
                Your withdrawal of <span className="font-bold">{receipt.amountBnb.toFixed(4)} BNB</span> ({formatUSD(receipt.amountUsd)}) was submitted successfully.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Requested Withdrawal:</span>
                <span className="text-white font-bold">
                  {receipt.amountBnb.toFixed(4)} BNB ({formatUSD(receipt.amountUsd)})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850 text-amber-400">
                <span>Withdrawal Charges:</span>
                <span>$1.00 USD ({withdrawalChargeBnb.toFixed(4)} BNB)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850 font-bold text-zinc-300">
                <span>Total Debited:</span>
                <span>
                  {receipt.totalDebitedBnb
                    ? receipt.totalDebitedBnb.toFixed(4)
                    : (receipt.amountBnb + withdrawalChargeBnb).toFixed(4)}{' '}
                  BNB ({formatUSD(receipt.amountUsd + 1.0)})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Destination Address:</span>
                <span className="text-zinc-200">{shortenAddress(receipt.walletAddress)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Tx Hash:</span>
                <span className="text-zinc-200 truncate max-w-[200px]">{receipt.txHash}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Recipient Email:</span>
                <span className="text-amber-300">{receipt.recipientEmail}</span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 font-bold">
                <span className="flex items-center gap-1 font-sans text-zinc-400">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  Gmail Delivery Status:
                </span>
                {receipt.gmailDeliveryStatus === 'SENT' ? (
                  <span className="text-emerald-400">
                    Delivered (ID: {shortenAddress(receipt.gmailMessageId || '')})
                  </span>
                ) : (
                  <span className="text-amber-400">Pending Google Sign-In</span>
                )}
              </div>
            </div>

            {receipt.gmailDeliveryStatus !== 'SENT' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/35 space-y-2.5">
                <div className="text-[11px] text-amber-200 leading-relaxed">
                  {receipt.gmailError ||
                    `Sign in with Google (${CONTRACTS.ALERT_EMAIL}) to deliver this withdrawal authorization email directly to your Gmail inbox.`}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {gmailNeedsAuth ? (
                    <GoogleSignInButton
                      onClick={() => connectGmailAuthorization()}
                      disabled={isGmailSigningIn}
                      label={isGmailSigningIn ? 'Connecting...' : 'Sign in with Google'}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={handleRetrySendReceiptEmail}
                      disabled={isResendingEmail}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isResendingEmail ? 'Sending via Gmail...' : 'Send Authorization Email Now'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : pendingConfirm ? (
          /* Explicit User Confirmation Dialog before Email Send + Withdrawal */
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Confirm Withdrawal & Gmail Email Authorization</span>
              </div>
              <p className="text-zinc-200 leading-relaxed">
                You are about to process a withdrawal of{' '}
                <strong className="text-white font-mono">
                  {numAmountBnb.toFixed(4)} BNB ({formatUSD(numAmountUsd)})
                </strong>{' '}
                and send an official authorization email to{' '}
                <strong className="text-amber-300 font-mono">{CONTRACTS.ALERT_EMAIL}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Email Recipient:</span>
                <span className="text-amber-300 font-bold">{CONTRACTS.ALERT_EMAIL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email Subject:</span>
                <span className="text-zinc-200 truncate max-w-[230px]">
                  Withdrawal Auth ({numAmountBnb.toFixed(4)} BNB)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Destination BEP-20:</span>
                <span className="text-zinc-200">{shortenAddress(recipientAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Debited (+$1 Fee):</span>
                <span className="text-emerald-400 font-bold">
                  {totalRequiredBnb.toFixed(4)} BNB ({formatUSD(totalRequiredUsd)})
                </span>
              </div>
            </div>

            {/* Gmail Connection Control inside Confirmation Step */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${gmailAuthorized ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>{gmailAuthorized ? 'Gmail Authorized & Ready' : 'Connect Google to Send Real Email'}</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {gmailAuthorized
                    ? `Sending as ${gmailAccountEmail || CONTRACTS.ALERT_EMAIL}`
                    : `Sign in with Google (${CONTRACTS.ALERT_EMAIL}) so the email arrives in your inbox.`}
                </div>
              </div>
              {gmailNeedsAuth && (
                <GoogleSignInButton
                  onClick={() => connectGmailAuthorization()}
                  disabled={isGmailSigningIn}
                  label={isGmailSigningIn ? 'Connecting...' : 'Sign in with Google'}
                />
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdrawalAndEmail}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Sending & Processing...' : 'Confirm & Send Email Auth'}
              </button>
            </div>
          </div>
        ) : (
          /* Withdrawal Form */
          <form onSubmit={handleValidateAndOpenConfirm} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            {boostedNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{boostedNotice}</span>
              </div>
            )}

            {/* Gmail Authorization Sync Status Banner */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email Authorization: {CONTRACTS.ALERT_EMAIL}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {gmailAuthorized
                    ? `Gmail synced (${gmailAccountEmail || CONTRACTS.ALERT_EMAIL}) — real emails enabled`
                    : 'Sign in with Google to receive live withdrawal authorization emails'}
                </div>
              </div>
              {gmailNeedsAuth ? (
                <GoogleSignInButton
                  onClick={() => connectGmailAuthorization()}
                  disabled={isGmailSigningIn}
                  label={isGmailSigningIn ? 'Connecting...' : 'Sign in with Google'}
                />
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-mono text-[10px] font-bold shrink-0">
                  GMAIL SYNCED
                </span>
              )}
            </div>

            {/* Source Selection Tabs */}
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setWithdrawSource('miner');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  withdrawSource === 'miner'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Unified Miner Yield</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWithdrawSource('wallet');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  withdrawSource === 'wallet'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Wallet / Recharge Bal</span>
              </button>
            </div>

            {/* Current Balance & Miner Progress Card */}
            {withdrawSource === 'miner' ? (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">
                      Unified TS BOT & IRD Mined Balance:
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5 tabular-nums">
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {currentMinedBnb.toFixed(6)} BNB
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        (≈ {formatUSD(currentMinedUsd)})
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border ${
                      isMinerEligibleForMinWithdrawal
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-850 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {isMinerEligibleForMinWithdrawal ? 'MIN $16 MET' : 'MINING TO $16'}
                  </span>
                </div>

                {/* Progress bar to $16.00 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono tabular-nums">
                    <span className="text-zinc-400">Progress to $16.00 Mined Requirement:</span>
                    <span
                      className={
                        isMinerEligibleForMinWithdrawal ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                      }
                    >
                      {formatUSD(currentMinedUsd)} / $16.00 USD ({minedProgressPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isMinerEligibleForMinWithdrawal
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      }`}
                      style={{ width: `${minedProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-zinc-500">Need to test $16 mined requirement?</span>
                  <button
                    type="button"
                    onClick={handleSimulateMined16}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Boost Miner (+$16.00 Mined)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[11px] block">
                    Available Wallet & Recharge Balance
                  </span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {availableWalletBnb.toFixed(4)} BNB
                  </span>
                  <span className="text-xs text-zinc-400 font-mono ml-2">
                    (≈ {formatUSD(availableWalletUsd)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleMaxMined}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-xs font-bold cursor-pointer"
                >
                  Max
                </button>
              </div>
            )}

            {/* Amount input */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Amount to Withdraw (Starts from $15)</span>
                <span className="font-mono text-amber-400 font-semibold tabular-nums">
                  ≈ {formatUSD(numAmountUsd)} USD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  step="0.0001"
                  min={minWithdrawalBnb}
                  value={withdrawBnbAmount}
                  onChange={(e) => setWithdrawBnbAmount(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white focus:outline-none w-2/3 font-mono"
                  placeholder={minWithdrawalBnb.toFixed(4)}
                  required
                />
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-mono">
                  BNB
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(15)}
                  className="py-1 px-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold text-center hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  $15 (Min)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(25)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold text-center cursor-pointer"
                >
                  $25
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(50)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold text-center cursor-pointer"
                >
                  $50
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(100)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold text-center cursor-pointer"
                >
                  $100
                </button>
                <button
                  type="button"
                  onClick={handleMaxMined}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-emerald-400 font-mono text-[11px] font-bold text-center cursor-pointer"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Destination Address Input */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="text-zinc-300 font-semibold">
                  Destination BNB (BEP-20) Wallet Address
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRecipientAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 cursor-pointer"
                  >
                    Use {shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}
                  </button>
                  {wallet.address && (
                    <button
                      type="button"
                      onClick={() => setRecipientAddress(wallet.address!)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                    >
                      My Wallet
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            {/* Accounting Breakdown */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono space-y-1.5 text-zinc-400 tabular-nums">
              <div className="flex justify-between">
                <span>Requested Withdrawal Amount:</span>
                <span className="text-white font-semibold">
                  {numAmountBnb.toFixed(4)} BNB ({formatUSD(numAmountUsd)})
                </span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Protocol Withdrawal Charges:</span>
                <span>$1.00 USD ({withdrawalChargeBnb.toFixed(4)} BNB)</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850 pt-1.5 text-emerald-400 font-bold">
                <span>Net Received:</span>
                <span>
                  {netReceivedBnb.toFixed(4)} BNB ({formatUSD(netReceivedUsd)})
                </span>
              </div>
            </div>

            {/* Submit -> Opens explicit Confirmation step */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>
                Review & Authorize Withdrawal ({numAmountBnb.toFixed(4)} BNB)
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
