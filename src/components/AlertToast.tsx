import React from 'react';
import { Bell, CheckCircle2, ArrowDownLeft, ArrowUpRight, Mail, X, ExternalLink } from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, shortenAddress } from '../data/constants';

export const AlertToast: React.FC = () => {
  const { activeAlertToast, dismissAlertToast } = useProtocol();

  if (!activeAlertToast) return null;

  const isRecharge = activeAlertToast.type === 'RECHARGE';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl shrink-0 ${
          isRecharge 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
        }`}>
          {isRecharge ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isRecharge ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {isRecharge ? 'BNB RECHARGE ALERT' : 'BNB WITHDRAWAL ALERT'}
            </span>
            <button
              onClick={dismissAlertToast}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm font-bold text-white flex items-baseline gap-2">
            <span>{activeAlertToast.amountBnb.toFixed(4)} BNB</span>
            <span className="text-xs text-zinc-400 font-mono">({formatUSD(activeAlertToast.amountUsd)})</span>
          </div>

          <p className="text-xs text-zinc-300 font-sans">
            {activeAlertToast.note}
          </p>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[200px]" title={activeAlertToast.recipientEmail}>
                {activeAlertToast.recipientEmail}
              </span>
            </div>
            <span className="text-zinc-500 font-mono">
              Block #{activeAlertToast.blockNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
