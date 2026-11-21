import React, { useRef, useState } from 'react';
import {
  ChevronUp,
  Coins,
  Film,
  Landmark,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD } from '../data/constants';

interface VideoTsNftMiniScreenProps {
  onOpenNftTab: () => void;
  onOpenGovTab: () => void;
}

export const VideoTsNftMiniScreen: React.FC<VideoTsNftMiniScreenProps> = ({
  onOpenNftTab,
  onOpenGovTab,
}) => {
  const {
    miningNfts,
    stakePools,
    isVideoNftPlaying,
    setIsVideoNftPlaying,
    videoPlayEarningsUsd,
    videoNftPoolEarningsUsd,
    collectVideoAndNftPoolMoney,
  } = useProtocol();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoIdx, setVideoIdx] = useState<number>(0);
  const [collectedMsg, setCollectedMsg] = useState<string | null>(null);

  const videoNfts = miningNfts.filter((n) => Boolean(n.videoUrl));
  const fallbackVideoNft = {
    tokenId: '#TS-MEM-001',
    name: 'TS MEM · Isiphahla Royal ZEE BNB Video NFT',
    videoUrl: CONTRACTS.TS_MEM_VIDEO_NFT,
    image: CONTRACTS.TS_MEM_GOLD_BNB_IMAGE,
    dailyFeedUsd: 18.0,
    stakePoolApyBoostPct: 7.5,
    rwaValueUsd: 1.0,
  };
  const videoNft =
    videoNfts.length > 0 ? videoNfts[videoIdx % videoNfts.length] : fallbackVideoNft;

  const stakeAccruedUsd = stakePools.reduce((sum, p) => sum + p.accruedRewardsUsd, 0);
  const totalNftPoolUsd = videoNftPoolEarningsUsd + stakeAccruedUsd;
  const totalCollectableUsd = Number((videoPlayEarningsUsd + totalNftPoolUsd).toFixed(2));

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsVideoNftPlaying(true);
    } else {
      el.pause();
      setIsVideoNftPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const handleCollect = () => {
    const res = collectVideoAndNftPoolMoney();
    setCollectedMsg(
      res.success ? `+$${res.collectedUsd.toFixed(2)} Collected` : 'Play to earn'
    );
    setTimeout(() => setCollectedMsg(null), 3500);
  };

  if (minimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-[11px] font-bold text-amber-300 shadow-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Open 16:9 NFT Token Video Small Screen"
        >
          <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-mono tabular-nums">
            {videoNft.tokenId} · {formatUSD(totalCollectableUsd)}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="NFT Token Video Small Screen (16:9)"
      className="fixed bottom-4 left-4 z-40 w-[176px] sm:w-[196px] rounded-xl bg-zinc-900 border border-amber-500/45 shadow-2xl shadow-black/80 overflow-hidden"
    >
      {/* Compact Header Bar */}
      <div className="px-2.5 py-1 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-1 text-[10px] font-mono">
        <button
          type="button"
          onClick={() => {
            if (videoNfts.length > 1) {
              setVideoIdx((i) => (i + 1) % videoNfts.length);
            } else {
              onOpenNftTab();
            }
          }}
          className="text-amber-300 font-bold truncate hover:underline text-left cursor-pointer"
          title={videoNfts.length > 1 ? 'Switch Video NFT (#TS-MEM-001 / #TS-VID-001)' : 'Open TS NFT View'}
        >
          {videoNft.tokenId} {videoNfts.length > 1 ? '↻' : '· 16:9'}
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            aria-label={isVideoNftPlaying ? 'Pause NFT Video' : 'Play NFT Video'}
            title={isVideoNftPlaying ? 'Pause' : 'Play'}
          >
            {isVideoNftPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            aria-label={isMuted ? 'Unmute NFT Video' : 'Mute NFT Video'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
          </button>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            aria-label="Minimize Video TS NFT screen"
            title="Minimize"
          >
            <Minimize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Smaller 16:9 NFT Token Video Frame (No Fullscreen Controls) */}
      <div
        className="relative aspect-video w-full bg-black overflow-hidden cursor-pointer"
        onClick={togglePlay}
        title="Click to Play / Pause NFT Token Video"
      >
        <video
          key={videoNft.videoUrl}
          ref={videoRef}
          src={videoNft.videoUrl || CONTRACTS.TS_MEM_VIDEO_NFT}
          poster={videoNft.image || CONTRACTS.TS_MEM_GOLD_BNB_IMAGE}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-white pointer-events-none">
          <span className="text-emerald-400 font-bold">
            RWA ${(videoNft.rwaValueUsd ?? 1.0).toFixed(2)} TS BNB
          </span>
          <span className="text-amber-300 font-semibold">
            +{videoNft.stakePoolApyBoostPct ?? 7.5}% APY
          </span>
        </div>
      </div>

      {/* Play + NFT Pool Collection Strip */}
      <div className="p-2 bg-zinc-950 border-t border-zinc-800 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-zinc-400">
          <span>
            Play: <strong className="text-white">{formatUSD(videoPlayEarningsUsd)}</strong>
          </span>
          <span>
            Pool: <strong className="text-emerald-400">{formatUSD(totalNftPoolUsd)}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleCollect}
          className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-[10px] flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
        >
          <Coins className="w-3 h-3 stroke-[2.5]" />
          <span>
            {collectedMsg || `Collect Play + Pool (${formatUSD(totalCollectableUsd)})`}
          </span>
        </button>

        <div className="flex items-center justify-between text-[10px] pt-0.5">
          <button
            type="button"
            onClick={onOpenNftTab}
            className="text-zinc-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            NFT Pools
          </button>
          <button
            type="button"
            onClick={onOpenGovTab}
            className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Landmark className="w-2.5 h-2.5" />
            <span>CIP-95 Gov</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
