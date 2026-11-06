import React, { useState } from 'react';
import { 
  Zap, 
  PlusCircle, 
  MinusCircle, 
  Coins, 
  ArrowDownUp, 
  ShieldCheck, 
  Share2, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  ArrowRight
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, formatNumber, shortenAddress } from '../data/constants';

interface LiquidityViewProps {
  onGoToReferrals?: () => void;
}

export const LiquidityView: React.FC<LiquidityViewProps> = ({ onGoToReferrals }) => {
  const { 
    pools, 
    selectedPool, 
    setSelectedPoolId, 
    userPositions, 
    wallet, 
    addLiquidity, 
    removeLiquidity, 
    claimPoolFees, 
    executeTierPackage 
  } = useProtocol();

  const [activeTab, setActiveTab] = useState<'tiers' | 'custom' | 'remove' | 'positions' | 'affiliate'>('tiers');
  
  // Custom deposit state
  const [amountA, setAmountA] = useState<string>('100');
  const [amountB, setAmountB] = useState<string>('0.625');
  const [removePercent, setRemovePercent] = useState<number>(50);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Sync token ratio automatically
  const handleAmountAChange = (val: string) => {
    setAmountA(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      // ratio: reserveB / reserveA
      const ratio = selectedPool.reserveB / selectedPool.reserveA;
      setAmountB((num * ratio).toFixed(4));
    }
  };

  const handleAmountBChange = (val: string) => {
    setAmountB(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const ratio = selectedPool.reserveA / selectedPool.reserveB;
      setAmountA((num * ratio).toFixed(2));
    }
  };

  const handleCustomDeposit = () => {
    const a = parseFloat(amountA);
    const b = parseFloat(amountB);
    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter valid positive amounts' });
      return;
    }
    const res = addLiquidity(selectedPool.id, a, b);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleTierClick = (tierUsd: number) => {
    const res = executeTierPackage(selectedPool.id, tierUsd);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Package $${tierUsd} Activated: ${res.message}` });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleRemove = () => {
    const res = removeLiquidity(selectedPool.id, removePercent);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleClaim = (poolId: string) => {
    const res = claimPoolFees(poolId);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const copyRefLink = () => {
    const link = `https://tsprotocol.io/defi?ref=${wallet.address || '0x71C8a49B'}`;
    navigator.clipboard.writeText(link);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const tierPackages = [
    { usd: 10, label: 'Starter', badge: 'Popular' },
    { usd: 30, label: 'Micro' },
    { usd: 50, label: 'Builder' },
    { usd: 100, label: 'Pro', badge: 'High Yield' },
    { usd: 200, label: 'Advanced' },
    { usd: 500, label: 'Validator', badge: 'Max Fee Cut' },
    { usd: 1000, label: 'Master Whaler' },
  ];

  const currentPosition = userPositions.find(p => p.poolId === selectedPool.id);

  return (
    <div className="space-y-6">
      {/* Pool Header & Selection */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Decentralized Liquidity Provisioning
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                BEP-20 Router
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Supply dual-sided liquidity into the automated smart contract pool. Earn 0.25% of all swap volume continuously.
            </p>
          </div>

          {/* Select Pool */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Select AMM Pool:</span>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {pools.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPoolId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPool.id === p.id 
                      ? 'bg-amber-500 text-zinc-950 shadow-md font-bold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p.pairName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Pool Meta Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-800/80 text-xs">
          <div>
            <span className="text-zinc-500">Pool TVL:</span>
            <div className="font-bold text-white font-mono">{formatUSD(selectedPool.tvlUsd)}</div>
          </div>
          <div>
            <span className="text-zinc-500">24h Fee Yield APY:</span>
            <div className="font-bold text-emerald-400 font-mono">
              {(selectedPool.apyBase + selectedPool.apyReward).toFixed(1)}% APY
            </div>
          </div>
          <div>
            <span className="text-zinc-500">Reserve {selectedPool.tokenA.symbol}:</span>
            <div className="font-bold text-zinc-300 font-mono">
              {formatNumber(selectedPool.reserveA, 0)} {selectedPool.tokenA.symbol}
            </div>
          </div>
          <div>
            <span className="text-zinc-500">Reserve {selectedPool.tokenB.symbol}:</span>
            <div className="font-bold text-zinc-300 font-mono">
              {formatNumber(selectedPool.reserveB, 2)} {selectedPool.tokenB.symbol}
            </div>
          </div>
        </div>
      </div>

      {/* Alert / Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300' 
            : 'bg-rose-950/70 border border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-zinc-800 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tiers')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${
            activeTab === 'tiers' 
              ? 'text-amber-400' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Provisioning Packages ($10–$1,000)</span>
          {activeTab === 'tiers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>}
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${
            activeTab === 'custom' 
              ? 'text-amber-400' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Custom Deposit</span>
          {activeTab === 'custom' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>}
        </button>

        <button
          onClick={() => setActiveTab('positions')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${
            activeTab === 'positions' 
              ? 'text-amber-400' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>My Active LP Positions ({userPositions.length})</span>
          {activeTab === 'positions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>}
        </button>

        <button
          onClick={() => setActiveTab('remove')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${
            activeTab === 'remove' 
              ? 'text-amber-400' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MinusCircle className="w-4 h-4" />
          <span>Withdraw Liquidity</span>
          {activeTab === 'remove' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>}
        </button>

        <button
          onClick={() => setActiveTab('affiliate')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${
            activeTab === 'affiliate' 
              ? 'text-amber-400' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Affiliate & Rebates (4 Tiers)</span>
          {activeTab === 'affiliate' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>}
        </button>
      </div>

      {/* Tab 1: Packages ($10, $30, $50, $100, $200, $500, $1000) */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-zinc-300">
            <span className="font-bold text-amber-400">Instant Pre-calibrated Liquidity Packages:</span> Select any tier below to automatically deposit an exact 50/50 ratio of TS Token and BNB into the decentralized liquidity pool router (<span className="font-mono text-zinc-200">{shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}</span>). Receive LP tokens directly to your connected wallet.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierPackages.map((tier) => {
              const half = tier.usd / 2;
              const approxTS = (half / selectedPool.tokenA.priceUsd).toFixed(1);
              const approxBNB = (half / selectedPool.tokenB.priceUsd).toFixed(4);

              return (
                <div
                  key={tier.usd}
                  className="relative p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group shadow-lg"
                >
                  {tier.badge && (
                    <span className="absolute -top-2.5 right-4 bg-amber-500 text-zinc-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow">
                      {tier.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-zinc-400 text-xs font-semibold">{tier.label} Tier</span>
                      <span className="text-2xl font-black text-white">${tier.usd}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-400 py-3 border-y border-zinc-800/80 my-3 font-mono">
                      <div className="flex justify-between">
                        <span>{selectedPool.tokenA.symbol} (50%):</span>
                        <span className="text-emerald-400 font-bold">~{approxTS} TS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{selectedPool.tokenB.symbol} (50%):</span>
                        <span className="text-amber-400 font-bold">~{approxBNB} BNB</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
                        <span>Fee APY Share:</span>
                        <span className="text-zinc-300">0.25% pool cut</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTierClick(tier.usd)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>Activate ${tier.usd} LP Package</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Deposit */}
      {activeTab === 'custom' && (
        <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Supply Dual-Sided Liquidity
          </h3>

          <div className="space-y-3">
            {/* Input Token A */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Input {selectedPool.tokenA.symbol}</span>
                <span>Balance: {wallet.balances[selectedPool.tokenA.symbol]?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={amountA}
                  onChange={(e) => handleAmountAChange(e.target.value)}
                  className="bg-transparent text-xl font-bold text-white focus:outline-none w-2/3"
                  placeholder="0.0"
                />
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold text-emerald-400">
                  {selectedPool.tokenA.symbol}
                </span>
              </div>
            </div>

            <div className="flex justify-center -my-1">
              <div className="p-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                <ArrowDownUp className="w-4 h-4" />
              </div>
            </div>

            {/* Input Token B */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Input {selectedPool.tokenB.symbol}</span>
                <span>Balance: {wallet.balances[selectedPool.tokenB.symbol]?.toFixed(4) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={amountB}
                  onChange={(e) => handleAmountBChange(e.target.value)}
                  className="bg-transparent text-xl font-bold text-white focus:outline-none w-2/3"
                  placeholder="0.0"
                />
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold text-amber-400">
                  {selectedPool.tokenB.symbol}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-zinc-400">
              <span>Current Exchange Rate:</span>
              <span className="text-zinc-200">
                1 {selectedPool.tokenB.symbol} = {(selectedPool.reserveA / selectedPool.reserveB).toFixed(2)} {selectedPool.tokenA.symbol}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Pool Fee Share:</span>
              <span className="text-emerald-400">0.25% distributed to LP tokens</span>
            </div>
          </div>

          <button
            onClick={handleCustomDeposit}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-zinc-950 font-bold text-xs shadow-lg transition-all"
          >
            Supply Liquidity & Mint LP Tokens
          </button>
        </div>
      )}

      {/* Tab 3: Positions */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {userPositions.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 text-xs">
              No active liquidity positions found. Activate a package or deposit liquidity above to start earning protocol fees.
            </div>
          ) : (
            userPositions.map((pos) => {
              const pool = pools.find(p => p.id === pos.poolId) || pools[0];
              return (
                <div key={pos.poolId} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                        LP
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{pool.pairName} Liquidity Position</div>
                        <div className="text-xs text-zinc-400 font-mono">
                          Share of Pool: <span className="text-amber-400 font-bold">{pos.sharePercentage.toFixed(3)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleClaim(pos.poolId)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Claim ${pos.accruedFeesUsd.toFixed(2)} USD</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('remove')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500">Staked {pool.tokenA.symbol}:</span>
                      <div className="font-bold text-zinc-200 mt-0.5">{pos.stakedTokenA.toFixed(2)} {pool.tokenA.symbol}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Staked {pool.tokenB.symbol}:</span>
                      <div className="font-bold text-zinc-200 mt-0.5">{pos.stakedTokenB.toFixed(4)} {pool.tokenB.symbol}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Total Position Value:</span>
                      <div className="font-bold text-white mt-0.5">{formatUSD(pos.currentValueUsd)}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Accrued Swap Fees:</span>
                      <div className="font-bold text-emerald-400 mt-0.5">+{formatUSD(pos.accruedFeesUsd)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 4: Withdraw / Remove Liquidity */}
      {activeTab === 'remove' && (
        <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MinusCircle className="w-5 h-5 text-rose-400" />
            Burn LP Tokens & Withdraw Underlying Assets
          </h3>

          {!currentPosition ? (
            <div className="text-xs text-zinc-400 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              You do not have any active LP tokens in the selected pool ({selectedPool.pairName}).
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-2">
                  <span>Withdrawal Amount</span>
                  <span className="font-mono text-amber-400 font-bold">{removePercent}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setRemovePercent(pct)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        removePercent === pct 
                          ? 'bg-amber-500 text-zinc-950' 
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={removePercent}
                  onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-2">
                <div className="text-zinc-400 font-sans font-semibold mb-1">Estimated Return To Wallet:</div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{selectedPool.tokenA.symbol}:</span>
                  <span className="text-zinc-200">
                    {(currentPosition.stakedTokenA * (removePercent / 100)).toFixed(2)} {selectedPool.tokenA.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{selectedPool.tokenB.symbol}:</span>
                  <span className="text-zinc-200">
                    {(currentPosition.stakedTokenB * (removePercent / 100)).toFixed(4)} {selectedPool.tokenB.symbol}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2 text-emerald-400">
                  <span>+ Accrued Fee Yield:</span>
                  <span>+{formatUSD(currentPosition.accruedFeesUsd * (removePercent / 100))}</span>
                </div>
              </div>

              <button
                onClick={handleRemove}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition-all"
              >
                Confirm Removal & Claim Assets
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Affiliate & Rebate Transparency */}
      {activeTab === 'affiliate' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  Decentralized Affiliate & Volume Rebate Program
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  On-chain referral tracking via router contract. Every trade initiated via your link provides an instant 0.01% trading fee rebate to the trader and protocol rewards to your wallet.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={copyRefLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 shadow transition-all"
                >
                  {copiedRef ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRef ? 'Copied Referral Link!' : 'Copy Link'}</span>
                </button>

                {onGoToReferrals && (
                  <button
                    onClick={onGoToReferrals}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs hover:brightness-110 shadow-md shadow-amber-500/20 transition-all"
                  >
                    <span>Open Referral Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4-Tier Decentralized Structure Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800 pb-2">
                    <th className="py-2 px-3 font-semibold">Tier Level</th>
                    <th className="py-2 px-3 font-semibold">Protocol Reward</th>
                    <th className="py-2 px-3 font-semibold">Trader Swap Rebate</th>
                    <th className="py-2 px-3 font-semibold">Execution Mechanism</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono text-zinc-300">
                  <tr className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-400">Level 1 (Direct)</td>
                    <td className="py-2.5 px-3 text-emerald-400">1.0% volume reward</td>
                    <td className="py-2.5 px-3">0.01% fee cash-back</td>
                    <td className="py-2.5 px-3 text-zinc-400">Smart Contract Atomic Split</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">Active</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-400">Level 2 (Secondary)</td>
                    <td className="py-2.5 px-3 text-emerald-400">0.5% volume reward</td>
                    <td className="py-2.5 px-3">0.01% fee cash-back</td>
                    <td className="py-2.5 px-3 text-zinc-400">Smart Contract Atomic Split</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">Active</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-400">Level 3 (Tertiary)</td>
                    <td className="py-2.5 px-3 text-emerald-400">0.25% volume reward</td>
                    <td className="py-2.5 px-3">0.01% fee cash-back</td>
                    <td className="py-2.5 px-3 text-zinc-400">Smart Contract Atomic Split</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">Active</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-400">Level 4 (Quaternary)</td>
                    <td className="py-2.5 px-3 text-emerald-400">0.10% volume reward</td>
                    <td className="py-2.5 px-3">0.01% fee cash-back</td>
                    <td className="py-2.5 px-3 text-zinc-400">Smart Contract Atomic Split</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">Active</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-200">Decentralized Security Assurance:</span> All affiliate rewards are funded solely from the protocol router's dynamic fee distribution reserve and require zero locked deposits or user sign-ups. Your wallet address serves as your cryptographic identity.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
