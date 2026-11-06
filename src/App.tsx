import React, { useState } from 'react';
import { ProtocolProvider, useProtocol } from './context/ProtocolContext';
import { Navbar } from './components/Navbar';
import { HeaderStats } from './components/HeaderStats';
import { DashboardView } from './components/DashboardView';
import { TradingBotView } from './components/TradingBotView';
import { LiquidityView } from './components/LiquidityView';
import { CalculatorView } from './components/CalculatorView';
import { FinancialStatementsView } from './components/FinancialStatementsView';
import { ReferralCenter } from './components/ReferralCenter';
import { WalletModal } from './components/WalletModal';
import { RechargeModal } from './components/RechargeModal';
import { WithdrawalModal } from './components/WithdrawalModal';
import { AlertsLedgerModal } from './components/AlertsLedgerModal';
import { AuthModal } from './components/AuthModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { AlertToast } from './components/AlertToast';
import { Footer } from './components/Footer';
import { Gift, UserPlus, LogIn, X } from 'lucide-react';

export function AppContent() {
  const { pendingInviteCode, currentUser } = useProtocol();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState<boolean>(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState<boolean>(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login' | 'recover'>('register');
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [dismissInviteBanner, setDismissInviteBanner] = useState<boolean>(false);

  const handleOpenAuth = (mode: 'register' | 'login' | 'recover' = 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenWalletModal={() => setWalletModalOpen(true)} 
        onOpenRechargeModal={() => setRechargeModalOpen(true)}
        onOpenWithdrawalModal={() => setWithdrawalModalOpen(true)}
        onOpenAlertsModal={() => setAlertsModalOpen(true)}
        onOpenDownloadModal={() => setDownloadModalOpen(true)}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Active Referral Invite Banner with Register and Log In Buttons */}
      {pendingInviteCode && !currentUser && !dismissInviteBanner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border-b border-amber-500/30 px-4 py-2.5 text-xs text-zinc-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Gift className="w-4 h-4" />
              </span>
              <span>
                <strong>Referral Link Applied:</strong> Bound to Affiliate Node <span className="font-mono font-bold text-amber-400">{pendingInviteCode}</span>. Complete registration to unlock an instant 0.01% swap fee rebate and activate your 4-tier commission tree.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenAuth('register')}
                className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs shadow flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Register with {pendingInviteCode}</span>
              </button>
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => setDismissInviteBanner(true)}
                className="p-1 text-zinc-400 hover:text-white"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Protocol Analytics Bar */}
      <HeaderStats />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView 
            onGoToBot={() => setActiveTab('bot')} 
            onGoToLiquidity={() => setActiveTab('liquidity')} 
            onOpenRecharge={() => setRechargeModalOpen(true)}
            onOpenWithdrawal={() => setWithdrawalModalOpen(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}
        {activeTab === 'bot' && (
          <TradingBotView 
            onOpenRecharge={() => setRechargeModalOpen(true)}
            onOpenWithdrawal={() => setWithdrawalModalOpen(true)}
          />
        )}
        {activeTab === 'liquidity' && <LiquidityView onGoToReferrals={() => setActiveTab('referrals')} />}
        {activeTab === 'referrals' && <ReferralCenter onOpenAuthModal={handleOpenAuth} />}
        {activeTab === 'calculator' && <CalculatorView />}
        {activeTab === 'statements' && <FinancialStatementsView />}
      </main>

      {/* Web3 Wallet Modal */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)} 
      />

      {/* Recharge Crypto BNB Modal */}
      <RechargeModal
        isOpen={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
      />

      {/* Withdrawal Crypto BNB Modal */}
      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
      />

      {/* Crypto Alerts History Log Modal */}
      <AlertsLedgerModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
      />

      {/* Register / Log In / Recover Modal with Save Passwords */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />

      {/* Floating Real-Time Alert Toast */}
      <AlertToast />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ProtocolProvider>
      <AppContent />
    </ProtocolProvider>
  );
}
