import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD, formatNumber, shortenAddress, CONTRACTS } from '../data/constants';

export const FinancialStatementsView: React.FC = () => {
  const { financialMetrics, pools, tradeHistory, currentBlock } = useProtocol();
  const [downloadNotice, setDownloadNotice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const totalTvl = pools.reduce((acc, p) => acc + p.tvlUsd, 0);
  const totalVolume24h = pools.reduce((acc, p) => acc + p.volume24h, 0);
  const totalFees24h = pools.reduce((acc, p) => acc + p.fees24h, 0);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Period,Trading Volume (USD),Fees Collected (USD),Distributed to LPs (USD),Active LPs,Total TVL (USD)\n"
      + financialMetrics.map(m => `${m.period},${m.tradingVolume},${m.feesCollected},${m.distributedToLPs},${m.activeLPs},${m.tvl}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TS_Protocol_Financial_Statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  const filteredTrades = tradeHistory.filter(t => 
    t.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tokenIn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tokenOut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Protocol Financial Statements & Ledger
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Real-time on-chain accounting of liquidity pool volumes, fee accrual, LP distributions, and protocol solvency across BNB Chain.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold shadow transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {downloadNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Financial statement report exported successfully!</span>
        </div>
      )}

      {/* Balance Sheet & Income Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="text-xs font-semibold text-zinc-400">Total Protocol TVL (Assets under LP)</div>
          <div className="text-2xl font-black text-white font-mono">{formatUSD(totalTvl)}</div>
          <p className="text-[11px] text-zinc-500">Dual-sided collateral held in audited smart contracts.</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="text-xs font-semibold text-zinc-400">Gross Protocol Fees Collected (24h)</div>
          <div className="text-2xl font-black text-amber-400 font-mono">{formatUSD(totalFees24h)}</div>
          <p className="text-[11px] text-zinc-500">0.25% fee collected on all AMM and bot swaps.</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="text-xs font-semibold text-zinc-400">Net Distributed to Liquidity Providers</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{formatUSD(totalFees24h * 0.8)}</div>
          <p className="text-[11px] text-zinc-500">80% direct LP fee cut; 20% router treasury & rebates.</p>
        </div>
      </div>

      {/* Financial Statement Breakdown Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Income & Distribution Accounting Ledger</span>
          <span className="text-xs font-mono text-zinc-500">Reporting Currency: USD</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800 pb-2">
                <th className="py-2.5 px-3 font-semibold">Accounting Period</th>
                <th className="py-2.5 px-3 font-semibold">Trading Volume</th>
                <th className="py-2.5 px-3 font-semibold">Gross Swap Fees (0.25%)</th>
                <th className="py-2.5 px-3 font-semibold">Distributed to LPs (80%)</th>
                <th className="py-2.5 px-3 font-semibold">Affiliate Rebates & Treasury (20%)</th>
                <th className="py-2.5 px-3 font-semibold">Active LP Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {financialMetrics.map((row) => (
                <tr key={row.period} className="hover:bg-zinc-800/40">
                  <td className="py-3 px-3 font-bold text-white">{row.period}</td>
                  <td className="py-3 px-3 text-amber-400">{formatUSD(row.tradingVolume)}</td>
                  <td className="py-3 px-3 text-white">{formatUSD(row.feesCollected)}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">{formatUSD(row.distributedToLPs)}</td>
                  <td className="py-3 px-3 text-cyan-400">{formatUSD(row.feesCollected - row.distributedToLPs)}</td>
                  <td className="py-3 px-3 text-zinc-400">{row.activeLPs} addresses</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Ledger of Transactions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Audit-Grade On-Chain Transaction Ledger
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tx hash or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800 pb-2">
                <th className="py-2 px-3 font-semibold">Tx Hash</th>
                <th className="py-2 px-3 font-semibold">Block</th>
                <th className="py-2 px-3 font-semibold">Event</th>
                <th className="py-2 px-3 font-semibold">Amount In</th>
                <th className="py-2 px-3 font-semibold">Amount Out</th>
                <th className="py-2 px-3 font-semibold">Protocol Fee (USD)</th>
                <th className="py-2 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {filteredTrades.slice(0, 10).map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 text-zinc-400 hover:text-amber-400 cursor-pointer">
                    <span className="flex items-center gap-1">
                      <span>{shortenAddress(t.txHash)}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">#{t.blockNumber}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : t.type === 'SELL' ? 'bg-rose-500/20 text-rose-400' : 'bg-violet-500/20 text-violet-400'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{t.amountIn.toFixed(3)} {t.tokenIn}</td>
                  <td className="py-2.5 px-3">{t.amountOut.toFixed(3)} {t.tokenOut}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    +${(t.amountIn * (t.tokenIn === 'BNB' ? 614.5 : 3.84) * 0.0025).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Finalized</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
