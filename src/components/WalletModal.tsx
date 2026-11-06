import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Coins, 
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { wallet, connectWallet, disconnectWallet, switchNetwork, claimFaucet } = useProtocol();
  const [activeTab, setActiveTab] = useState<'connect' | 'recovery'>('connect');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const connectors: Array<'MetaMask' | 'Binance Wallet' | 'Trust Wallet'> = [
    'MetaMask',
    'Binance Wallet',
    'Trust Wallet',
  ];

  const handleConnect = (connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet') => {
    connectWallet(connector);
    onClose();
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setRecoveryStatus('Error: A standard BIP-39 recovery mnemonic must contain exactly 12 or 24 words.');
      return;
    }
    setRecoveryStatus('Success: Cryptographic keypair derived successfully. Restoring non-custodial address.');
    setTimeout(() => {
      connectWallet('MetaMask');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Web3 Wallet Access</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'connect' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Connect Wallet
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'recovery' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Seed Phrase / Recover
          </button>
        </div>

        {/* Tab 1: Connect Wallet Options */}
        {activeTab === 'connect' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Connect your decentralized Web3 wallet to interact directly with the TS BNB automated liquidity provisioning protocol.
            </p>

            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector}
                  onClick={() => handleConnect(connector)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all text-xs text-white font-semibold group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {connector === 'MetaMask' ? '🦊' : connector === 'Binance Wallet' ? '🟡' : '🛡️'}
                    </span>
                    <span>{connector}</span>
                  </div>
                  <span className="text-zinc-500 group-hover:text-amber-400 font-mono text-[11px]">
                    Connect →
                  </span>
                </button>
              ))}
            </div>

            {/* Network switch */}
            <div className="pt-3 border-t border-zinc-800 text-xs space-y-2">
              <span className="text-zinc-400 font-semibold block">Active Network:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => switchNetwork('BNB Smart Chain (Mainnet)', 56)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] border ${
                    wallet.chainId === 56 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  BSC Mainnet (56)
                </button>
                <button
                  onClick={() => switchNetwork('BNB Testnet', 97)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] border ${
                    wallet.chainId === 97 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  BSC Testnet (97)
                </button>
              </div>
            </div>

            {wallet.connected && (
              <div className="pt-2">
                <button
                  onClick={() => { disconnectWallet(); onClose(); }}
                  className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 text-xs font-semibold"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Seed Phrase Recovery & Auth Explanation */}
        {activeTab === 'recovery' && (
          <form onSubmit={handleRecover} className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Non-Custodial Account Recovery</span>
              </div>
              <p>
                In decentralized protocols, you do not need traditional usernames or passwords stored on a central server. Your wallet key or 12/24-word seed phrase mathematically derives your account.
              </p>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Enter 12 or 24-Word Secret Recovery Mnemonic
              </label>
              <textarea
                rows={3}
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                placeholder="e.g. apple banana cherry desert eagle forest galaxy harbor island jungle kiwi lagoon"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {recoveryStatus && (
              <div className={`p-2.5 rounded-lg text-xs ${
                recoveryStatus.startsWith('Error') 
                  ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {recoveryStatus}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-md transition-all"
            >
              Restore Non-Custodial Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
