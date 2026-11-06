import React, { useState } from 'react';
import { 
  Bot, 
  Wallet, 
  ExternalLink, 
  Layers, 
  Zap, 
  Calculator, 
  FileText, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  Copy, 
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Share2,
  Download,
  User,
  UserPlus,
  LogIn,
  LogOut,
  Key,
  ShieldCheck
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, shortenAddress } from '../data/constants';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWalletModal: () => void;
  onOpenRechargeModal: () => void;
  onOpenWithdrawalModal: () => void;
  onOpenAlertsModal: () => void;
  onOpenDownloadModal: () => void;
  onOpenAuthModal: (mode?: 'register' | 'login') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenWalletModal,
  onOpenRechargeModal,
  onOpenWithdrawalModal,
  onOpenAlertsModal,
  onOpenDownloadModal,
  onOpenAuthModal
}) => {
  const { 
    wallet, 
    currentBlock, 
    claimFaucet, 
    alerts, 
    currentUser, 
    logoutUser 
  } = useProtocol();

  const [copied, setCopied] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [faucetAlert, setFaucetAlert] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFaucetClick = () => {
    claimFaucet();
    setFaucetAlert(true);
    setTimeout(() => setFaucetAlert(false), 3000);
  };

  const navItems = [
    { id: 'dashboard', label: 'AMM Pools', icon: Layers },
    { id: 'bot', label: 'TS BOT Engine', icon: Bot, badge: 'LIVE' },
    { id: 'liquidity', label: 'Liquidity & Tiers', icon: Zap },
    { id: 'referrals', label: 'Referral Center', icon: Share2, badge: '4-Tier' },
    { id: 'calculator', label: 'Yield & IL Math', icon: Calculator },
    { id: 'statements', label: 'Financial Statements', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Protocol Info */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/20 text-zinc-950 font-black">
              <Bot className="w-6 h-6 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">TS PROTOCOL</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  BNB DEFI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                <span>Contract:</span>
                <span className="text-zinc-300 hover:text-amber-400" onClick={(e) => { e.stopPropagation(); handleCopy(CONTRACTS.TS_TOKEN); }}>
                  {shortAddress(CONTRACTS.TS_TOKEN)}
                </span>
                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500 hover:text-zinc-300" />}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-inner'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Center: Recharge BNB, Withdrawal BNB, Download App, Alerts Bell, Auth, Wallet */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Recharge Crypto Button with BNB Form */}
            <button
              onClick={onOpenRechargeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all border border-amber-300/40"
              title="Recharge Crypto BNB ($10-$1,000 Packages or Custom)"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline font-sans">Recharge</span>
              <span className="font-mono">BNB</span>
            </button>

            {/* Withdrawal Crypto Button with BNB Form */}
            <button
              onClick={onOpenWithdrawalModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-bold text-xs transition-all shadow-sm"
              title="Withdrawal Crypto BNB to BEP-20 Wallet"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline font-sans">Withdrawal</span>
              <span className="font-mono">BNB</span>
            </button>

            {/* Download App Button */}
            <button
              onClick={onOpenDownloadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/50 font-bold text-xs transition-all shadow-sm"
              title="Download TS BOT Mobile App (Android APK / iOS / Desktop)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download App</span>
            </button>

            {/* Crypto Alerts Bell Button */}
            <button
              onClick={onOpenAlertsModal}
              className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors"
              title="Recharge & Withdrawal Alerts Dispatch Log"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-zinc-950 font-mono font-black text-[10px] rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Register / Log In / User Account Badge */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-xs font-semibold text-zinc-200"
                  title="Affiliate Account Profile"
                >
                  <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="hidden xl:inline text-white truncate max-w-[90px]">{currentUser.username}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {currentUser.referralCode}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                    <div className="pb-2 mb-2 border-b border-zinc-800">
                      <div className="font-bold text-white truncate">{currentUser.email}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between mt-0.5">
                        <span>Affiliate Node:</span>
                        <span className="font-mono text-amber-400 font-bold">{currentUser.referralCode}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-zinc-400 mb-3">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Registered Referral Tree Active</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Saved Passwords Vault Active</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-2 pt-1 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          onOpenAuthModal('login');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-between text-[11px] transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-amber-400" />
                          <span>Switch / Log In Another</span>
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          onOpenAuthModal('register');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-between text-[11px] transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Register New Node</span>
                        </span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('referrals');
                          setShowUserMenu(false);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-center border border-amber-500/30"
                      >
                        Referral Center
                      </button>
                      <button
                        onClick={() => {
                          logoutUser();
                          setShowUserMenu(false);
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 flex items-center gap-1 font-semibold"
                        title="Log Out"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Exit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all border border-amber-300/40"
                  title="Create New TS BOT Account & Activate Referral Node"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Register</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-amber-400 text-xs font-bold transition-all shadow-sm"
                  title="Log In with Email & Password"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Log In</span>
                </button>
              </div>
            )}

            {/* Wallet Connect / State Button */}
            {wallet.connected ? (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-xs font-semibold text-zinc-100 transition-all shadow-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-amber-400 font-mono">{wallet.balances.BNB.toFixed(2)} BNB</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {showWalletMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                      <span className="text-xs font-bold text-zinc-300">Connected Wallet</span>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-semibold">
                        {wallet.connector}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-300 font-mono mb-3">
                      <div className="flex justify-between py-1 px-2 rounded bg-zinc-950">
                        <span className="text-zinc-500">BNB Balance:</span>
                        <span className="font-bold text-amber-400">{wallet.balances.BNB.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 rounded bg-zinc-950">
                        <span className="text-zinc-500">TS Token:</span>
                        <span className="font-bold text-emerald-400">{wallet.balances.TS.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 rounded bg-zinc-950">
                        <span className="text-zinc-500">USDT:</span>
                        <span className="font-bold text-cyan-400">{wallet.balances.USDT.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={onOpenWalletModal}
                        className="flex-1 text-[11px] font-semibold py-1.5 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-center"
                      >
                        Switch Wallet
                      </button>
                      <button
                        onClick={handleFaucetClick}
                        className="text-[11px] font-semibold py-1.5 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50"
                      >
                        +Mint
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenWalletModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-2 border-t border-zinc-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

function shortAddress(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
