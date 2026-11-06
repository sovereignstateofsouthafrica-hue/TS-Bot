import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Mail, 
  CheckCircle2, 
  ExternalLink, 
  Search,
  Filter
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, shortenAddress } from '../data/constants';

interface AlertsLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsLedgerModal: React.FC<AlertsLedgerModalProps> = ({ isOpen, onClose }) => {
  const { alerts } = useProtocol();
  const [filterType, setFilterType] = useState<'ALL' | 'RECHARGE' | 'WITHDRAWAL'>('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Crypto Alerts Dispatch Log</h3>
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Recipient: {CONTRACTS.ALERT_EMAIL}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('RECHARGE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'RECHARGE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Recharges ({alerts.filter(a => a.type === 'RECHARGE').length})
          </button>
          <button
            onClick={() => setFilterType('WITHDRAWAL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'WITHDRAWAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Withdrawals ({alerts.filter(a => a.type === 'WITHDRAWAL').length})
          </button>
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredAlerts.map((alert) => {
            const isRecharge = alert.type === 'RECHARGE';
            return (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isRecharge 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {alert.type}
                    </span>
                    <span className="font-bold text-white font-mono">
                      {alert.amountBnb.toFixed(4)} BNB
                    </span>
                    <span className="text-zinc-500 font-mono">({formatUSD(alert.amountUsd)})</span>
                  </div>

                  <span className="text-[11px] text-zinc-500 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-zinc-300 font-sans text-xs">
                  {alert.note}
                </p>

                <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span>Target: {shortenAddress(alert.walletAddress)}</span>
                    <span className="text-zinc-600">•</span>
                    <span>Block #{alert.blockNumber}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dispatched to {shortenAddress(alert.recipientEmail)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
