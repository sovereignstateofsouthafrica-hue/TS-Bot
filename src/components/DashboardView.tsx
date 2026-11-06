import React, { useState } from 'react';
import { 
  Layers, 
  ArrowRight, 
  ArrowDownUp, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink, 
  Activity,
  Sliders,
  ShieldCheck,
  Zap,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, formatNumber, shortenAddress, calculateAmountOut, CONTRACTS } from '../data/constants';

interface DashboardViewProps {
  onGoToBot: () => void;
  onGoToLiquidity: () => void;
  onOpenRecharge?: () => void;
  onOpenWithdrawal?: () => void;
  onOpenAuth?: (mode: 'register' | 'login') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onGoToBot, 
  onGoToLiquidity,
  onOpenRecharge,
  onOpenWithdrawal,
  onOpenAuth 
}) => {
  const { 
    pools, 
    selectedPool, 
    setSelectedPoolId, 
    wallet, 
    executeManualSwap, 
    currentUser,
    rechargeBalance,
    rechargeBalanceUsd,
    hasRecharged,
    accumulatedMiningYieldBnb,
    claimMiningYield
  } = useProtocol();

  // Swap State
  const [fromToken, setFromToken] = useState<'TS' | 'BNB'>('BNB');
  const [swapAmount, setSwapAmount] = useState<string>('0.5');
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const handleClaimMining = () => {
    const res = claimMiningYield();
    setClaimMsg(res.message);
    setTimeout(() => setClaimMsg(null), 5000);
  };

  const numAmount = parseFloat(swapAmount) || 0;
  const isFromTokenA = fromToken === selectedPool.tokenA.symbol;
  const reserveIn = isFromTokenA ? selectedPool.reserveA : selectedPool.reserveB;
  const reserveOut = isFromTokenA ? selectedPool.reserveB : selectedPool.reserveA;

  const quote = calculateAmountOut(numAmount, reserveIn, reserveOut, selectedPool.feeRate);
  const toToken = fromToken === 'TS' ? 'BNB' : 'TS';

  const handleSwap = () => {
    if (numAmount <= 0) {
      setSwapError('Please enter a valid swap amount');
      return;
    }
    const res = executeManualSwap(selectedPool.id, fromToken, numAmount);
    if (res.success) {
      setSwapSuccess(res.message);
      setSwapError(null);
    } else {
      setSwapError(res.message);
      setSwapSuccess(null);
    }
    setTimeout(() => {
      setSwapSuccess(null);
      setSwapError(null);
    }, 5000);
  };

  const toggleDirection = () => {
    setFromToken(fromToken === 'TS' ? 'BNB' : 'TS');
  };

  return (
    <div className="space-y-6">
      {/* Featured Dashboard Recharge Balance Command Card */}
      <div className={`p-6 rounded-3xl border shadow-2xl transition-all ${
        hasRecharged 
          ? 'bg-gradient-to-br from-zinc-900 via-amber-950/20 to-zinc-900 border-amber-500/50 shadow-amber-500/10'
          : 'bg-zinc-900/95 border-zinc-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                hasRecharged
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${hasRecharged ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`}></span>
                {hasRecharged ? 'ACTIVE MINING • 4.00% DAILY YIELD PROTOCOL' : 'AWAITING RECHARGE • TRADING FIGURES INACTIVE'}
              </span>
              <span className="text-zinc-600 text-xs hidden sm:inline">•</span>
              <span className="text-zinc-400 text-xs font-mono hidden sm:inline">
                Router: {shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Dashboard Recharge Balance:
              </span>
              <div className="flex flex-wrap items-baseline gap-3 mt-1">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {rechargeBalance.toFixed(4)} <span className="text-amber-400">BNB</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-zinc-400 font-mono">
                  ({formatUSD(rechargeBalanceUsd)})
                </div>
              </div>
            </div>

            {hasRecharged ? (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-300 font-mono">
                <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">4% Daily Yield:</span>
                  <span className="text-emerald-400 font-bold">
                    +{(rechargeBalance * 0.04).toFixed(4)} BNB/day ({formatUSD(rechargeBalance * 0.04 * 614.5)})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Accumulated Mining Profit:</span>
                  <span className="text-amber-400 font-bold">
                    {accumulatedMiningYieldBnb.toFixed(6)} BNB
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed max-w-xl">
                <strong className="text-amber-300 font-semibold block mb-0.5">Zero figures before recharging:</strong>
                Active figures of trading and mining start after recharging. Confirm a BNB recharge package ($10 - $1,000) to activate the TS BNB trading bot and 4% daily profit protocol.
              </div>
            )}
          </div>

          {/* Action buttons on the Recharge Balance card */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenRecharge && (
              <button
                onClick={onOpenRecharge}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Coins className="w-4 h-4 fill-zinc-950" />
                <span>{hasRecharged ? 'Recharge More BNB' : 'Recharge BNB Packages ($10 - $1000)'}</span>
              </button>
            )}

            {hasRecharged && (
              <button
                onClick={handleClaimMining}
                className="px-4 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
                title="Claim accumulated 4% mining profit directly to your wallet"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Claim Mining Profit ({accumulatedMiningYieldBnb.toFixed(4)} BNB)</span>
              </button>
            )}

            {onOpenWithdrawal && (
              <button
                onClick={onOpenWithdrawal}
                className="px-4 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-850 text-emerald-400 border border-zinc-750 font-bold text-xs transition-all shadow-md"
              >
                Withdrawal BNB
              </button>
            )}
          </div>
        </div>

        {claimMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{claimMsg}</span>
          </div>
        )}
      </div>

      {/* Featured TS BOT Image Station Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold font-mono">
                BNB CHAIN • LIVE TELEMETRY
              </span>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                hasRecharged ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${hasRecharged ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`}></span>
                <span>{hasRecharged ? 'Auto Trading Active (4% Daily Profit)' : 'Awaiting Recharge to Start Trading'}</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              TS BOT Automated Yield & Liquidity Station
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maximized daily yields on TS BNB pair (<span className="text-zinc-200 font-mono">0x639E8A...</span>) through algorithmic arbitrage routing and continuous fee distribution.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {onOpenRecharge && (
                <button
                  onClick={onOpenRecharge}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Recharge BNB</span>
                </button>
              )}
              {onOpenWithdrawal && (
                <button
                  onClick={onOpenWithdrawal}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 font-bold text-xs transition-all"
                >
                  Withdrawal BNB
                </button>
              )}
              <button
                onClick={onGoToBot}
                className="px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <span>Launch Bot Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {!currentUser && onOpenAuth && (
                <>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                    title="Register New Account & Node"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Register</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                    title="Log In"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>Log In</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bot visual thumbnail */}
          <div 
            onClick={onGoToBot}
            className="relative w-full md:w-80 h-44 rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl cursor-pointer group shrink-0"
          >
            <img
              src={CONTRACTS.BOT_IMAGE_PATH}
              alt="TS BOT Autonomous Trading Station"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono font-bold bg-zinc-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
              <span className="text-amber-400">TS BOT TRADING</span>
              <span className={hasRecharged ? 'text-emerald-400' : 'text-zinc-400'}>
                {hasRecharged ? 'ONLINE V3.2' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner with Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Pools Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Active AMM Liquidity Pools on BNB Chain
            </h2>
            <span className="text-xs text-zinc-400 font-mono">0.25% Protocol Swap Fee</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pools.map((pool) => {
              const totalApy = pool.apyBase + pool.apyReward;
              const isSelected = selectedPool.id === pool.id;

              return (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPoolId(pool.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-500/70 shadow-xl shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm">
                        <span>{pool.tokenA.icon}</span>
                        <span>{pool.tokenB.icon}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{pool.pairName}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{pool.feeRate * 100}% Fee Tier</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase">Organic APY</span>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {totalApy.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono py-2.5 border-y border-zinc-800/80 my-2">
                    <div className="flex justify-between text-zinc-400">
                      <span>Total TVL:</span>
                      <span className="font-bold text-white">{formatUSD(pool.tvlUsd)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>24h Volume:</span>
                      <span className="text-amber-400 font-bold">{formatUSD(pool.volume24h)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>24h LP Fees:</span>
                      <span className="text-cyan-400 font-bold">{formatUSD(pool.fees24h)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-zinc-500 font-mono">
                      {shortenAddress(pool.contractAddress)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoolId(pool.id);
                        onGoToLiquidity();
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>Supply LP</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Constant Product Market Maker Visualization */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Decentralized Bonding Curve Visualizer ($x \cdot y = k$)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                k = {(selectedPool.reserveA * selectedPool.reserveB / 1e6).toFixed(2)}M
              </span>
            </div>

            {/* SVG Hyperbola Curve Graph */}
            <div className="h-44 w-full bg-zinc-950 rounded-xl p-3 relative flex items-center justify-center border border-zinc-800/80">
              <svg className="w-full h-full" viewBox="0 0 400 140" fill="none">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="380" y2="20" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="380" y2="60" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="380" y2="100" stroke="#27272a" strokeDasharray="3 3" />
                
                {/* Axes */}
                <line x1="40" y1="10" x2="40" y2="120" stroke="#52525b" strokeWidth="1.5" />
                <line x1="40" y1="120" x2="380" y2="120" stroke="#52525b" strokeWidth="1.5" />

                {/* Hyperbolic AMM Curve (x * y = k) */}
                <path
                  d="M 50 20 Q 90 90 360 115"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  fill="none"
                />

                {/* Equilibrium point */}
                <circle cx="160" cy="85" r="5" fill="#10b981" stroke="#09090b" strokeWidth="2" />
                <text x="175" y="80" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Equilibrium (${selectedPool.tokenA.priceUsd.toFixed(2)})
                </text>

                {/* Labels */}
                <text x="45" y="15" fill="#71717a" fontSize="9" fontFamily="monospace">Reserve Y (BNB)</text>
                <text x="320" y="132" fill="#71717a" fontSize="9" fontFamily="monospace">Reserve X (TS)</text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Dynamic automated price discovery without centralized bookkeepers.</span>
              <button
                onClick={onGoToBot}
                className="text-amber-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Real-Time Bot Execution</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Decentralized Instant Swap Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Decentralized AMM Swap
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                Router V2
              </span>
            </div>

            {swapSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                {swapSuccess}
              </div>
            )}
            {swapError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {swapError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {/* Pay token */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>You Pay</span>
                  <span>Bal: {wallet.balances[fromToken]?.toFixed(2)} {fromToken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="bg-transparent text-xl font-bold text-white focus:outline-none w-2/3"
                    placeholder="0.0"
                  />
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold text-amber-400">
                    {fromToken}
                  </span>
                </div>
              </div>

              {/* Invert button */}
              <div className="flex justify-center -my-1">
                <button
                  onClick={toggleDirection}
                  className="p-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowDownUp className="w-4 h-4" />
                </button>
              </div>

              {/* Receive token */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>You Receive (Estimated)</span>
                  <span>Bal: {wallet.balances[toToken]?.toFixed(2)} {toToken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {quote.amountOut.toFixed(4)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-200">
                    {toToken}
                  </span>
                </div>
              </div>

              {/* Price details */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Price Impact:</span>
                  <span className={`font-semibold ${quote.priceImpact > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidity Provider Fee:</span>
                  <span>0.25% ({(numAmount * 0.0025).toFixed(4)} {fromToken})</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Gas:</span>
                  <span className="text-zinc-300">~0.00045 BNB (~$0.28)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleSwap}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
            >
              Swap via TS AMM Router
            </button>

            <button
              onClick={onGoToLiquidity}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Provide Liquidity to Earn Fees</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
