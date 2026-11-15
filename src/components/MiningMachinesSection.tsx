import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Activity, 
  ArrowRight, 
  Power, 
  Sliders, 
  Sparkles, 
  Plus, 
  ExternalLink,
  Coins,
  Server,
  Layers,
  Award,
  Link as LinkIcon,
  Bot,
  Wallet
} from 'lucide-react';
import { MiningMachinePackage, ConnectedMachine } from '../types';
import { TS_MINING_MACHINE_PACKAGES, CONTRACTS, formatUSD, formatNumber, shortenAddress } from '../data/constants';
import { useProtocol } from '../context/ProtocolContext';
import { IrdMiningRobotFeedSection } from './IrdMiningRobotFeedSection';

interface MiningMachinesSectionProps {
  id?: string;
  onBuyPackage: (pkg: MiningMachinePackage) => void;
  onOpenWithdrawal?: () => void;
}

export const MiningMachinesSection: React.FC<MiningMachinesSectionProps> = ({
  id = 'ts-mining-machines',
  onBuyPackage,
  onOpenWithdrawal
}) => {
  const { 
    connectedMachines, 
    connectMiningMachine, 
    disconnectMiningMachine, 
    toggleMachineOverclock,
    binanceCloud,
    accumulatedMiningYieldBnb,
    irdWalletAddress,
    feedMinesToIrd,
    linkMachineToIrd,
    totalMinesFedToIrdBnb
  } = useProtocol();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'ENTRY' | 'PRO' | 'INDUSTRIAL'>('ALL');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Aggregates for connected machines
  const totalHardwareHashrate = connectedMachines
    .filter((m) => m.status === 'ONLINE' || m.status === 'OVERCLOCKED')
    .reduce((sum, m) => sum + (m.status === 'OVERCLOCKED' ? m.hashrateTh * 1.2 : m.hashrateTh), 0);

  const totalHardwarePower = connectedMachines
    .filter((m) => m.status === 'ONLINE' || m.status === 'OVERCLOCKED')
    .reduce((sum, m) => sum + m.powerW, 0);

  const totalDailyMiningUsd = connectedMachines
    .filter((m) => m.status === 'ONLINE' || m.status === 'OVERCLOCKED')
    .reduce((sum, m) => {
      const bonus = m.status === 'OVERCLOCKED' ? 1.20 : 1.0;
      return sum + (m.priceUsd * (m.dailyYieldPct / 100) * bonus);
    }, 0);

  const totalDailyMiningBnb = totalDailyMiningUsd / 614.50;

  const totalMinedFromMachinesBnb = connectedMachines.reduce((sum, m) => sum + m.totalMinedBnb, 0);

  const filteredPackages = TS_MINING_MACHINE_PACKAGES.filter((pkg) => {
    if (activeCategoryFilter === 'ENTRY') return pkg.priceUsd <= 300;
    if (activeCategoryFilter === 'PRO') return pkg.priceUsd === 500 || pkg.priceUsd === 1000;
    if (activeCategoryFilter === 'INDUSTRIAL') return pkg.priceUsd >= 1500;
    return true;
  });

  const featured500 = TS_MINING_MACHINE_PACKAGES.find((p) => p.priceUsd === 500) || TS_MINING_MACHINE_PACKAGES[3];

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSerial.trim()) return;
    setManualSuccess(`Stratum handshake accepted! Node #${manualSerial.toUpperCase()} synced with pool.`);
    setManualSerial('');
    setTimeout(() => setManualSuccess(null), 4000);
  };

  return (
    <section id={id} className="scroll-mt-20 space-y-8">
      {/* Second Generation Section Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-amber-950/30 to-zinc-950 border border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-amber-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                Second Generation Product
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-amber-300 border border-amber-500/30">
                IRD TS BNB • Professional Rig Lineup
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              TS Mining Machines
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Industrial ASIC & multi-hash hardware units engineered for the BEP-20 TS BNB token ecosystem. Connect physical machines, overclock computational cores, and stream continuous high-yield daily BNB rewards directly to your wallet.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Efficiency ASIC
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3.5 h-3.5" /> Plug & Play Stratum Pool
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> IRD Platinum Warranty
              </span>
            </div>
          </div>

          {/* Quick Hardware Fleet Telemetry Box */}
          <div className="bg-zinc-950/90 rounded-2xl border border-zinc-800 p-4 sm:p-5 flex flex-col gap-3 min-w-[280px] shrink-0 font-mono shadow-inner">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Active Hardware Fleet
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {connectedMachines.filter((m) => m.status !== 'MAINTENANCE').length} Rigs Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Total Hashrate</span>
                <span className="text-lg font-black text-white">{totalHardwareHashrate.toFixed(1)} <span className="text-amber-400 text-xs">TH/s</span></span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Total Power</span>
                <span className="text-lg font-black text-zinc-200">{totalHardwarePower} <span className="text-zinc-400 text-xs">W</span></span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Fleet Daily Yield</span>
                <span className="text-sm font-bold text-emerald-400">
                  +{totalDailyMiningBnb.toFixed(4)} BNB
                </span>
                <span className="text-[10px] text-zinc-400 block font-normal">
                  ({formatUSD(totalDailyMiningUsd)}/day)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Stratum Port</span>
                <span className="text-xs font-bold text-amber-300">Port 3333</span>
                <span className="text-[10px] text-zinc-500 block">Ping: 12ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Connect Mining Machines (Hardware Fleet Controller) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Connect Mining Machines
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage your active hardware mining rigs, monitor live core thermals, and overclock ASIC chips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualConnect(!showManualConnect)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Link Custom Rig</span>
            </button>
            <a
              href="#mining-packages"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 text-xs font-black shadow-md flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Buy More Rigs</span>
            </a>
          </div>
        </div>

        {/* Manual Serial Connect Form if toggled */}
        {showManualConnect && (
          <form onSubmit={handleManualConnect} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              Connect Pre-Purchased Physical Hardware to Stratum Pool
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualSerial}
                onChange={(e) => setManualSerial(e.target.value)}
                placeholder="Enter IRD Serial Number (e.g. IRD-TS500-SN849204) or Miner IP"
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black"
              >
                Connect to Pool
              </button>
            </div>
            {manualSuccess && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {manualSuccess}
              </div>
            )}
          </form>
        )}

        {/* Connected Machines List */}
        {connectedMachines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedMachines.map((machine) => {
              const isOverclocked = machine.status === 'OVERCLOCKED';
              const isOnline = machine.status === 'ONLINE' || isOverclocked;
              const effectiveHashrate = isOverclocked ? Number((machine.hashrateTh * 1.2).toFixed(1)) : machine.hashrateTh;
              const effectiveDailyUsd = isOverclocked 
                ? machine.priceUsd * (machine.dailyYieldPct / 100) * 1.2 
                : machine.priceUsd * (machine.dailyYieldPct / 100);
              const effectiveDailyBnb = effectiveDailyUsd / 614.50;

              return (
                <div 
                  key={machine.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isOverclocked
                      ? 'bg-gradient-to-br from-zinc-950 via-amber-950/20 to-zinc-950 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : isOnline
                      ? 'bg-zinc-950 border-zinc-800'
                      : 'bg-zinc-950/50 border-zinc-800/60 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isOverclocked 
                              ? 'bg-amber-400 animate-ping' 
                              : isOnline 
                              ? 'bg-emerald-400' 
                              : 'bg-zinc-500'
                          }`}></span>
                          <span className={`text-[10px] font-black uppercase tracking-wider font-mono ${
                            isOverclocked 
                              ? 'text-amber-400' 
                              : isOnline 
                              ? 'text-emerald-400' 
                              : 'text-zinc-500'
                          }`}>
                            {machine.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1">
                          {machine.name}
                        </h4>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          S/N: {machine.serialNumber}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-amber-300">
                        ${machine.priceUsd}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">Hashrate</div>
                        <div className="font-bold text-emerald-400 text-sm">
                          {effectiveHashrate} TH/s
                          {isOverclocked && <span className="text-[10px] text-amber-400 ml-1">+20%</span>}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">Temperature</div>
                        <div className={`font-bold text-sm ${
                          machine.temperatureC > 65 ? 'text-amber-400' : 'text-zinc-300'
                        }`}>
                          {machine.temperatureC}°C
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">Daily Yield</div>
                        <div className="font-bold text-amber-300 text-xs">
                          +{effectiveDailyBnb.toFixed(4)} BNB
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {formatUSD(effectiveDailyUsd)}/day
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">Total Mined</div>
                        <div className="font-bold text-white text-xs">
                          {machine.totalMinedBnb.toFixed(4)} BNB
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {formatUSD(machine.totalMinedBnb * 614.50)}
                        </div>
                      </div>
                    </div>

                    {/* IRD Blockchain Wallet Link Strip */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <LinkIcon className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>IRD: {shortenAddress(machine.irdWalletAddress || irdWalletAddress)}</span>
                      </div>
                      <span className="text-emerald-400 font-bold shrink-0">
                        +{(machine.irdFedMinesBnb ?? 0).toFixed(4)} BNB Fed
                      </span>
                    </div>
                  </div>

                  {/* Machine Controls */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2">
                    <button
                      onClick={() => toggleMachineOverclock(machine.id)}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isOverclocked
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isOverclocked ? 'Overclocked' : 'Overclock'}</span>
                    </button>

                    <button
                      onClick={() => feedMinesToIrd(machine.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                      title="Feed this machine's mined blocks directly to IRD Blockchain Wallet"
                    >
                      <Zap className="w-3 h-3 stroke-[2.5]" />
                      <span>Feed to IRD</span>
                    </button>

                    {isOnline ? (
                      <button
                        onClick={() => disconnectMiningMachine(machine.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Disconnect to Standby"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => connectMiningMachine(machine.id)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold"
                      >
                        Reconnect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <Cpu className="w-12 h-12 text-zinc-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Mining Machines Connected Yet</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Select any package below from the IRD Professional Mining Rig Lineup to deploy your first dedicated BEP-20 node!
            </p>
          </div>
        )}
      </div>

      {/* Embedded IRD Pipeline: Mining Robot Feed the Mines to IRD */}
      <IrdMiningRobotFeedSection onOpenWithdrawal={onOpenWithdrawal} />

      {/* FEATURED HIGHLIGHT: $500 MODEL TS-BNB-500 PRO (Dedicated High-Res Photo Attachment) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-900 border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl shadow-amber-500/20 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Machine Photo */}
          <div className="relative w-full lg:w-1/2 h-72 sm:h-96 rounded-2xl overflow-hidden bg-black border border-amber-500/40 shrink-0 shadow-2xl group">
            <img 
              src="/assets/aistudio/IMG_9544_7123c0cd.jpeg" 
              alt="TS BNB Mining Machine $500 Model"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-black tracking-wider uppercase shadow-lg">
              $500 MODEL FLAGSHIP
            </div>
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 font-mono flex items-center justify-between">
              <span>HIGH EFFICIENCY • 120 TH/s</span>
              <span className="text-amber-400">1800W LOW POWER</span>
              <span className="text-emerald-400">QUIET COOLING</span>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Premium Single Machine
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs font-mono text-zinc-400">Model: TS-BNB-500</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white">
              TS BNB Mining Machine <span className="text-amber-400">($500 Model)</span>
            </h3>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              The flagship single unit from the IRD TS BNB blockchain server lineup. Engineered with custom gold-accented acoustic hex grilles, low-vibration 1800W power supply, and 120 TH/s of brute SHA/BEP-20 hashing power.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Hashrate</span>
                <span className="font-bold text-emerald-400 text-base">120 TH/s</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Daily Yield</span>
                <span className="font-bold text-amber-400 text-base">6.00%</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Daily Reward</span>
                <span className="font-bold text-white text-base">+$30.00</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Power</span>
                <span className="font-bold text-zinc-300 text-base">1800W</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/20 text-xs text-zinc-300 flex items-center justify-between">
              <span className="text-zinc-400">
                Price: <strong className="text-white text-sm font-mono">$500.00 USD</strong> (≈ {(500 / 614.50).toFixed(4)} BNB)
              </span>
              <button
                onClick={() => onBuyPackage(featured500)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-4 h-4 fill-zinc-950" />
                <span>Buy $500 Machine Package</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULL LINEUP SHOWCASE BANNER (Attachment IMG_9543) */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl group">
        <div className="relative h-48 sm:h-72 w-full overflow-hidden">
          <img 
            src="/assets/aistudio/IMG_9543_a18fffce.jpeg" 
            alt="IRD TS BNB Professional Mining Rig Lineup"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
          
          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono">
                IRD BLOCKCHAIN WALLET TS BNB • COMPLETE HARDWARE LINEUP
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                From Compact $100 Mini to Industrial $2000 Ultra Racks
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                Premium gold & black design • Advanced cooling with LED fans • Compact to industrial scale • Secure & efficient.
              </p>
            </div>
            
            <a 
              href="#mining-packages"
              className="px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white shrink-0 flex items-center gap-1.5"
            >
              <span>Explore All 7 Packages</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 2: Mining Machines Packages (Explicitly Labeled) */}
      <div id="mining-packages" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Official Hardware Catalog
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-400" />
              Mining Machines Packages
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select your mining tier. All packages plug directly into the TS BNB Stratum cluster with automated daily BNB payouts.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All (7)
            </button>
            <button
              onClick={() => setActiveCategoryFilter('ENTRY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategoryFilter === 'ENTRY'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              $100 - $300
            </button>
            <button
              onClick={() => setActiveCategoryFilter('PRO')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategoryFilter === 'PRO'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              $500 - $1000
            </button>
            <button
              onClick={() => setActiveCategoryFilter('INDUSTRIAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeCategoryFilter === 'INDUSTRIAL'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              $1500 - $2000
            </button>
          </div>
        </div>

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPackages.map((pkg) => {
            const bnbCost = pkg.priceUsd / 614.50;
            const dailyUsd = pkg.priceUsd * (pkg.dailyYieldPct / 100);
            const dailyBnb = dailyUsd / 614.50;
            const isFeatured = pkg.featured || pkg.priceUsd === 500;
            const isTarget300 = pkg.priceUsd === 300;

            return (
              <div
                key={pkg.id}
                className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group ${
                  isFeatured
                    ? 'bg-gradient-to-b from-zinc-900 via-amber-950/20 to-zinc-950 border-amber-500/70 shadow-xl shadow-amber-500/10'
                    : isTarget300
                    ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-emerald-500/60 shadow-lg'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative h-44 w-full bg-black overflow-hidden border-b border-zinc-800">
                  <img 
                    src={pkg.image} 
                    alt={pkg.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-zinc-950/90 text-amber-400 font-mono border border-amber-500/40">
                      ${pkg.priceUsd} MODEL
                    </span>
                    {pkg.badge && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isFeatured 
                          ? 'bg-amber-500 text-zinc-950' 
                          : isTarget300
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}>
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md text-[10px] font-mono text-zinc-300">
                    {pkg.hashrateTh} TH/s
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400">{pkg.model}</span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{pkg.tier} TIER</span>
                    </div>

                    <h4 className="text-base font-black text-white leading-tight">
                      {pkg.name}
                    </h4>

                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {pkg.description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Daily Yield</span>
                        <span className="font-bold text-amber-400">+{pkg.dailyYieldPct}% / day</span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Daily Payout</span>
                        <span className="font-bold text-emerald-400">+{formatUSD(dailyUsd)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Power</span>
                        <span className="text-zinc-300 font-semibold">{pkg.powerConsumptionW}W</span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block">Daily BNB</span>
                        <span className="text-zinc-200 font-bold">{dailyBnb.toFixed(4)}</span>
                      </div>
                    </div>

                    {isTarget300 && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                        ✓ Mines $16.50/day — automatically qualifies for the $16 minimum withdrawal rule!
                      </div>
                    )}
                  </div>

                  {/* Pricing & Buy Button */}
                  <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-zinc-400">Package Price:</span>
                        <div className="text-xl font-black text-white font-mono">
                          ${pkg.priceUsd} <span className="text-xs font-normal text-zinc-400">USD</span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-amber-300">
                        ≈ {bnbCost.toFixed(4)} BNB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onBuyPackage(pkg)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        isFeatured
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 shadow-amber-500/20'
                          : 'bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Buy Machine Package</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
