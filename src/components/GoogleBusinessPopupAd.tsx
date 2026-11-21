import React, { useEffect } from 'react';
import { ExternalLink, ChevronRight, X, Building2, Sparkles } from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { formatUSD } from '../data/constants';
import { pushAdSenseSlot } from '../utils/googleAds';

export const GoogleBusinessPopupAd: React.FC = () => {
  const {
    activePopupAd,
    dismissPopupBusinessAd,
    nextPopupBusinessAd,
    recordPopupAdEngagement,
  } = useProtocol();

  const adsenseClient =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_ADSENSE_CLIENT) || '';

  useEffect(() => {
    if (!activePopupAd) return;
    recordPopupAdEngagement(activePopupAd.id, 'IMPRESSION');
    if (adsenseClient) {
      pushAdSenseSlot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopupAd?.id]);

  if (!activePopupAd) return null;

  const initials = activePopupAd.advertiser
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const categoryLabel =
    activePopupAd.businessCategory === 'FASHION_RETAIL'
      ? 'Fashion & Retail Business'
      : activePopupAd.businessCategory === 'SUPERSTORE_TECH'
      ? 'Superstore & Electronics'
      : activePopupAd.businessCategory === 'GROCERY_FOOD'
      ? 'Grocery & Retail'
      : 'Verified Business Ad';

  return (
    <aside
      role="dialog"
      aria-label={`Google Business Ad: ${activePopupAd.advertiser}`}
      className="fixed bottom-5 right-5 z-50 w-[min(92vw,390px)] rounded-2xl bg-zinc-900 border border-amber-500/50 shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Top Sponsored Attribution Bar */}
      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-black text-[10px]">
            Ad
          </span>
          <span className="text-zinc-300 font-semibold truncate">
            Google Business Ads · {categoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={nextPopupBusinessAd}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Next Business Ad"
            aria-label="Next Business Ad"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={dismissPopupBusinessAd}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Ad"
            aria-label="Close Ad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Business Ad Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0">
            {initials || <Building2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono text-emerald-400 truncate">
              {activePopupAd.brandDomain || 'business.google.com'}
            </div>
            <h4 className="text-sm font-black text-white leading-snug truncate">
              {activePopupAd.advertiser}
            </h4>
            <p className="text-xs text-amber-300 font-semibold mt-0.5 line-clamp-1">
              {activePopupAd.headlineOffer || activePopupAd.title}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {activePopupAd.description}
        </p>

        {/* Live Google AdSense Container (renders real network fill when VITE_GOOGLE_ADSENSE_CLIENT is set) */}
        {adsenseClient && (
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <ins
              className="adsbygoogle block"
              style={{ display: 'block', minHeight: '60px' }}
              data-ad-client={adsenseClient}
              data-ad-format="fluid"
              data-full-width-responsive="true"
            />
          </div>
        )}

        <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs">
          <div className="font-mono tabular-nums text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-bold">
              +{formatUSD(activePopupAd.dailyRevenueUsd)}/day
            </span>{' '}
            → {activePopupAd.connectedTarget.replace('_', ' ')}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={nextPopupBusinessAd}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Next Ad</span>
            </button>

            <a
              href={activePopupAd.destinationUrl || 'https://business.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordPopupAdEngagement(activePopupAd.id, 'CLICK')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Visit Business</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
