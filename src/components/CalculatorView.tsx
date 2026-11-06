import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  HelpCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import { calculateImpermanentLoss, formatUSD } from '../data/constants';

export const CalculatorView: React.FC = () => {
  const [initialDepositUsd, setInitialDepositUsd] = useState<number>(1000);
  const [tsPriceChangePct, setTsPriceChangePct] = useState<number>(25); // e.g. +25%
  const [bnbPriceChangePct, setBnbPriceChangePct] = useState<number>(10); // e.g. +10%
  const [holdingDays, setHoldingDays] = useState<number>(30);
  const [poolApyPct, setPoolApyPct] = useState<number>(34.2); // Organic APY

  // Math calculations
  const priceRatioChange = (1 + tsPriceChangePct / 100) / (1 + bnbPriceChangePct / 100);
  const ilPercentage = calculateImpermanentLoss(priceRatioChange);

  // Initial values
  const halfDeposit = initialDepositUsd / 2;
  // HODL value if just kept in wallet
  const hodlTokenAValue = halfDeposit * (1 + tsPriceChangePct / 100);
  const hodlTokenBValue = halfDeposit * (1 + bnbPriceChangePct / 100);
  const totalHodlValue = hodlTokenAValue + hodlTokenBValue;

  // Pool LP Value before fees = HODL Value * (1 - IL)
  const lpPrincipalValue = totalHodlValue * (1 - ilPercentage / 100);
  const ilCostUsd = totalHodlValue - lpPrincipalValue;

  // Fee earnings = initialDeposit * (APY / 365 * days)
  const dailyFeeRate = (poolApyPct / 100) / 365;
  const earnedFeesUsd = initialDepositUsd * dailyFeeRate * holdingDays;

  // Net LP Value
  const netLpValue = lpPrincipalValue + earnedFeesUsd;
  const netProfitLoss = netLpValue - initialDepositUsd;
  const netReturnPct = (netProfitLoss / initialDepositUsd) * 100;
  const lpVsHodlDelta = netLpValue - totalHodlValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          Yield & Impermanent Loss Simulator
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Simulate how price movements impact your decentralized liquidity position. Discover the exact mathematical interplay between trading fee accrual and impermanent loss using the Constant Product AMM formula.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-zinc-800">
            Simulation Parameters
          </h3>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Initial LP Capital</span>
              <span className="font-mono text-white font-bold">{formatUSD(initialDepositUsd)}</span>
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map(val => (
                <button
                  key={val}
                  onClick={() => setInitialDepositUsd(val)}
                  className={`text-[11px] py-1 px-2.5 rounded-lg font-semibold ${
                    initialDepositUsd === val ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
            <input
              type="range"
              min="10"
              max="20000"
              step="10"
              value={initialDepositUsd}
              onChange={(e) => setInitialDepositUsd(parseFloat(e.target.value))}
              className="w-full mt-2 accent-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>TS Token Expected Price Change</span>
              <span className={`font-mono font-bold ${tsPriceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tsPriceChangePct >= 0 ? `+${tsPriceChangePct}%` : `${tsPriceChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-80"
              max="200"
              step="5"
              value={tsPriceChangePct}
              onChange={(e) => setTsPriceChangePct(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>BNB Expected Price Change</span>
              <span className={`font-mono font-bold ${bnbPriceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {bnbPriceChangePct >= 0 ? `+${bnbPriceChangePct}%` : `${bnbPriceChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-80"
              max="200"
              step="5"
              value={bnbPriceChangePct}
              onChange={(e) => setBnbPriceChangePct(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Provisioning Timeframe</span>
              <span className="font-mono text-white font-bold">{holdingDays} Days</span>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90, 180, 365].map(d => (
                <button
                  key={d}
                  onClick={() => setHoldingDays(d)}
                  className={`text-[11px] py-1 px-2.5 rounded-lg font-semibold ${
                    holdingDays === d ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1">
              <span>Estimated Pool Organic APY</span>
              <span className="font-mono text-emerald-400 font-bold">{poolApyPct}% APY</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="1"
              value={poolApyPct}
              onChange={(e) => setPoolApyPct(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        {/* Right Results & Comparison (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Outcome Card */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Projected Position Performance</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                netProfitLoss >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {netProfitLoss >= 0 ? `+${netReturnPct.toFixed(2)}% Net Return` : `${netReturnPct.toFixed(2)}% Net Return`}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[11px] text-zinc-500">Total Net Portfolio:</span>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {formatUSD(netLpValue)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[11px] text-zinc-500">Swap Fees Earned:</span>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  +{formatUSD(earnedFeesUsd)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[11px] text-zinc-500">Impermanent Loss:</span>
                <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                  -{ilPercentage.toFixed(2)}% <span className="text-xs font-normal text-zinc-500">({formatUSD(ilCostUsd)})</span>
                </div>
              </div>
            </div>

            {/* Comparison Table: LP vs HODL */}
            <div className="pt-2">
              <div className="text-xs font-bold text-zinc-300 mb-2">Strategy Comparison:</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800 pb-1.5">
                      <th className="py-1.5 font-semibold">Strategy</th>
                      <th className="py-1.5 font-semibold">Ending Value</th>
                      <th className="py-1.5 font-semibold">Fee Yield</th>
                      <th className="py-1.5 font-semibold">Impermanent Loss</th>
                      <th className="py-1.5 font-semibold">Net PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    <tr className="hover:bg-zinc-800/30">
                      <td className="py-2 text-amber-400 font-bold">TS Liquidity Provider</td>
                      <td className="py-2 text-white font-bold">{formatUSD(netLpValue)}</td>
                      <td className="py-2 text-emerald-400">+{formatUSD(earnedFeesUsd)}</td>
                      <td className="py-2 text-rose-400">-{formatUSD(ilCostUsd)}</td>
                      <td className="py-2 font-bold text-emerald-400">
                        {netProfitLoss >= 0 ? `+${formatUSD(netProfitLoss)}` : formatUSD(netProfitLoss)}
                      </td>
                    </tr>
                    <tr className="hover:bg-zinc-800/30">
                      <td className="py-2 text-zinc-400 font-medium">HODL 50/50 in Wallet</td>
                      <td className="py-2 text-zinc-200">{formatUSD(totalHodlValue)}</td>
                      <td className="py-2 text-zinc-500">$0.00</td>
                      <td className="py-2 text-zinc-500">$0.00</td>
                      <td className="py-2 text-zinc-200">
                        {formatUSD(totalHodlValue - initialDepositUsd)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendation Delta */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-400">Liquidity Provisioning Advantage vs HODL:</span>
              <span className={`font-mono font-bold ${lpVsHodlDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lpVsHodlDelta >= 0 ? `+${formatUSD(lpVsHodlDelta)} (+${((lpVsHodlDelta / initialDepositUsd) * 100).toFixed(2)}%)` : `${formatUSD(lpVsHodlDelta)}`}
              </span>
            </div>
          </div>

          {/* Educational Reality Check Section */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Decentralized Math vs. Deceptive "Guaranteed 4% Daily" Claims</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              In real financial and blockchain systems, genuine yields originate from actual trade counterparty fees. 
              A model promising a fixed "4% daily profit" would mathematically require a pool to generate over 1,980,000% annual returns without trading volume—a classic impossibility that always signals an unsustainable capital-recycling scheme.
            </p>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              By using non-custodial decentralized AMMs, your capital remains provably verifiable on BNB Chain, and yields dynamically reflect real market activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
