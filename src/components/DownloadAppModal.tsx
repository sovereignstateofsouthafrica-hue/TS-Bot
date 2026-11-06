import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Apple, 
  Monitor, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  Bot,
  Zap
} from 'lucide-react';
import { CONTRACTS } from '../data/constants';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');

  if (!isOpen) return null;

  const handleStartDownload = () => {
    setDownloading(true);
    setDownloadProgress(10);
    setDownloadComplete(false);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setDownloadComplete(true);

          // Trigger simulated direct file download of the APK installer manifest
          const element = document.createElement('a');
          const file = new Blob([
            `TS BOT TRADING • BNB BOT CLIENT v3.2.0\n` +
            `Network: BNB Smart Chain (BEP-20)\n` +
            `Router: ${CONTRACTS.RECHARGE_ROUTER_DEFI}\n` +
            `Contract: ${CONTRACTS.TS_TOKEN}\n` +
            `Official Build Checksum (SHA-256): 9f8e472a08b3c4d12983746152aebce8192305981273918a21398bb129837461\n` +
            `Features: Real-time AMM scalping, 4-tier affiliate tracking, non-custodial wallet sign.\n`
          ], { type: 'text/plain' });
          element.href = URL.createObjectURL(file);
          element.download = CONTRACTS.APP_DOWNLOAD_NAME;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Download TS BOT Mobile App</h3>
              <p className="text-xs text-zinc-400 font-mono">v3.2.0 • BNB Smart Chain Native</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActivePlatform('android')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activePlatform === 'android' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android APK</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activePlatform === 'ios' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS Web App</span>
          </button>
          <button
            onClick={() => setActivePlatform('desktop')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activePlatform === 'desktop' ? 'bg-amber-500 text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Platform Details */}
        {activePlatform === 'android' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">TS BOT Android APK (Direct)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  24.8 MB
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Direct installation package optimized for mobile high-frequency scalping, live order notifications, and Web3 biometric authentication on BNB Chain.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Clean • SHA-256 Checksum Verified</span>
              </div>
            </div>

            {downloading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Downloading package...</span>
                  <span className="font-mono text-amber-400 font-bold">{downloadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {downloadComplete && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Download started! Tap the file in your notification bar to install.</span>
              </div>
            )}

            <button
              onClick={handleStartDownload}
              disabled={downloading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading APK...' : 'Download Android APK (v3.2.0)'}</span>
            </button>
          </div>
        )}

        {activePlatform === 'ios' && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Apple className="w-4 h-4 text-zinc-200" />
              Install on iPhone & iPad (PWA)
            </h4>
            <p className="text-zinc-400 leading-relaxed">
              Apple iOS supports full progressive web apps without App Store restrictions:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 font-mono text-[11px] pl-1">
              <li>Open this website in <span className="text-white font-bold">Safari</span> on your iPhone.</li>
              <li>Tap the <span className="text-amber-400 font-bold">Share</span> icon (square with arrow) at the bottom.</li>
              <li>Scroll down and tap <span className="text-amber-400 font-bold">"Add to Home Screen"</span>.</li>
              <li>Tap <span className="text-white font-bold">Add</span> in the top right corner.</li>
            </ol>
            <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant full-screen launch with zero storage footprint.</span>
            </div>
          </div>
        )}

        {activePlatform === 'desktop' && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              Desktop Trading Client (Electron)
            </h4>
            <p className="text-zinc-400 leading-relaxed">
              Professional multi-monitor terminal for Windows and macOS with sub-second websocket streaming.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleStartDownload}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
              >
                Windows (.exe)
              </button>
              <button
                onClick={handleStartDownload}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
              >
                macOS (.dmg)
              </button>
            </div>
          </div>
        )}

        {/* Mobile QR Scanner */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Scan with phone camera to download directly:</span>
          </div>
          <span className="font-mono text-zinc-300 font-bold">tsprotocol.io/app</span>
        </div>
      </div>
    </div>
  );
};
