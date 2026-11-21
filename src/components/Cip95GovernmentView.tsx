import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Film,
  Landmark,
  Megaphone,
  Send,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Vault,
  Vote,
  Wallet,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import {
  CONTRACTS,
  formatUSD,
  GOVERNMENT_SUBMISSION_AGENCIES,
  shortenAddress,
} from '../data/constants';
import { GovernmentSubmission } from '../types';

interface Cip95GovernmentViewProps {
  onGoToAirdropsAds?: () => void;
  onGoToStakePools?: () => void;
}

export const Cip95GovernmentView: React.FC<Cip95GovernmentViewProps> = ({
  onGoToAirdropsAds,
  onGoToStakePools,
}) => {
  const {
    cip95State,
    govSubmissions,
    connectCip95Wallet,
    registerCip95DRep,
    submitProjectToGovernment,
    voteOnGovernmentSubmission,
    adSlots,
    miningNfts,
    stakePools,
    googleAdsConfig,
    openPopupBusinessAd,
  } = useProtocol();

  const connectedAds = adSlots.filter((a) => a.connected);
  const ownedNfts = miningNfts.filter((n) => n.owned);
  const ownedVideoNft =
    ownedNfts.find((n) => Boolean(n.videoUrl)) || miningNfts.find((n) => Boolean(n.videoUrl));
  const totalDailyAdsUsd = connectedAds.reduce((sum, a) => sum + a.dailyRevenueUsd, 0);

  const [projectTitle, setProjectTitle] = useState<string>(
    'TS Protocol · CIP-95 Economic Federal De-Coin & RWA System'
  );
  const [targetAgency, setTargetAgency] = useState<string>(GOVERNMENT_SUBMISSION_AGENCIES[0]);
  const [submissionTrack, setSubmissionTrack] = useState<
    GovernmentSubmission['submissionTrack']
  >('DUAL_GOV_AND_TREASURY');
  const [treasuryAmountUsd, setTreasuryAmountUsd] = useState<string>('250000');
  const [treasuryDestination, setTreasuryDestination] = useState<string>(
    CONTRACTS.RECHARGE_ROUTER_DEFI
  );
  const [cipStandard, setCipStandard] = useState<string>(
    'CIP-95 (Voltaire Governance) + Cardano ADA Stake Pool + BEP-20 Bridge'
  );
  const [assetSummary, setAssetSummary] = useState<string>(
    `Video TS NFT (${ownedVideoNft?.tokenId || '#TS-VID-001'}), Cardamom Export Pool, US Treasury Bills, Gold Bullion & Cardano ADA Validator Pool`
  );
  const [adSummary, setAdSummary] = useState<string>(
    `${connectedAds.length}/${adSlots.length} Appearing Business Google Ads Active (+$${totalDailyAdsUsd.toFixed(2)}/day)`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onlineVotingUrl = `${CONTRACTS.LIVE_APP_URL}/?tab=gov`;
  const parsedTreasuryUsd = Math.max(0, Number(treasuryAmountUsd) || 0);
  const parsedTreasuryAda = Math.round(parsedTreasuryUsd / 0.8);

  const totalTreasuryRequestedUsd = govSubmissions.reduce(
    (sum, s) => sum + (s.treasuryAmountUsd ?? 0),
    0
  );
  const totalOnlineVotesCast = govSubmissions.reduce(
    (sum, s) => sum + (s.voteYesCount ?? 0) + (s.voteNoCount ?? 0) + (s.voteAbstainCount ?? 0),
    0
  );

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 6000);
  };

  const handleCopyOnlineVotingUrl = async () => {
    try {
      await navigator.clipboard.writeText(onlineVotingUrl);
      setCopiedShareUrl(true);
      showFeedback('success', `Copied live Government Online Voting link: ${onlineVotingUrl}`);
      setTimeout(() => setCopiedShareUrl(false), 3000);
    } catch {
      showFeedback('success', `Live Government Online Voting URL: ${onlineVotingUrl}`);
    }
  };

  const handleConnectWallet = async () => {
    const res = await connectCip95Wallet();
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleRegisterDRep = () => {
    const res = registerCip95DRep();
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const triggerSubmission = async (
    trackOverride?: GovernmentSubmission['submissionTrack']
  ) => {
    const track = trackOverride ?? submissionTrack;
    if (trackOverride) {
      setSubmissionTrack(trackOverride);
    }
    setIsSubmitting(true);
    try {
      const res = await submitProjectToGovernment({
        projectTitle,
        targetAgency:
          track === 'TREASURY_ALLOCATION' &&
          !targetAgency.toLowerCase().includes('treasury')
            ? GOVERNMENT_SUBMISSION_AGENCIES[0]
            : targetAgency,
        cipStandard,
        assetSummary,
        adNetworkSummary: adSummary,
        submissionTrack: track,
        treasuryAmountUsd: parsedTreasuryUsd > 0 ? parsedTreasuryUsd : 250000,
        treasuryDestination,
      });
      showFeedback(res.success ? 'success' : 'error', res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGov = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerSubmission();
  };

  const handleCastVote = (submissionId: string, vote: 'YES' | 'NO' | 'ABSTAIN') => {
    const res = voteOnGovernmentSubmission(submissionId, vote);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleDownloadDossier = (submission: GovernmentSubmission) => {
    const dossierPayload = {
      protocol: 'TS PROTOCOL · Economic Federal De-Coins',
      cip95Standard: submission.cipStandard,
      referenceCode: submission.referenceCode,
      submittedAtIso: new Date(submission.submittedAt).toISOString(),
      submissionTrack: submission.submissionTrack,
      status: submission.status,
      applicantEntity: {
        legalName: submission.entityName,
        entityType: googleAdsConfig.entityType,
        jurisdiction: googleAdsConfig.jurisdiction,
        complianceChecks: googleAdsConfig.verifiedChecks,
      },
      targetGovernmentAgency: submission.targetAgency,
      treasuryAllocation: {
        requestedUsd: submission.treasuryAmountUsd ?? 250000,
        requestedAda: submission.treasuryAmountAda ?? 312500,
        disbursementDestination: submission.treasuryDestination ?? CONTRACTS.RECHARGE_ROUTER_DEFI,
      },
      onlineVotingTally: {
        votingOpenOnline: submission.votingOpenOnline ?? true,
        onlineBallotUrl: submission.liveAppUrl,
        yesVotes: submission.voteYesCount ?? 0,
        noVotes: submission.voteNoCount ?? 0,
        abstainVotes: submission.voteAbstainCount ?? 0,
        votingPowerYesAda: submission.votePowerYesAda ?? 0,
        latestDRepVote: submission.userVote ?? null,
      },
      cardanoVoltaireBridge: {
        drepId: submission.drepId,
        drepKeyHash: cip95State.drepKeyHash,
        registeredPubStakeKey: cip95State.registeredPubStakeKey,
        votingPowerAda: cip95State.votingPowerAda,
        delegatedStakePool: cip95State.delegatedPool,
      },
      productionAppUrl: submission.liveAppUrl,
      smartContracts: {
        tsTokenBep20: CONTRACTS.TS_TOKEN,
        rechargeRouterDefi: CONTRACTS.RECHARGE_ROUTER_DEFI,
        tsNftBep721: CONTRACTS.TS_NFT_CONTRACT,
        videoNftTokenId: ownedVideoNft?.tokenId || '#TS-VID-001',
      },
      stakePoolsCount: stakePools.length,
      appearingBusinessAds: adSlots.map((a) => ({
        brand: a.advertiser,
        domain: a.brandDomain,
        connected: a.connected,
        dailyRevenueUsd: a.dailyRevenueUsd,
      })),
      assetSummary: submission.assetSummary,
      adNetworkSummary: submission.adNetworkSummary,
      sha256AnchorDigest: submission.anchorHash,
    };

    const blob = new Blob([JSON.stringify(dossierPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${submission.referenceCode}_CIP95_Gov_Treasury_Dossier.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback(
      'success',
      `Downloaded signed CIP-95 Government & Treasury Dossier (${submission.referenceCode}.json).`
    );
  };

  const trackLabel = (track: GovernmentSubmission['submissionTrack']) => {
    if (track === 'GOVERNMENT_VOTING') return 'Online Gov Voting';
    if (track === 'TREASURY_ALLOCATION') return 'Treasury Action';
    return 'Gov Voting + Treasury';
  };

  return (
    <div className="space-y-8">
      {/* Overview Header & 4-Metric Hairline KPI Strip */}
      <section className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-amber-400">
              Cardano CIP-95 Voltaire Governance · Online Government Voting & Treasury Withdrawal Action
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CIP-95 Government Voting & Treasury Portal
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Submit TS Protocol online for public Government DRep voting and formal Treasury allocation under{' '}
              <span className="text-zinc-200 font-semibold">{googleAdsConfig.advertiserName}</span>, backed by Sovereign Video TS NFT ({ownedVideoNft?.tokenId || '#TS-VID-001'}), RWA & Cardano ADA Stake Pools, and {connectedAds.length} appearing Business Google Ads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => triggerSubmission('GOVERNMENT_VOTING')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 disabled:opacity-60 text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Vote className="w-4 h-4 stroke-[2.25]" />
              <span>Submit to Gov Voting (Online)</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => triggerSubmission('TREASURY_ALLOCATION')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Vault className="w-4 h-4 stroke-[2.25]" />
              <span>Submit to Treasury</span>
            </button>
            <button
              type="button"
              onClick={handleCopyOnlineVotingUrl}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedShareUrl ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-amber-400" />
              )}
              <span>{copiedShareUrl ? 'Copied Online Link' : 'Copy Online Voting URL'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-zinc-800">
          <div>
            <div className="text-xs text-zinc-400">Online Governance Ballots</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums mt-1">
              {govSubmissions.length} Active · {totalOnlineVotesCast} Votes
            </div>
            <div className="text-xs text-emerald-400 font-mono mt-0.5">
              Public CIP-95 Online Ballot Live
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Total Treasury Requested</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
              {formatUSD(totalTreasuryRequestedUsd)}
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              {Math.round(totalTreasuryRequestedUsd / 0.8).toLocaleString()} ADA Equivalent
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Connected Business Ads & NFTs</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums mt-1">
              {connectedAds.length} Ads · {ownedNfts.length} NFTs
            </div>
            <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
              +{formatUSD(totalDailyAdsUsd)}/day Ads · {ownedVideoNft?.tokenId || '#TS-VID-001'}
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Verified Applicant Entity</div>
            <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
              {googleAdsConfig.advertiserName}
            </div>
            <div className="text-xs text-emerald-400 font-mono mt-0.5">
              CIPC & SARS Good Standing
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/70 border-rose-800 text-rose-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}
      </section>

      {/* Main 2-Column Submission Workbench + CIP-95 Bridge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Official Government Voting & Treasury Submission Form */}
        <form
          onSubmit={handleSubmitGov}
          className="lg:col-span-7 rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                <span>Submit CIP-95 Project to Government Voting & Treasury</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Anchors a SHA-256 governance & treasury digest linking your live online ballot URL, CIP-95 DRep ID, Video TS NFT, and Retail Ads.
              </p>
            </div>
          </div>

          {/* Embedded Video TS NFT (16:9 Non-Fullscreen) & Online Ballot Endpoint Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="sm:col-span-4 aspect-video max-w-[172px] mx-auto w-full rounded-lg bg-black border border-amber-500/40 overflow-hidden">
              <video
                src={ownedVideoNft?.videoUrl || CONTRACTS.TS_SOVEREIGN_VIDEO_NFT}
                poster={ownedVideoNft?.image || CONTRACTS.TS_SOVEREIGN_NFT_IMAGE}
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="sm:col-span-8 space-y-2 text-xs">
              <div className="font-mono text-amber-400 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                <span>Sovereign Asset Proof · {ownedVideoNft?.tokenId || '#TS-VID-001'}</span>
              </div>
              <div className="text-white font-bold">
                King Newboy Mthandeni Dlamini · E.I.M. Tsibaw Dawid Malkhut
              </div>
              <div className="text-zinc-400 font-mono text-[11px] break-all">
                Online Voting Endpoint:{' '}
                <a
                  href={onlineVotingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{onlineVotingUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              <div className="text-zinc-400 font-mono text-[11px]">
                Verified Compliance: {googleAdsConfig.verifiedChecks.slice(0, 3).join(' · ')}
              </div>
            </div>
          </div>

          {/* Submission Track Selector */}
          <div className="space-y-1.5 text-xs">
            <span className="block text-zinc-400 font-semibold">Submission Track</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  {
                    id: 'DUAL_GOV_AND_TREASURY',
                    label: 'Gov Voting + Treasury',
                  },
                  {
                    id: 'GOVERNMENT_VOTING',
                    label: 'Gov Voting (Online)',
                  },
                  {
                    id: 'TREASURY_ALLOCATION',
                    label: 'Treasury Allocation',
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSubmissionTrack(option.id)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                    submissionTrack === option.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1.5">
                Project Title for Government & Treasury Registry
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1.5">
                Target Government / Treasury Authority
              </label>
              <select
                value={targetAgency}
                onChange={(e) => setTargetAgency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {GOVERNMENT_SUBMISSION_AGENCIES.map((agency) => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                Treasury Allocation Request (USD)
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={treasuryAmountUsd}
                onChange={(e) => setTreasuryAmountUsd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono font-bold tabular-nums focus:outline-none focus:border-emerald-500"
                required
              />
              <div className="text-[11px] font-mono text-zinc-500 mt-1 tabular-nums">
                ≈ {parsedTreasuryAda.toLocaleString()} ADA (@ $0.80/ADA)
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                Treasury Disbursement Vault / Contract
              </label>
              <input
                type="text"
                value={treasuryDestination}
                onChange={(e) => setTreasuryDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
              <div className="text-[11px] font-mono text-zinc-500 mt-1">
                Verified BSC / Cardano CIP-95 Settlement Vault
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1.5">
                CIP-95 Standard & Protocol Scope
              </label>
              <input
                type="text"
                value={cipStandard}
                onChange={(e) => setCipStandard(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                RWA, Stake Pools & Video NFT Summary
              </label>
              <textarea
                rows={3}
                value={assetSummary}
                onChange={(e) => setAssetSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                Ready-to-Launch Business Google Ads Summary
              </label>
              <textarea
                rows={3}
                value={adSummary}
                onChange={(e) => setAdSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400">
              DRep Signer: {shortenAddress(cip95State.drepId)} · {trackLabel(submissionTrack)}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => triggerSubmission('TREASURY_ALLOCATION')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 disabled:opacity-60 text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Vault className="w-3.5 h-3.5" />
                <span>Treasury Only</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 disabled:opacity-60 text-zinc-950 font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isSubmitting
                    ? 'Anchoring SHA-256...'
                    : submissionTrack === 'GOVERNMENT_VOTING'
                    ? 'Submit to Government Voting (Online)'
                    : submissionTrack === 'TREASURY_ALLOCATION'
                    ? 'Submit Proposal to Treasury'
                    : 'Submit to Government Voting & Treasury'}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Right 5 Columns: Cardano CIP-95 Voltaire DRep Bridge & Pre-Launch Checklist */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Cardano CIP-95 Web-Wallet Bridge</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {cip95State.walletName} · Mainnet ID {cip95State.networkId}
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
                CIP-95 Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block">CIP-95 DRep ID (CIP-105 / CIP-129)</span>
                <span className="text-amber-300 font-bold break-all">{cip95State.drepId}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block">Registered Public Stake Key</span>
                <span className="text-zinc-200 break-all">{cip95State.registeredPubStakeKey}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 tabular-nums">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block">DRep Voting Power</span>
                  <span className="text-emerald-400 font-bold">
                    {cip95State.votingPowerAda.toLocaleString()} ADA
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block">Delegated Pool</span>
                  <span className="text-white font-bold truncate block">
                    {cip95State.delegatedPool}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConnectWallet}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                Connect Browser CIP-95 Wallet
              </button>
              <button
                type="button"
                onClick={handleRegisterDRep}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs whitespace-nowrap cursor-pointer"
              >
                Register CIP-95 DRep Key
              </button>
            </div>
          </div>

          {/* Ready-to-Launch Compliance & Ad Inventory Checklist */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Government Voting & Treasury Readiness</span>
            </h3>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                <span>1. Entity KYC & SARS Compliance</span>
                <span className="font-mono text-emerald-400 font-bold">Verified</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                <span>2. Sovereign Video TS NFT (#TS-VID-001)</span>
                <span className="font-mono text-emerald-400 font-bold">Staked & Active</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                <span>3. Cardano ADA & RWA Stake Pools</span>
                <span className="font-mono text-emerald-400 font-bold">{stakePools.length} Vaults Live</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
                <span>4. Google Business Ads ({googleAdsConfig.googleTagId})</span>
                <span className="font-mono text-emerald-400 font-bold">{connectedAds.length} Appearing Ads</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>5. Online Gov Ballot & Treasury Action</span>
                <span className="font-mono text-amber-300 font-bold">Open Online</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onGoToAirdropsAds && (
                <button
                  type="button"
                  onClick={onGoToAirdropsAds}
                  className="py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Business Ads ({adSlots.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => openPopupBusinessAd()}
                className="py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-emerald-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Preview Live Business Ad
              </button>
            </div>

            {onGoToStakePools && (
              <button
                type="button"
                onClick={onGoToStakePools}
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Inspect RWA & Cardano ADA Stake Pools →
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Live Online Government & Treasury Voting Ballot Section */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Vote className="w-4 h-4 text-amber-400" />
              <span>Online Government & Treasury Voting Ballot (CIP-95)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cast verifiable online CIP-95 DRep votes ({cip95State.votingPowerAda.toLocaleString()} ADA voting weight) on Government & Treasury submissions.
            </p>
          </div>
          <a
            href={onlineVotingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Open Public Ballot URL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {govSubmissions.map((sub) => {
            const yesVotes = sub.voteYesCount ?? 0;
            const noVotes = sub.voteNoCount ?? 0;
            const abstainVotes = sub.voteAbstainCount ?? 0;
            const totalVotes = Math.max(1, yesVotes + noVotes + abstainVotes);
            const yesPct = Math.round((yesVotes / totalVotes) * 100);
            const treasuryUsd = sub.treasuryAmountUsd ?? 250000;
            const treasuryAda = sub.treasuryAmountAda ?? Math.round(treasuryUsd / 0.8);

            return (
              <div
                key={`ballot-${sub.id}`}
                className="rounded-xl bg-zinc-950 border border-zinc-800 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-mono text-amber-400">
                      {sub.referenceCode} · {trackLabel(sub.submissionTrack)} ·{' '}
                      <span className="text-emerald-400">
                        {sub.votingOpenOnline ? 'Online Voting Open' : 'Closed'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {sub.projectTitle}
                    </h3>
                    <div className="text-xs text-zinc-400 truncate">
                      {sub.targetAgency}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="text-xs font-bold text-emerald-400">
                      {formatUSD(treasuryUsd)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {treasuryAda.toLocaleString()} ADA
                    </div>
                  </div>
                </div>

                {/* Quorum & Approval Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-emerald-400 font-bold">
                      YES {yesPct}% ({yesVotes} votes · {(sub.votePowerYesAda ?? 0).toLocaleString()} ADA)
                    </span>
                    <span className="text-zinc-400">
                      NO {noVotes} · ABSTAIN {abstainVotes}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${yesPct}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] font-mono text-zinc-500 break-all">
                  Anchor: {shortenAddress(sub.anchorHash)} · Vault: {shortenAddress(sub.treasuryDestination || CONTRACTS.RECHARGE_ROUTER_DEFI)}
                </div>

                {/* Online Vote Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCastVote(sub.id, 'YES')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        sub.userVote === 'YES'
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 hover:bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Vote YES</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCastVote(sub.id, 'NO')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        sub.userVote === 'NO'
                          ? 'bg-rose-500 text-white'
                          : 'bg-zinc-800 hover:bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Vote NO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCastVote(sub.id, 'ABSTAIN')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        sub.userVote === 'ABSTAIN'
                          ? 'bg-amber-400 text-zinc-950'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      Abstain
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadDossier(sub)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-[11px] cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>Dossier JSON</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Government & Treasury Submissions Ledger */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">
              CIP-95 Government & Treasury Submissions Ledger
            </h2>
            <p className="text-xs text-zinc-400">
              Export signed JSON governance & treasury packages with live online DRep vote tallies for regulatory review.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 tabular-nums">
            {govSubmissions.length} Submissions Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="py-2.5 pr-4 font-semibold">Ref Code</th>
                <th className="py-2.5 px-4 font-semibold">Project Title</th>
                <th className="py-2.5 px-4 font-semibold">Target Authority</th>
                <th className="py-2.5 px-4 font-semibold">Treasury Request</th>
                <th className="py-2.5 px-4 font-semibold">Online Votes (Y/N/A)</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 font-mono tabular-nums">
              {govSubmissions.map((sub) => {
                const tUsd = sub.treasuryAmountUsd ?? 250000;
                return (
                  <tr key={sub.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-amber-300 font-bold whitespace-nowrap">
                      {sub.referenceCode}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-white max-w-[240px] truncate">
                      {sub.projectTitle}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-zinc-300 max-w-[220px] truncate">
                      {sub.targetAgency}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold whitespace-nowrap">
                      {formatUSD(tUsd)}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300 whitespace-nowrap">
                      {sub.voteYesCount ?? 0} / {sub.voteNoCount ?? 0} / {sub.voteAbstainCount ?? 0}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-emerald-400 font-bold whitespace-nowrap">
                      {sub.status.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDownloadDossier(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-sans font-bold text-[11px] cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-amber-400" />
                        <span>Download JSON</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

