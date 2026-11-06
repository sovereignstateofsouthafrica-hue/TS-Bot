import React, { useState } from 'react';
import { 
  Bot, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Code2, 
  FileCheck
} from 'lucide-react';
import { CONTRACTS } from '../data/constants';

export const Footer: React.FC = () => {
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const copyAddress = (addr: string, name: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedContract(name);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  return (
    <footer className="mt-16 border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-black">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">TS PROTOCOL</span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Decentralized automated liquidity provisioning protocols and real-time AMM trading visualizer built natively for BNB Chain (BEP-20).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                CertiK Audited Architecture
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                100% Non-Custodial
              </span>
            </div>
          </div>

          {/* Verified Contracts */}
          <div className="space-y-2.5 md:col-span-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Verified Smart Contract Deployments
            </h4>
            
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[10px] block">TS Token Contract (BEP-20):</span>
                  <span className="text-zinc-200 select-all">{CONTRACTS.TS_TOKEN}</span>
                </div>
                <button
                  onClick={() => copyAddress(CONTRACTS.TS_TOKEN, 'TS')}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  {copiedContract === 'TS' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[10px] block">Decentralized Liquidity Router:</span>
                  <span className="text-zinc-200 select-all">{CONTRACTS.RECHARGE_ROUTER_DEFI}</span>
                </div>
                <button
                  onClick={() => copyAddress(CONTRACTS.RECHARGE_ROUTER_DEFI, 'Router')}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  {copiedContract === 'Router' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Community & Governance */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Community & Support
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <a
                  href={CONTRACTS.TELEGRAM_COMMUNITY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Official Telegram Support</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li className="flex items-center gap-1.5 text-zinc-400">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>BNB Chain Verified Source</span>
              </li>
              <li className="flex items-center gap-1.5 text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero Centralized Custody</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 border-t border-zinc-800/60 text-[11px] text-zinc-500 leading-relaxed flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            TS Protocol is a decentralized software interface. Users maintain custody of their cryptographic keys at all times. Yields are generated exclusively through peer-to-peer liquidity provisioning swap fees.
          </p>
          <div className="whitespace-nowrap font-mono text-zinc-400">
            © {new Date().getFullYear()} TS Protocol • BNB Smart Chain
          </div>
        </div>
      </div>
    </footer>
  );
};
