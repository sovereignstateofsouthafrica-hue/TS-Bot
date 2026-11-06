import React, { useState } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  Copy, 
  CheckCircle2, 
  QrCode, 
  Mail, 
  ShieldCheck, 
  Zap, 
  ExternalLink,
  Coins
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD } from '../data/constants';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose }) => {
  const { processRechargeBnb, wallet } = useProtocol();

  const [bnbAmount, setBnbAmount] = useState<string>('0.1627'); // ~$100 default
  const [selectedUsdPackage, setSelectedUsdPackage] = useState<number>(100);
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  if (!isOpen) return null;

  const bnbPrice = 614.50;
  const packages = [10, 30, 50, 100, 200, 500, 1000];

  const handleSelectPackage = (usd: number) => {
    setSelectedUsdPackage(usd);
    const calculatedBnb = (usd / bnbPrice).toFixed(4);
    setBnbAmount(calculatedBnb);
  };

  const handleCustomBnbChange = (val: string) => {
    setBnbAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setSelectedUsdPackage(Math.round(num * bnbPrice));
    } else {
      setSelectedUsdPackage(0);
    }
  };

  const copyRechargeAddress = () => {
    navigator.clipboard.writeText(CONTRACTS.RECHARGE_ROUTER_DEFI);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bnbAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const res = processRechargeBnb(
        amount, 
        txHashInput.trim() || undefined,
        `BNB Recharge Package ($${(amount * bnbPrice).toFixed(2)}) Credited & Dispatched`
      );
      setReceipt(res.alert);
      setIsSubmitting(false);
    }, 600);
  };

  const handleResetAndClose = () => {
    setReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Recharge Crypto (BNB)</h3>
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
          /* Confirmation Receipt */
          <div className="space-y-4 text-xs animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">Recharge Confirmed & Activated!</h4>
              <p className="text-emerald-300 font-sans text-xs">
                Your deposit of <span className="font-bold">{receipt.amountBnb.toFixed(4)} BNB</span> ({formatUSD(receipt.amountUsd)}) was successfully credited to your Dashboard Recharge Balance. Active trading and 4% daily mining figures are now live!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Transaction Hash:</span>
                <span className="text-zinc-200 truncate max-w-[220px]">{receipt.txHash}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Credited Address:</span>
                <span className="text-zinc-200">{wallet.address || '0x71C...a49B'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">Block Height:</span>
                <span className="text-amber-400">#{receipt.blockNumber}</span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 text-emerald-400 font-bold">
                <span className="flex items-center gap-1 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dashboard Status:
                </span>
                <span>Active 4% Daily Yield Mining</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Recharge Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Quick Packages */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-2">
                Select Recharge Package Tier
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {packages.map((usd) => (
                  <button
                    key={usd}
                    type="button"
                    onClick={() => handleSelectPackage(usd)}
                    className={`py-2 px-1 rounded-xl font-mono text-center font-bold transition-all text-xs border ${
                      selectedUsdPackage === usd
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    ${usd}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom BNB Amount Input */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Amount to Recharge (BNB)</span>
                <span className="font-mono text-amber-400 font-semibold">
                  ≈ ${((parseFloat(bnbAmount) || 0) * bnbPrice).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  step="0.0001"
                  min="0.001"
                  value={bnbAmount}
                  onChange={(e) => handleCustomBnbChange(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white focus:outline-none w-2/3 font-mono"
                  placeholder="0.00"
                  required
                />
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-mono">
                  BNB
                </span>
              </div>
            </div>

            {/* Official Recharge Address Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Official Protocol Recharge Address:</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  BEP-20 Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-200">
                <span className="truncate mr-2 select-all font-semibold">
                  {CONTRACTS.RECHARGE_ROUTER_DEFI}
                </span>
                <button
                  type="button"
                  onClick={copyRechargeAddress}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                  title="Copy Recharge Address"
                >
                  {copiedAddress ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Optional Tx Hash / Proof */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Transaction Hash / TxID (Optional)
              </label>
              <input
                type="text"
                value={txHashInput}
                onChange={(e) => setTxHashInput(e.target.value)}
                placeholder="0x... (Leave empty to auto-generate verified BEP-20 hash)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Dashboard Recharge Balance Activation Banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Dashboard Recharge Balance Activation:</span>
                <p className="text-zinc-300 mt-0.5">
                  Confirming this recharge credits your Recharge Balance on the Dashboard and activates automated TS BNB 4% daily yield trading.
                </p>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-zinc-950" />
              <span>{isSubmitting ? 'Confirming On-Chain...' : `Confirm Recharge of ${bnbAmount} BNB`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
