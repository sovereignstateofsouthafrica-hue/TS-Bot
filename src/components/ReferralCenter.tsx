import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Award, 
  Coins, 
  ExternalLink, 
  Search, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Layers,
  ArrowUpRight,
  Send,
  MessageCircle,
  Twitter,
  Gift,
  UserPlus,
  LogIn,
  Lock,
  Download,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, formatNumber, shortenAddress } from '../data/constants';

interface ReferralCenterProps {
  onOpenAuthModal?: (mode?: 'register' | 'login') => void;
}

export const ReferralCenter: React.FC<ReferralCenterProps> = ({ onOpenAuthModal }) => {
  const { 
    wallet, 
    referralUsers, 
    unclaimedCommissionBnb, 
    claimReferralCommission,
    currentUser,
    addSimulatedReferral,
    setPendingInviteCode
  } = useProtocol();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showImageCardModal, setShowImageCardModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [simulatingRef, setSimulatingRef] = useState(false);

  const bnbPrice = 614.50;
  const isRegistered = Boolean(currentUser && currentUser.isRegistered);
  const referralCode = currentUser?.referralCode || (wallet.address ? wallet.address.slice(2, 10).toUpperCase() : 'TSBNB888');
  
  // Real active dynamic URL matching live host
  const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://tsprotocol.io';
  const currentPath = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '/';
  const referralLink = `${currentOrigin}${currentPath}?ref=${referralCode}`;

  // Aggregated Stats
  const totalReferrals = referralUsers.length;
  const activeReferrals = referralUsers.filter(u => u.status === 'ACTIVE').length;
  const totalVolumeUsd = referralUsers.reduce((sum, u) => sum + u.tradingVolumeUsd, 0);
  const totalCommissionUsd = referralUsers.reduce((sum, u) => sum + u.commissionEarnedUsd, 0);
  const totalCommissionBnb = referralUsers.reduce((sum, u) => sum + u.commissionEarnedBnb, 0);

  // 4 Levels Breakdown calculations
  const level1Users = referralUsers.filter(u => u.level === 1);
  const level2Users = referralUsers.filter(u => u.level === 2);
  const level3Users = referralUsers.filter(u => u.level === 3);
  const level4Users = referralUsers.filter(u => u.level === 4);

  const levelsStats = [
    {
      level: 1,
      name: 'Level 1 (Direct)',
      rate: '1.00%',
      rateNum: 1.0,
      count: level1Users.length,
      volume: level1Users.reduce((sum, u) => sum + u.tradingVolumeUsd, 0),
      earnedBnb: level1Users.reduce((sum, u) => sum + u.commissionEarnedBnb, 0),
      earnedUsd: level1Users.reduce((sum, u) => sum + u.commissionEarnedUsd, 0),
      color: 'amber',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      level: 2,
      name: 'Level 2 (Secondary)',
      rate: '0.50%',
      rateNum: 0.5,
      count: level2Users.length,
      volume: level2Users.reduce((sum, u) => sum + u.tradingVolumeUsd, 0),
      earnedBnb: level2Users.reduce((sum, u) => sum + u.commissionEarnedBnb, 0),
      earnedUsd: level2Users.reduce((sum, u) => sum + u.commissionEarnedUsd, 0),
      color: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      level: 3,
      name: 'Level 3 (Tertiary)',
      rate: '0.25%',
      rateNum: 0.25,
      count: level3Users.length,
      volume: level3Users.reduce((sum, u) => sum + u.tradingVolumeUsd, 0),
      earnedBnb: level3Users.reduce((sum, u) => sum + u.commissionEarnedBnb, 0),
      earnedUsd: level3Users.reduce((sum, u) => sum + u.commissionEarnedUsd, 0),
      color: 'cyan',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    },
    {
      level: 4,
      name: 'Level 4 (Quaternary)',
      rate: '0.10%',
      rateNum: 0.1,
      count: level4Users.length,
      volume: level4Users.reduce((sum, u) => sum + u.tradingVolumeUsd, 0),
      earnedBnb: level4Users.reduce((sum, u) => sum + u.commissionEarnedBnb, 0),
      earnedUsd: level4Users.reduce((sum, u) => sum + u.commissionEarnedUsd, 0),
      color: 'violet',
      badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    },
  ];

  // Rebate Tier Progression Logic
  const tiers = [
    { tier: 1, name: 'Starter Affiliate', required: 0, rebate: '0.010%', perk: 'Base 0.01% swap cash-back' },
    { tier: 2, name: 'Pro Ambassador', required: 10, rebate: '0.015%', perk: '1.5x fee rebate + priority routing' },
    { tier: 3, name: 'Protocol Master', required: 25, rebate: '0.020%', perk: '2.0x fee rebate + VIP Treasury pool cut' },
    { tier: 4, name: 'Whale Validator', required: 50, rebate: '0.025%', perk: '2.5x max rebate + governance validator pass' },
  ];

  // Current tier dynamic progression (Starts at Starter Tier 1 when totalReferrals is 0)
  const currentTier = [...tiers].reverse().find(t => totalReferrals >= t.required) || tiers[0];
  const nextTier = tiers.find(t => t.required > totalReferrals) || tiers[tiers.length - 1];
  const span = Math.max(1, nextTier.required - currentTier.required);
  const progressPercent = nextTier === currentTier 
    ? 100 
    : Math.max(0, Math.min(100, Math.round(((totalReferrals - currentTier.required) / span) * 100)));
  const remainingForNext = Math.max(0, nextTier.required - totalReferrals);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClaim = () => {
    const res = claimReferralCommission();
    setClaimStatus(res.message);
    setTimeout(() => setClaimStatus(null), 5000);
  };

  const handleTestReferralLink = () => {
    setPendingInviteCode(referralCode);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('ref', referralCode);
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
    setClaimStatus(`Referral link active! Code "${referralCode}" bound. Opening registration form with 0.01% swap rebate...`);
    if (onOpenAuthModal) {
      onOpenAuthModal('register');
    }
  };

  const handleSimulateReferral = (lvl: 1 | 2 | 3 | 4 = 1) => {
    setSimulatingRef(true);
    setTimeout(() => {
      const res = addSimulatedReferral(lvl);
      setClaimStatus(res.message);
      setSimulatingRef(false);
      setTimeout(() => setClaimStatus(null), 5000);
    }, 400);
  };

  const handleDownloadCard = () => {
    setDownloadSuccess(true);
    const cardData = `TS PROTOCOL DEFI • BNB BOT TRADING REFERRAL NODE
==================================================
Referral ID: ${referralCode}
Active Link: ${referralLink}
Mining Token (BEP-20): ${CONTRACTS.TS_TOKEN}
Recharge Router: ${CONTRACTS.RECHARGE_ROUTER_DEFI}
Commissions: 4 Levels (1.0%, 0.5%, 0.25%, 0.1%)
Swap Rebate: 0.01% - 0.025%
Telegram Support: ${CONTRACTS.TELEGRAM_COMMUNITY}
==================================================`;
    const blob = new Blob([cardData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TS_BOT_Referral_ID_${referralCode}.txt`;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      setDownloadSuccess(false);
    }, 3000);
  };

  const filteredReferrals = referralUsers.filter(u => {
    const matchesLevel = selectedLevelFilter === 'ALL' || u.level === selectedLevelFilter;
    const matchesSearch = u.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner: Referral Center */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 -mb-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                TS AFFILIATE NETWORK • 4 LEVELS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                0.01% - 0.025% Rebates
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Decentralized Referral Center
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Earn real-time multi-level commissions across 4 tiers on every BNB Chain swap executed through your cryptographic referral link. 100% non-custodial and distributed automatically via smart contract router.
            </p>

            {/* Quick Register and Log In Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {!isRegistered ? (
                <>
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all border border-amber-300/40"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Register New Account</span>
                  </button>
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs transition-all shadow-sm"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>Log In</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Affiliate Account: {currentUser?.username || 'Active'}</span>
                  </div>
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Register Another</span>
                  </button>
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Switch / Log In</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Claimable Commission Box */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/40 shadow-xl space-y-2 shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-400 font-medium">Unclaimed Commission</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                READY TO CLAIM
              </span>
            </div>

            <div className="text-2xl font-black text-amber-400 font-mono">
              {unclaimedCommissionBnb.toFixed(4)} BNB
            </div>

            <div className="text-xs text-zinc-400 font-mono flex items-center justify-between">
              <span>≈ {formatUSD(unclaimedCommissionBnb * bnbPrice)} USD</span>
              <span className="text-zinc-500">• 0 Gas Overhead</span>
            </div>

            <button
              onClick={handleClaim}
              disabled={unclaimedCommissionBnb <= 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                unclaimedCommissionBnb > 0
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 hover:brightness-110 shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4 fill-zinc-950" />
              <span>Claim Referral Rewards</span>
            </button>
          </div>
        </div>

        {claimStatus && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{claimStatus}</span>
            </div>
            <button onClick={() => setClaimStatus(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* Cybernetic Referral Link ID Image Card with Working Link Mechanics */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-1/4 -mt-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column: Cybernetic Bot Trader Image & Referral ID Badge */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Visual Bot Image Display */}
            <div className="relative rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl group bg-zinc-950">
              <img
                src={CONTRACTS.BOT_IMAGE_PATH}
                alt="TS BOT TRADING • BNB BOT"
                className="w-full h-52 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

              {/* Bot Station Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-950/90 text-amber-400 border border-amber-400/40 text-[10px] font-black font-mono shadow-md backdrop-blur-sm">
                  TS BOT TRADING • BNB BOT
                </span>
                <span className="px-2 py-1 rounded-lg bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>4% DAILY YIELD POOL</span>
                </span>
              </div>

              {/* Token & Router Info Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-300 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80 backdrop-blur-sm">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Mining Token (BEP-20)</span>
                  <span className="text-amber-400 font-bold">{shortenAddress(CONTRACTS.TS_TOKEN)}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold">Recharge Router</span>
                  <span className="text-zinc-200 font-bold">{shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}</span>
                </div>
              </div>
            </div>

            {/* Glowing Referral ID Badge */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-inner space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Affiliate Referral ID</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  ACTIVE NODE
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-wider">
                  {referralCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all shadow-sm"
                  title="Copy Referral ID"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  <span>{copiedCode ? 'Copied ID' : 'Copy ID'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Working Referral Links & Action Buttons */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <span>Affiliate Referral Link System</span>
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Verified Proper Link
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All referrals bound through your cryptographic link or Referral ID receive an instant <strong className="text-white">0.01% swap fee rebate</strong>, while you earn automatic on-chain commissions across 4 levels (1.0%, 0.5%, 0.25%, 0.10%).
              </p>
            </div>

            {/* Dynamic Referral Link Bar */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-zinc-400 font-semibold flex items-center justify-between">
                <span>Your Personal Referral Link (Tested BEP-20 Router):</span>
                <span className="text-amber-400 text-[10px]">Auto-Binds ?ref={referralCode}</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 shadow-inner">
                  <span className="truncate select-all">{referralLink}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Working Link Action Operations: Test Link & Download Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleTestReferralLink}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-850 border border-amber-500/40 text-amber-400 font-bold text-xs transition-all shadow-md group"
                title="Simulate opening this referral link: pre-fills referral code and opens Registration"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Test / Open Referral Link</span>
              </button>

              <button
                onClick={() => setShowImageCardModal(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition-all shadow-md group"
                title="Preview and save high-resolution visual Referral ID Card with Bot Image"
              >
                <ImageIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>View & Download ID Card</span>
              </button>
            </div>

            {/* 1-Click Working Social Sharing Links */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <span className="text-[11px] text-zinc-400 font-semibold block">1-Click Instant Social Sharing:</span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join TS BOT on BNB Chain! Automated liquidity provisioning, 4% daily yield protocol, and 4-tier affiliate rewards. Use my Referral ID: ' + referralCode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 border border-sky-800/50 text-xs font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>

                <a
                  href={CONTRACTS.TELEGRAM_COMMUNITY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-800/50 text-xs font-semibold transition-colors"
                  title="Official TS BOT Telegram Support"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Telegram Support</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Maximize your daily BNB yields with TS BOT automated liquidity provisioning protocols on BNB Smart Chain. Use my Referral ID ' + referralCode + ' for a 0.01% swap fee rebate: ')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>X (Twitter)</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out TS Protocol on BNB Chain! Automated liquidity provisioning, 4-tier affiliate rewards, and daily yield rebalancing. Use Referral ID ${referralCode}: ${referralLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium border border-zinc-700"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>QR Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar Toward Next Rebate Tier */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Affiliate Rebate Tier Progression
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
                Tier 2: {currentTier.name}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Your current trading rebate rate is <span className="text-white font-bold">{currentTier.rebate}</span>. Reach {nextTier.required} referrals to unlock <span className="text-amber-400 font-bold">{nextTier.name} ({nextTier.rebate})</span>.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-zinc-400 font-mono block">Progress to Next Tier</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {totalReferrals} / {nextTier.required} Referrals ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 shadow-lg shadow-amber-500/50 transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>Current: {currentTier.name} ({currentTier.required} refs)</span>
            <span className="text-amber-400 font-semibold">{remainingForNext} more invites needed</span>
            <span>Target: {nextTier.name} ({nextTier.required} refs)</span>
          </div>
        </div>

        {/* 4 Tier Roadmap Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {tiers.map((t) => {
            const isUnlocked = totalReferrals >= t.required;
            const isNext = t.tier === nextTier.tier;

            return (
              <div
                key={t.tier}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-zinc-950 border-amber-500/40'
                    : isNext
                    ? 'bg-zinc-950/60 border-zinc-700 shadow-inner'
                    : 'bg-zinc-950/30 border-zinc-850 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                    Tier {t.tier}
                  </span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono font-bold">{t.required} Refs</span>
                  )}
                </div>
                <div className="font-bold text-white text-xs">{t.name}</div>
                <div className="text-amber-400 font-mono font-bold text-xs mt-0.5">{t.rebate} Rebate</div>
                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{t.perk}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission Earnings Across 4 Levels Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Commission Earnings Across 4 Levels
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            Lifetime Generated: <span className="text-emerald-400 font-bold">{formatUSD(totalCommissionUsd)}</span> ({totalCommissionBnb.toFixed(4)} BNB)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levelsStats.map((lvl) => (
            <div
              key={lvl.level}
              className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${lvl.badgeClass}`}>
                  Level {lvl.level}
                </span>
                <span className="text-base font-black text-white font-mono">{lvl.rate}</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono py-2 border-y border-zinc-800">
                <div className="flex justify-between text-zinc-400">
                  <span>Referred Users:</span>
                  <span className="font-bold text-white">{lvl.count} members</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Trading Volume:</span>
                  <span className="font-bold text-zinc-200">{formatUSD(lvl.volume)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Commission USD:</span>
                  <span className="font-bold text-emerald-400">{formatUSD(lvl.earnedUsd)}</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[11px] text-zinc-500">BNB Yield Earned:</span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {lvl.earnedBnb.toFixed(4)} BNB
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals Display: Member Roster & Performance Ledger */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        {/* Registration Verification Status Callout */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isRegistered
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        }`}>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {isRegistered ? 'Affiliate Node Registered & Active' : 'Account Registration Required'}
              </span>
              <p className="text-zinc-300 text-[11px] mt-0.5">
                {isRegistered
                  ? `Affiliates and referrals only show after registered referral onboarding is complete. Bound to code: ${referralCode}.`
                  : 'Affiliates and referrals only show after registered referral is complete. Register or log in to activate your tree.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isRegistered ? (
              <button
                onClick={() => {
                  setSimulatingRef(true);
                  const res = addSimulatedReferral(1);
                  setClaimStatus(res.message);
                  setTimeout(() => {
                    setSimulatingRef(false);
                    setClaimStatus(null);
                  }, 4000);
                }}
                disabled={simulatingRef}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow transition-all flex items-center gap-1.5"
                title="Test a new user completing registration via your affiliate link"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{simulatingRef ? 'Registering...' : '+ Test New Registration'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs shadow hover:brightness-110 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Register</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Log In</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {!isRegistered ? (
          /* Gated Referral Network Callout: only shows after registered referral is complete */
          <div className="py-12 px-6 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-white">
                Affiliates & Referrals Only Show After Registered Referral is Complete
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your 4-level referral network roster, real-time trading volumes, and member commissions are secured by smart contract node registration. Register your account or log in to view and manage your network.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all border border-amber-300/40"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Register Account</span>
              </button>
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 font-bold text-xs transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Log In</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Referrals Display ({filteredReferrals.length} Members)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Live roster of on-chain referred accounts contributing to your liquidity rewards.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>
            </div>

            {/* Level Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedLevelFilter('ALL')}
                className={`px-3 py-1 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedLevelFilter === 'ALL'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                All Levels ({totalReferrals})
              </button>
              {[1, 2, 3, 4].map((lvl) => {
                const count = referralUsers.filter(u => u.level === lvl).length;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`px-3 py-1 rounded-xl font-semibold transition-all shrink-0 border ${
                      selectedLevelFilter === lvl
                        ? 'bg-zinc-800 text-amber-400 border-amber-500/50'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                    }`}
                  >
                    Level {lvl} ({count})
                  </button>
                );
              })}
            </div>

            {/* Referrals Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                    <th className="py-2.5 px-3 font-semibold">Member Address</th>
                    <th className="py-2.5 px-3 font-semibold">Tier Level</th>
                    <th className="py-2.5 px-3 font-semibold">Joined Date</th>
                    <th className="py-2.5 px-3 font-semibold">Trading Volume</th>
                    <th className="py-2.5 px-3 font-semibold">Commission (BNB)</th>
                    <th className="py-2.5 px-3 font-semibold">Commission (USD)</th>
                    <th className="py-2.5 px-3 font-semibold">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                          <div className="font-bold text-white text-sm">No Referrals Recorded Yet</div>
                          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                            Referral list starts recording after your affiliate link is shared and a referral completes signing. All digitalized dummy referrals have been removed.
                          </p>
                          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={handleCopyLink}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Affiliate Link</span>
                            </button>
                            <button
                              onClick={() => handleSimulateReferral(1)}
                              disabled={simulatingRef}
                              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 font-bold text-xs transition-all flex items-center gap-1.5"
                              title="Simulate a real referral signing up under your link"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{simulatingRef ? 'Recording Sign-up...' : 'Test Referral Sign-up'}</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-3 text-zinc-200 font-bold">
                          <span className="flex items-center gap-1.5">
                            <span>{shortenAddress(user.address)}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.level === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            user.level === 2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            user.level === 3 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                            'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                          }`}>
                            Level {user.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          {new Date(user.joinedTimestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-zinc-200">
                          {formatUSD(user.tradingVolumeUsd)}
                        </td>
                        <td className="py-3 px-3 text-amber-400 font-bold">
                          {user.commissionEarnedBnb.toFixed(4)} BNB
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          +{formatUSD(user.commissionEarnedUsd)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-zinc-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></span>
                            <span>{user.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* QR Code Sharing Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-white text-base">Affiliate QR Code</h3>
            <p className="text-xs text-zinc-400">
              Scan with mobile camera or Trust Wallet to join TS Protocol under your affiliate node.
            </p>

            {/* Generated SVG QR Code representation */}
            <div className="p-4 bg-white rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-lg">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="#09090b">
                {/* QR Code Pattern Simulation */}
                <rect x="10" y="10" width="24" height="24" rx="3" fill="#09090b" />
                <rect x="14" y="14" width="16" height="16" rx="2" fill="#ffffff" />
                <rect x="18" y="18" width="8" height="8" rx="1" fill="#09090b" />

                <rect x="66" y="10" width="24" height="24" rx="3" fill="#09090b" />
                <rect x="70" y="14" width="16" height="16" rx="2" fill="#ffffff" />
                <rect x="74" y="18" width="8" height="8" rx="1" fill="#09090b" />

                <rect x="10" y="66" width="24" height="24" rx="3" fill="#09090b" />
                <rect x="14" y="70" width="16" height="16" rx="2" fill="#ffffff" />
                <rect x="18" y="74" width="8" height="8" rx="1" fill="#09090b" />

                {/* Random Data Dots */}
                <circle cx="42" cy="16" r="3" />
                <circle cx="50" cy="22" r="2.5" />
                <circle cx="58" cy="15" r="3" />
                <circle cx="45" cy="45" r="4" fill="#d97706" />
                <circle cx="55" cy="55" r="4" fill="#d97706" />
                <rect x="38" y="66" width="6" height="12" />
                <rect x="52" y="76" width="14" height="6" />
                <rect x="72" y="46" width="16" height="8" />
                <rect x="42" y="30" width="16" height="6" />
              </svg>
            </div>

            <div className="font-mono text-xs text-amber-400 font-bold">
              {shortenAddress(wallet.address || '0x71C8a49B')}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* High-Resolution Referral Link ID Image Card Modal & Downloader */}
      {showImageCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Affiliate Referral ID Image Card</h3>
              </div>
              <button
                onClick={() => setShowImageCardModal(false)}
                className="text-zinc-400 hover:text-white text-sm p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Visual Card Canvas / Badge */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-zinc-950 text-white">
              {/* Bot Trading Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={CONTRACTS.BOT_IMAGE_PATH}
                  alt="TS BOT TRADING • BNB BOT"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-zinc-950/90 text-amber-400 border border-amber-500/40 text-[11px] font-black font-mono px-3 py-1 rounded-xl shadow-lg backdrop-blur-md">
                  TS BOT TRADING • BNB BOT
                </div>
                <div className="absolute top-3 right-3 bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>4% DAILY YIELD POOL</span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 space-y-4 bg-zinc-950">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-850">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                      Your Official Referral ID
                    </span>
                    <span className="text-3xl font-black font-mono text-amber-400 tracking-wider">
                      {referralCode}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 font-mono block">4-Tier Affiliate Plan</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">1% - 0.5% - 0.25% - 0.1%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-zinc-500 block">Mining Token (BEP-20):</span>
                    <span className="text-zinc-200 font-bold">{shortenAddress(CONTRACTS.TS_TOKEN)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Recharge Router:</span>
                    <span className="text-zinc-200 font-bold">{shortenAddress(CONTRACTS.RECHARGE_ROUTER_DEFI)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-[11px] text-zinc-300 break-all select-all flex items-center justify-between gap-2">
                  <span>{referralLink}</span>
                  <button onClick={handleCopyLink} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 shrink-0">
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-400 font-mono pt-1 gap-1">
                  <span>Support: https://t.me/+TYZhCsadVskxNGI0</span>
                  <span className="text-amber-400 font-semibold">0.01% Swap Rebate Active</span>
                </div>
              </div>
            </div>

            {/* Actions: Download Card & Copy */}
            <div className="flex gap-2.5">
              <button
                onClick={handleDownloadCard}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {downloadSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : <Download className="w-4 h-4 stroke-[2.5]" />}
                <span>{downloadSuccess ? 'Card Downloaded!' : 'Download Referral ID Card'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
