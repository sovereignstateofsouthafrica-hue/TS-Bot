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
  Zap,
  HelpCircle,
  Info
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, WITHDRAWAL_RULES, formatUSD, shortenAddress } from '../data/constants';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientAddress?: string;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, defaultRecipientAddress }) => {
  const { 
    wallet, 
    processWithdrawalBnb, 
    rechargeBalance, 
    accumulatedMiningYieldBnb,
    addMinedYieldBnb 
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [boostedNotice, setBoostedNotice] = useState<string | null>(null);

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

  const isMinerEligibleForMinWithdrawal = currentMinedUsd >= (minMinedRequiredUsd - 0.05);
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
    // Top up miner to at least $16.50 so user can immediately test withdrawing $15
    const neededUsd = Math.max(16.50, minMinedRequiredUsd + 0.50);
    const neededBnb = neededUsd / bnbPrice;
    const toAdd = Math.max(0.001, neededBnb - currentMinedBnb + 0.002);
    addMinedYieldBnb(toAdd);
    setBoostedNotice(`Added +${(toAdd * bnbPrice).toFixed(2)} USD (${toAdd.toFixed(4)} BNB) to your BNB Miner. Total mined is now over $16.00!`);
    setErrorMsg(null);
    setTimeout(() => setBoostedNotice(null), 5000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawBnbAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    const requestedUsd = amount * bnbPrice;

    // Rule 1: Withdrawal starts from $15
    if (requestedUsd < minWithdrawalUsd - 0.05) {
      setErrorMsg(`Withdrawal starts from $${minWithdrawalUsd.toFixed(2)} USD (${minWithdrawalBnb.toFixed(4)} BNB). You entered $${requestedUsd.toFixed(2)} USD.`);
      return;
    }

    // Rule 2: Miner must have mined $16 to withdraw $15 because of withdrawal charges
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
        setErrorMsg(`Insufficient wallet balance. Total required with $${withdrawalChargeUsd.toFixed(2)} charge: ${totalReq.toFixed(4)} BNB.`);
        return;
      }
    }

    if (!recipientAddress || recipientAddress.trim().length < 10) {
      setErrorMsg('Please enter a valid BEP-20 destination address starting with 0x.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = processWithdrawalBnb(
        amount, 
        recipientAddress.trim(),
        `BNB Withdrawal of ${amount.toFixed(4)} BNB ($${(amount * bnbPrice).toFixed(2)}) processed via ${withdrawSource === 'miner' ? 'BNB Miner Yield' : 'Wallet Balance'}. $${withdrawalChargeUsd.toFixed(2)} withdrawal charge applied.`,
        withdrawSource
      );

      if (res.success && res.alert) {
        setReceipt(res.alert);
      } else {
        setErrorMsg(res.message);
      }
      setIsSubmitting(false);
    }, 600);
  };

  const handleResetAndClose = () => {
    setReceipt(null);
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
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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
              <h4 className="text-base font-bold text-white">Withdrawal Broadcasted & Verification Dispatched!</h4>
              <p className="text-emerald-300 font-sans text-xs">
                Your withdrawal request of <span className="font-bold">{receipt.amountBnb.toFixed(4)} BNB</span> ({formatUSD(receipt.amountUsd)}) was submitted successfully.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Requested Withdrawal:</span>
                <span className="text-white font-bold">{receipt.amountBnb.toFixed(4)} BNB ({formatUSD(receipt.amountUsd)})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850 text-amber-400">
                <span>Withdrawal Charges:</span>
                <span>$1.00 USD ({withdrawalChargeBnb.toFixed(4)} BNB)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850 font-bold text-zinc-300">
                <span>Total Debited from Miner:</span>
                <span>{receipt.totalDebitedBnb ? receipt.totalDebitedBnb.toFixed(4) : (receipt.amountBnb + withdrawalChargeBnb).toFixed(4)} BNB ({formatUSD(receipt.amountUsd + 1.00)})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Destination BEP-20 Address:</span>
                <span className="text-zinc-200">{shortenAddress(receipt.walletAddress)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Tx Hash:</span>
                <span className="text-zinc-200 truncate max-w-[200px]">{receipt.txHash}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Block Height:</span>
                <span className="text-amber-400">#{receipt.blockNumber}</span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 text-amber-400 font-bold">
                <span className="flex items-center gap-1 font-sans">
                  <Mail className="w-3.5 h-3.5" />
                  Official Request Transmitted To:
                </span>
                <span>{receipt.recipientEmail}</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Withdrawal Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

            {/* Protocol Rule Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white text-[12px]">BNB Miner Withdrawal Protocol Rules:</span>
              </div>
              <ul className="text-[11px] text-zinc-300 space-y-1 pl-6 list-disc leading-relaxed">
                <li>
                  <strong className="text-amber-300">Withdrawal starts from $15.00 USD</strong> ({minWithdrawalBnb.toFixed(4)} BNB).
                </li>
                <li>
                  <strong className="text-amber-300">BNB miner must have mined $16.00 USD</strong> ({minMinedRequiredBnb.toFixed(4)} BNB) to withdraw $15.00 because of the <strong>$1.00 Withdrawal Charges</strong>.
                </li>
                <li>
                  <strong className="text-emerald-300">$10 Mining Package mines $16.00 USD in 5 days</strong> ($3.20/day · 32% daily mining yield).
                </li>
              </ul>
            </div>

            {/* Source Selection Tabs */}
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => { setWithdrawSource('miner'); setErrorMsg(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  withdrawSource === 'miner'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>BNB Miner Yield</span>
              </button>
              <button
                type="button"
                onClick={() => { setWithdrawSource('wallet'); setErrorMsg(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                    <span className="text-zinc-500 text-[11px] block">Current BNB Miner Accumulated Count:</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {currentMinedBnb.toFixed(6)} BNB
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        (≈ {formatUSD(currentMinedUsd)})
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border ${
                    isMinerEligibleForMinWithdrawal 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' 
                      : 'bg-zinc-850 text-amber-400 border-amber-500/30'
                  }`}>
                    {isMinerEligibleForMinWithdrawal ? '✓ MIN $16 MINED MET' : 'MINING TO $16.00'}
                  </span>
                </div>

                {/* Progress bar to $16.00 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">Progress to $16.00 Mined Requirement:</span>
                    <span className={isMinerEligibleForMinWithdrawal ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
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

                {/* Convenient simulation helper button */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-zinc-500">Need to test $16 mined requirement?</span>
                  <button
                    type="button"
                    onClick={handleSimulateMined16}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Boost Miner (+$16.00 Mined)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[11px] block">Available Wallet & Recharge Balance</span>
                  <span className="text-base font-bold text-white font-mono">
                    {availableWalletBnb.toFixed(4)} BNB
                  </span>
                  <span className="text-xs text-zinc-400 font-mono ml-2">
                    (≈ {formatUSD(availableWalletUsd)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleMaxMined}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-xs font-bold"
                >
                  Max
                </button>
              </div>
            )}

            {/* Amount input */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Amount to Withdraw (Starts from $15)</span>
                <span className="font-mono text-amber-400 font-semibold">
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

              {/* Quick USD Presets ($15 Min, $25, $50, $100, Max) */}
              <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(15)}
                  className="py-1 px-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold text-center hover:bg-amber-500/30 transition-colors"
                >
                  $15 (Min)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(25)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold text-center"
                >
                  $25
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(50)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold text-center"
                >
                  $50
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUsdPreset(100)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold text-center"
                >
                  $100
                </button>
                <button
                  type="button"
                  onClick={handleMaxMined}
                  className="py-1 px-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-emerald-400 font-mono text-[11px] font-bold text-center"
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
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Ensure destination is a BEP-20 compatible wallet (MetaMask, Binance Wallet, Trust Wallet).
              </span>
            </div>

            {/* Withdrawal Charges & Accounting Breakdown */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Requested Withdrawal Amount:</span>
                <span className="text-white font-semibold">{numAmountBnb.toFixed(4)} BNB ({formatUSD(numAmountUsd)})</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Protocol Withdrawal Charges:</span>
                <span>$1.00 USD ({withdrawalChargeBnb.toFixed(4)} BNB)</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850 pt-1.5 text-zinc-300 font-semibold">
                <span>Total Required from Miner:</span>
                <span className="text-amber-400">{totalRequiredBnb.toFixed(4)} BNB ({formatUSD(totalRequiredUsd)})</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850 pt-1.5 text-emerald-400 font-bold">
                <span>Estimated Net to Receive:</span>
                <span>{netReceivedBnb.toFixed(4)} BNB ({formatUSD(netReceivedUsd)})</span>
              </div>
            </div>

            {/* Instant Alert Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Official Withdrawal Email Verification Request:</span>
                <p className="text-zinc-300 mt-0.5 leading-relaxed">
                  Only withdrawals must request on email: <span className="text-white font-mono font-bold">{CONTRACTS.ALERT_EMAIL}</span>. An immediate verification dispatch request will be transmitted to this official email address upon broadcast.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? 'Verifying Miner & Broadcasting...' 
                  : `Authorize Withdrawal of ${numAmountBnb.toFixed(4)} BNB ($${numAmountUsd.toFixed(2)})`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
