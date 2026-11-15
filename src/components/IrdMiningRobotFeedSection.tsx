import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight, 
  Radio, 
  Activity, 
  ShieldCheck, 
  Wallet, 
  Sparkles, 
  Flame, 
  RefreshCw,
  Coins,
  Share2,
  FileText,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, MINING_FEED_RULES, formatUSD, shortenAddress } from '../data/constants';

interface IrdMiningRobotFeedSectionProps {
  onOpenWithdrawal?: () => void;
}

export const IrdMiningRobotFeedSection: React.FC<IrdMiningRobotFeedSectionProps> = ({
  onOpenWithdrawal
}) => {
  const { 
    wallet,
    connectedMachines,
    accumulatedMiningYieldBnb,
    rechargeBalance,
    irdWalletAddress,
    setIrdWalletAddress,
    totalMinesFedToIrdBnb,
    totalMinesFedToIrdUsd,
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
  } = useProtocol();

  const [customIrdInput, setCustomIrdInput] = useState(irdWalletAddress);
  const [showAddressEdit, setShowAddressEdit] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedSuccessMsg, setFeedSuccessMsg] = useState<string | null>(null);

  const handleSaveIrdAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIrdInput || !customIrdInput.startsWith('0x')) return;
    setIrdWalletAddress(customIrdInput);
    setShowAddressEdit(false);
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 3000);
  };

  const handleManualFeed = (machineId?: string) => {
    setIsFeeding(true);
    setFeedSuccessMsg(null);
    setTimeout(() => {
      const res = feedMinesToIrd(machineId);
      setIsFeeding(false);
      setFeedSuccessMsg(res.message);
      setTimeout(() => setFeedSuccessMsg(null), 6000);
    }, 700);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-amber-950/25 to-zinc-950 border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl shadow-amber-500/15 space-y-6">
      {/* Top Banner: Mining Machine Link to IRD & Mining Robot Feed */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-amber-500/30">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5">
              <Bot className="w-4 h-4 fill-zinc-950" />
              Mining Robot Feed Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-amber-300 border border-amber-500/30">
              Linked to IRD Blockchain Wallet
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Auto-Feeding Active
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Mining Robot Feed the Mines to IRD
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Direct cryptographic bridge binding all Second Generation TS Mining Machines and the Automated Trading/Mining Robot to your <strong className="text-amber-300">IRD Blockchain Wallet</strong>. All block hash rewards are continuously routed into the IRD BEP-20 ecosystem.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
            <a 
              href={CONTRACTS.IRD_WALLET_APP_URL}
              target="_blank" 
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 font-sans font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Open IRD Blockchain Wallet (bnb-harbor-trade)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a 
              href={CONTRACTS.IRD_WHITEPAPER}
              target="_blank" 
              rel="noreferrer"
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px] underline underline-offset-4"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>IRD Certificate White Paper</span>
            </a>

            <a 
              href={CONTRACTS.IRD_TS_BNB_CONTRACT}
              target="_blank" 
              rel="noreferrer"
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px] underline underline-offset-4"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>TS BNB Contract</span>
            </a>
          </div>
        </div>

        {/* IRD Wallet Binding Control Card */}
        <div className="bg-zinc-950/90 rounded-2xl border border-amber-500/30 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-[300px] shadow-inner font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Target IRD Wallet Node
            </span>
            <button
              onClick={() => setShowAddressEdit(!showAddressEdit)}
              className="text-[10px] text-amber-400 hover:underline cursor-pointer"
            >
              {showAddressEdit ? 'Cancel' : 'Change Address'}
            </button>
          </div>

          {!showAddressEdit ? (
            <div className="space-y-1">
              <div className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                <span>{shortenAddress(irdWalletAddress)}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">VERIFIED</span>
              </div>
              <span className="text-[10px] text-zinc-500 block truncate">
                Full: {irdWalletAddress}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSaveIrdAddress} className="space-y-2">
              <input
                type="text"
                value={customIrdInput}
                onChange={(e) => setCustomIrdInput(e.target.value)}
                placeholder="0x... IRD Wallet Address"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-white text-xs font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
              >
                Update IRD Destination
              </button>
            </form>
          )}

          {addressSaved && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>IRD Destination Address Updated!</span>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-500 text-[11px]">Total Mines Fed to IRD:</span>
            <span className="text-emerald-400 font-black text-sm">
              +{totalMinesFedToIrdBnb.toFixed(4)} BNB <span className="text-zinc-400 text-[10px]">({formatUSD(totalMinesFedToIrdUsd)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Flow: Mining Robot ──> Feed Conduit ──> IRD Blockchain Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Source: Mining Robot & Hardware Fleet */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">TS Mining Robot</h4>
                <div className="text-[10px] text-emerald-400 font-mono">AUTOPILOT MINING ENGINE</div>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Connected Hardware:</span>
              <span className="text-white font-bold">{connectedMachines.length} Active Rigs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Mined Block Yield:</span>
              <span className="text-amber-400 font-bold">
                {accumulatedMiningYieldBnb.toFixed(4)} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Mining Feed Rate:</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                ${MINING_FEED_RULES.DAILY_ACCUMULATION_USD.toFixed(2)} / 24h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Hardware Velocity:</span>
              <span className="text-zinc-300">4.0% - 10.0% / Day</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono tabular-nums">
              <span className="text-zinc-400">24h Mining Feed Cycle:</span>
              <span className="text-amber-400 font-bold">
                {formatUSD(miningFeedAccumulatedUsd)} / $1.00
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (miningFeedAccumulatedUsd / MINING_FEED_RULES.DAILY_ACCUMULATION_USD) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
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
                    setFeedSuccessMsg(res.message);
                    setTimeout(() => setFeedSuccessMsg(null), 5000);
                  }}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer"
                >
                  Collect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = advance24hMiningFeed();
                    setFeedSuccessMsg(res.message);
                    setTimeout(() => setFeedSuccessMsg(null), 5000);
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold cursor-pointer"
                >
                  +24h ($1)
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400">
            Mining feed accumulates $1.00 every 24 hours continuously and routes block yield into Mining Profits and IRD.
          </div>
        </div>

        {/* Center: Conduit Pipeline with Live Feed Action */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl p-5 space-y-4 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-300">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>REAL-TIME IRD BLOCK FEED PIPELINE</span>
          </div>

          {/* Animated Gold Flow Dots */}
          <div className="relative py-2 flex items-center justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleManualFeed()}
              disabled={isFeeding}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isFeeding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Feeding to IRD...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Feed Mines to IRD Now</span>
                </>
              )}
            </button>

            <button
              onClick={toggleMiningRobotAutoFeed}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                isMiningRobotFeedingIrd
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title="Toggle automatic block feeding to IRD"
            >
              {isMiningRobotFeedingIrd ? 'Auto-Feed: ON' : 'Auto-Feed: OFF'}
            </button>
          </div>

          {feedSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono animate-in fade-in">
              {feedSuccessMsg}
            </div>
          )}
        </div>

        {/* Destination: IRD Blockchain Wallet */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-black">
                IRD
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">IRD Blockchain Wallet</h4>
                <div className="text-[10px] text-amber-400 font-mono">bnb-harbor-trade.lovable.app</div>
              </div>
            </div>
            <a 
              href={CONTRACTS.IRD_WALLET_APP_URL}
              target="_blank" 
              rel="noreferrer"
              className="text-zinc-400 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Destination:</span>
              <span className="text-white font-bold">{shortenAddress(irdWalletAddress)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cumulative Fed:</span>
              <span className="text-emerald-400 font-bold">+{totalMinesFedToIrdBnb.toFixed(4)} BNB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">BEP-20 Network:</span>
              <span className="text-zinc-300">Binance Smart Chain</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400">
            Funds automatically feed into the IRD Blockchain Wallet balance for withdrawal or swap.
          </div>
        </div>
      </div>

      {/* Connected Machines: Link to IRD Status Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-amber-400" />
            Hardware Mining Machines Linked to IRD
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {connectedMachines.length} Connected Rigs Synchronized with IRD
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
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      LINKED TO IRD
                    </span>
                    <span className="text-zinc-400">{machine.tier}</span>
                  </div>

                  <h5 className="text-sm font-bold text-white mt-1.5 font-sans">
                    {machine.name}
                  </h5>
                  <div className="text-[10px] text-zinc-500">
                    S/N: {machine.serialNumber}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hashrate:</span>
                    <span className="text-white font-bold">
                      {isOverclocked ? (machine.hashrateTh * 1.2).toFixed(1) : machine.hashrateTh} TH/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Mined & Fed to IRD:</span>
                    <span className="text-emerald-400 font-bold">
                      +{(machine.irdFedMinesBnb ?? 0).toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Target IRD Node:</span>
                    <span className="text-amber-300">{shortenAddress(machine.irdWalletAddress || irdWalletAddress)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleManualFeed(machine.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Feed Mines to IRD</span>
                  </button>

                  <button
                    onClick={() => linkMachineToIrd(machine.id)}
                    className="py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition-colors"
                    title="Re-verify IRD Cryptographic Link"
                  >
                    Sync IRD
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time "Mines Fed to IRD" Transaction Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Live IRD Block Feed Stream
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            Every 3-Second Block Generation
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 divide-y divide-zinc-800 font-mono text-xs">
          {irdFeedHistory.slice(0, 8).map((evt) => (
            <div key={evt.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <span>{evt.machineName || 'Mining Robot'}</span>
                    <span className="text-[10px] text-zinc-500">→</span>
                    <span className="text-amber-400 text-[11px]">IRD Wallet ({shortenAddress(evt.targetIrdWallet)})</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Tx: {shortenAddress(evt.txHash)} • Block #{evt.blockNumber}
                  </div>
                </div>
              </div>

              <div className="text-right sm:shrink-0">
                <span className="text-emerald-400 font-bold block">
                  +{evt.amountBnb.toFixed(6)} BNB
                </span>
                <span className="text-[10px] text-zinc-500">
                  +{formatUSD(evt.amountUsd)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
