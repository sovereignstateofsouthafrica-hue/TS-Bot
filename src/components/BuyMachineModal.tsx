import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  Coins, 
  ArrowRight, 
  Activity, 
  ExternalLink,
  Flame,
  Award,
  Clock,
  Radio
} from 'lucide-react';
import { MiningMachinePackage, ConnectedMachine } from '../types';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, formatNumber, shortenAddress, CONTRACTS } from '../data/constants';

interface BuyMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: MiningMachinePackage | null;
  onSuccess?: (machine: ConnectedMachine) => void;
}

export const BuyMachineModal: React.FC<BuyMachineModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  onSuccess,
}) => {
  const { wallet, rechargeBalance, rechargeBalanceUsd, buyMiningMachinePackage } = useProtocol();
  const [paymentMethod, setPaymentMethod] = useState<'BNB' | 'USDT' | 'RECHARGE'>('BNB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchasedMachine, setPurchasedMachine] = useState<ConnectedMachine | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !selectedPackage) return null;

  const bnbRate = 614.50;
  const bnbCost = selectedPackage.priceUsd / bnbRate;
  const usdtCost = selectedPackage.priceUsd;

  const handlePurchase = () => {
    setErrorMessage(null);
    setIsProcessing(true);

    setTimeout(() => {
      const res = buyMiningMachinePackage(selectedPackage.id, paymentMethod);
      setIsProcessing(false);

      if (res.success && res.machine) {
        setPurchasedMachine(res.machine);
        if (onSuccess) onSuccess(res.machine);
      } else {
        setErrorMessage(res.message);
      }
    }, 900);
  };

  const handleClose = () => {
    setPurchasedMachine(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-zinc-100 my-8">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!purchasedMachine ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Second Generation Product • Mining Hardware
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
                  {selectedPackage.model}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
                <Cpu className="w-6 h-6 text-amber-400" />
                Buy Mining Machines Packages
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Order and connect <strong className="text-white">{selectedPackage.name}</strong> to the IRD BEP-20 Stratum mining pool.
              </p>
            </div>

            {/* Product Card Preview */}
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-full sm:w-44 h-40 rounded-xl overflow-hidden bg-black shrink-0 border border-amber-500/20">
                <img 
                  src={selectedPackage.image} 
                  alt={selectedPackage.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform" 
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/90 text-amber-400 text-[10px] font-black font-mono border border-amber-500/40">
                  ${selectedPackage.priceUsd} MODEL
                </div>
              </div>

              <div className="flex-1 space-y-2.5 text-xs w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedPackage.name}</h3>
                    <div className="text-[11px] text-zinc-400">{selectedPackage.cooling} • {selectedPackage.specs.dimensions}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-amber-400 font-mono">
                      ${selectedPackage.priceUsd}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      ≈ {bnbCost.toFixed(4)} BNB
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Hashrate</div>
                    <div className="font-bold text-emerald-400">{selectedPackage.hashrateTh} TH/s</div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Daily Yield</div>
                    <div className="font-bold text-amber-400">+{selectedPackage.dailyYieldPct}% / day</div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 col-span-2 sm:col-span-1">
                    <div className="text-zinc-500 text-[10px]">Daily Reward</div>
                    <div className="font-bold text-white">
                      +{((selectedPackage.priceUsd * (selectedPackage.dailyYieldPct / 100)) / 614.50).toFixed(4)} BNB
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400">
                  <span className="text-emerald-400 font-bold">
                    Est. {formatUSD(selectedPackage.priceUsd * (selectedPackage.dailyYieldPct / 100))} USD / day
                  </span>
                  {' • '}Clears minimum requirement ($16 mined to withdraw $15).
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                Select Payment Source:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Pay with BNB */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BNB')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'BNB'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400">BNB Balance</span>
                    {paymentMethod === 'BNB' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-sm font-black font-mono text-white mt-1">
                    {bnbCost.toFixed(4)} BNB
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Avail: {wallet.balances.BNB?.toFixed(3)} BNB
                  </div>
                </button>

                {/* Pay with USDT */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('USDT')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'USDT'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400">USDT Balance</span>
                    {paymentMethod === 'USDT' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-sm font-black font-mono text-white mt-1">
                    ${usdtCost.toFixed(2)} USDT
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Avail: {wallet.balances.USDT?.toFixed(1)} USDT
                  </div>
                </button>

                {/* Pay with Recharge Balance */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('RECHARGE')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'RECHARGE'
                      ? 'bg-yellow-500/10 border-yellow-500 text-white shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-yellow-400">Recharge Bal</span>
                    {paymentMethod === 'RECHARGE' && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <div className="text-sm font-black font-mono text-white mt-1">
                    {bnbCost.toFixed(4)} BNB
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Avail: {rechargeBalance.toFixed(4)} BNB
                  </div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Operational Contract & Deployment Info */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Hardware Stratum Node:</span>
                <span className="text-amber-400 font-bold">ts-mining.binance.com:3333</span>
              </div>
              <div className="flex justify-between">
                <span>On-Chain Router:</span>
                <span className="text-zinc-300">{shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware Warranty:</span>
                <span className="text-white">{selectedPackage.specs.warranty}</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Connect:</span>
                <span className="text-emerald-400 font-bold">Plug & Play Instant Activation</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-1/3 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full sm:w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Provisioning ASIC & Connecting Stratum...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Purchase & Connect Machine (${selectedPackage.priceUsd})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Machine Connected Successfully!
              </span>
              <h2 className="text-2xl font-black text-white">
                {purchasedMachine.name}
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Your Second Generation hardware rig has been provisioned, assigned an IRD serial number, and connected to the Binance Mining Cloud Stratum pool!
              </p>
            </div>

            {/* Machine Specs Box */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left font-mono text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Hardware Serial:</span>
                <span className="text-amber-400 font-bold">{purchasedMachine.serialNumber}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  ONLINE & MINING
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Hashrate:</span>
                <span className="text-white font-bold">{purchasedMachine.hashrateTh} TH/s</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Daily Return:</span>
                <span className="text-amber-300 font-bold">
                  +{purchasedMachine.dailyYieldPct}% / day ({formatUSD(purchasedMachine.priceUsd * (purchasedMachine.dailyYieldPct / 100))})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Stratum Node:</span>
                <span className="text-zinc-300">ts-mining.binance.com:3333</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full max-w-md py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg transition-all"
              >
                View in Connected Machines Fleet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
