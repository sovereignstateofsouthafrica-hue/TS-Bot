import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { 
  LiquidityPool, 
  UserPosition, 
  TradeEvent, 
  BotConfig, 
  WalletState,
  FinancialMetric,
  CryptoAlert,
  ReferralUser,
  AuthUser,
  BinanceMiningCloudState,
  CloudMiningShare,
  MiningMachinePackage,
  ConnectedMachine,
  IrdFeedEvent,
  CloudAirdropToken,
  MiningNftAsset,
  MiningProfitFeedEvent,
  StakePool,
  StakePoolEvent,
  AdCampaignSlot,
  GoogleAdsConfig,
  GoogleAdsConversionEvent,
  Cip95DRepState,
  GovernmentSubmission
} from '../types';
import { 
  INITIAL_POOLS, 
  INITIAL_TOKENS, 
  CONTRACTS, 
  WITHDRAWAL_RULES, 
  MINING_PACKAGE_RULES,
  MINING_FEED_RULES,
  BINANCE_CLOUD_MINING, 
  TS_MINING_MACHINE_PACKAGES,
  INITIAL_CLOUD_AIRDROP_TOKENS,
  INITIAL_MINING_NFTS,
  INITIAL_STAKE_POOLS,
  INITIAL_AD_SLOTS,
  GOOGLE_ADS_DEFAULT_CONFIG,
  INITIAL_CIP95_DREP_STATE,
  GOVERNMENT_SUBMISSION_AGENCIES,
  calculateAmountOut, 
  shortenAddress 
} from '../data/constants';
import { initGoogleAdsTag, initGoogleAdSense, dispatchGoogleAdsConversion } from '../utils/googleAds';
import {
  initGmailAuth,
  googleSignInForGmail,
  getGmailAccessToken,
  getGmailUserEmail,
  logoutGmailAuth,
  sendWithdrawalAuthorizationEmail,
  WithdrawalEmailResult,
} from '../utils/gmailAuth';

interface ProtocolContextType {
  pools: LiquidityPool[];
  selectedPool: LiquidityPool;
  setSelectedPoolId: (id: string) => void;
  userPositions: UserPosition[];
  tradeHistory: TradeEvent[];
  botConfig: BotConfig;
  setBotConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  wallet: WalletState;
  refreshTokenBalances: (
    source?: 'RECHARGE' | 'WITHDRAWAL' | 'MANUAL'
  ) => { BNB: number; TS: number; USDT: number; refreshedAt: number };
  lastBalanceRefreshAt: number;
  connectWallet: (connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet') => void;
  disconnectWallet: () => void;
  switchNetwork: (net: string, chainId: number) => void;
  claimFaucet: () => void;
  addLiquidity: (poolId: string, amountA: number, amountB: number) => { success: boolean; message: string };
  removeLiquidity: (poolId: string, percentage: number) => { success: boolean; message: string };
  claimPoolFees: (poolId: string) => { success: boolean; message: string };
  executeManualSwap: (poolId: string, fromTokenSymbol: string, amountIn: number) => { success: boolean; message: string };
  executeTierPackage: (poolId: string, tierUsd: number) => { success: boolean; message: string };
  processRechargeBnb: (amountBnb: number, txHash?: string, note?: string) => { success: boolean; alert: CryptoAlert };
  processWithdrawalBnb: (
    amountBnb: number, 
    recipientAddress: string, 
    note?: string,
    source?: 'miner' | 'wallet'
  ) => { success: boolean; message: string; alert?: CryptoAlert };
  addMinedYieldBnb: (amountBnb: number) => void;
  alerts: CryptoAlert[];
  activeAlertToast: CryptoAlert | null;
  dismissAlertToast: () => void;
  gmailAuthorized: boolean;
  gmailNeedsAuth: boolean;
  gmailAccountEmail: string | null;
  isGmailSigningIn: boolean;
  gmailLastSyncMessage: string | null;
  connectGmailAuthorization: () => Promise<{ success: boolean; email?: string; error?: string }>;
  disconnectGmailAuthorization: () => Promise<void>;
  dispatchWithdrawalEmailForAlert: (
    alertOrId: CryptoAlert | string
  ) => Promise<WithdrawalEmailResult>;
  sendTestWithdrawalAuthEmail: () => Promise<WithdrawalEmailResult>;
  referralUsers: ReferralUser[];
  unclaimedCommissionBnb: number;
  claimReferralCommission: () => { success: boolean; message: string; amountBnb: number; amountUsd: number };
  currentUser: AuthUser | null;
  savedCredentials: { email: string; password: string } | null;
  registerUser: (email: string, password: string, username?: string, inviterCode?: string, rememberMe?: boolean) => { success: boolean; message: string; user?: AuthUser };
  loginUser: (emailOrUser: string, password: string, rememberMe?: boolean) => { success: boolean; message: string; user?: AuthUser };
  logoutUser: () => void;
  recoverPassword: (email: string) => { success: boolean; message: string; tempPass?: string };
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
  addSimulatedReferral: (level?: 1 | 2 | 3 | 4) => { success: boolean; message: string };
  financialMetrics: FinancialMetric[];
  currentBlock: number;
  triggerBotBurst: () => void;
  rechargeBalance: number;
  rechargeBalanceUsd: number;
  hasRecharged: boolean;
  accumulatedMiningYieldBnb: number;
  achievedMiningTotalBnb: number;
  totalWithdrawnFromMinerBnb: number;
  claimedToWalletMiningBnb: number;
  claimMiningYield: () => { success: boolean; message: string; amountBnb: number };
  resetSystemData: () => void;
  binanceCloud: BinanceMiningCloudState;
  cloudShares: CloudMiningShare[];
  connectBinanceMiningCloud: (region?: string) => void;
  disconnectBinanceMiningCloud: () => void;
  boostMiningEngine: (multiplier?: number) => { success: boolean; message: string; addedBnb: number; newHashrateTh: number };
  setCloudRegion: (regionId: string) => void;
  setMiningMultiplier: (multiplier: number) => void;
  connectedMachines: ConnectedMachine[];
  connectMiningMachine: (machineId: string) => void;
  disconnectMiningMachine: (machineId: string) => void;
  toggleMachineOverclock: (machineId: string) => void;
  buyMiningMachinePackage: (
    packageId: string, 
    paymentMethod?: 'BNB' | 'USDT' | 'RECHARGE'
  ) => { success: boolean; message: string; machine?: ConnectedMachine };
  irdWalletAddress: string;
  setIrdWalletAddress: (addr: string) => void;
  totalMinesFedToIrdBnb: number;
  totalMinesFedToIrdUsd: number;
  irdFeedHistory: IrdFeedEvent[];
  isMiningRobotFeedingIrd: boolean;
  toggleMiningRobotAutoFeed: () => void;
  feedMinesToIrd: (machineId?: string) => {
    success: boolean;
    message: string;
    amountBnb: number;
    amountUsd: number;
    txHash: string;
  };
  linkMachineToIrd: (
    machineId: string,
    customIrdAddress?: string
  ) => { success: boolean; message: string };
  cloudAirdropTokens: CloudAirdropToken[];
  miningNfts: MiningNftAsset[];
  miningProfitFeedHistory: MiningProfitFeedEvent[];
  claimAirdropToken: (tokenId: string) => { success: boolean; message: string };
  toggleTokenFeedMining: (tokenId: string) => { success: boolean; message: string };
  mintOrClaimNft: (nftId: string) => { success: boolean; message: string };
  toggleNftFeedMining: (nftId: string) => { success: boolean; message: string };
  harvestAllFeedsToMiningProfits: () => { success: boolean; message: string; addedBnb: number; addedUsd: number };
  stakePools: StakePool[];
  stakeHistory: StakePoolEvent[];
  stakeIntoPool: (
    poolId: string,
    amountUsd: number,
    paymentMethod?: 'BNB' | 'USDT' | 'RECHARGE'
  ) => { success: boolean; message: string };
  unstakeFromPool: (poolId: string, percentage: number) => { success: boolean; message: string };
  claimStakeReward: (poolId: string) => { success: boolean; message: string };
  toggleStakeFeedToMining: (poolId: string) => { success: boolean; message: string };
  miningFeedEnabled: boolean;
  miningFeedAccumulatedUsd: number;
  miningFeedTotalSettledUsd: number;
  toggleMiningFeed: () => void;
  collectMiningFeedToProfits: () => { success: boolean; message: string; addedUsd: number; addedBnb: number };
  advance24hMiningFeed: () => { success: boolean; message: string; addedUsd: number; addedBnb: number };
  adSlots: AdCampaignSlot[];
  createTsNft: (params: {
    name: string;
    collection?: string;
    rarity: MiningNftAsset['rarity'];
    dailyFeedUsd?: number;
    stakePoolApyBoostPct?: number;
    connectPoolIds?: string[];
    linkedNftIds?: string[];
    rwaValueUsd?: number;
    isMemeNft?: boolean;
    image?: string;
    videoUrl?: string;
  }) => { success: boolean; message: string; nft?: MiningNftAsset };
  toggleNftStakePoolConnection: (nftId: string, poolId: string) => { success: boolean; message: string };
  toggleNftToNftLink: (sourceNftId: string, targetNftId: string) => { success: boolean; message: string };
  linkAllNftsToRwaAndTsBnb: () => { success: boolean; message: string };
  connectNftToAllStakePools: (nftId: string) => { success: boolean; message: string };
  connectStakePoolWithAllNfts: (poolId: string) => { success: boolean; message: string };
  toggleAdConnection: (adId: string) => { success: boolean; message: string };
  connectAllAds: () => { success: boolean; message: string };
  createAdConnection: (params: {
    title: string;
    advertiser: string;
    placement: AdCampaignSlot['placement'];
    connectedTarget: AdCampaignSlot['connectedTarget'];
    dailyRevenueUsd?: number;
    targetAddress?: string;
    network?: AdCampaignSlot['network'];
    campaignType?: AdCampaignSlot['campaignType'];
    businessCategory?: AdCampaignSlot['businessCategory'];
    brandDomain?: string;
    destinationUrl?: string;
    headlineOffer?: string;
  }) => { success: boolean; message: string };
  googleAdsConfig: GoogleAdsConfig;
  googleAdsConversions: GoogleAdsConversionEvent[];
  updateGoogleAdsConfig: (updates: Partial<Pick<GoogleAdsConfig, 'googleTagId' | 'conversionLabel' | 'dailyBudgetUsd'>>) => { success: boolean; message: string };
  toggleGoogleAdsStatus: () => { success: boolean; message: string };
  triggerGoogleAdsConversion: (source: string, valueUsd?: number) => { success: boolean; message: string };
  popupAdEnabled: boolean;
  activePopupAd: AdCampaignSlot | null;
  togglePopupAdEnabled: () => void;
  openPopupBusinessAd: (adId?: string) => void;
  dismissPopupBusinessAd: () => void;
  nextPopupBusinessAd: () => void;
  recordPopupAdEngagement: (adId: string, action: 'IMPRESSION' | 'CLICK') => void;
  cip95State: Cip95DRepState;
  govSubmissions: GovernmentSubmission[];
  connectCip95Wallet: () => Promise<{ success: boolean; message: string }>;
  registerCip95DRep: () => { success: boolean; message: string };
  submitProjectToGovernment: (params: {
    projectTitle: string;
    targetAgency: string;
    cipStandard?: string;
    assetSummary?: string;
    adNetworkSummary?: string;
    submissionTrack?: GovernmentSubmission['submissionTrack'];
    treasuryAmountUsd?: number;
    treasuryDestination?: string;
  }) => Promise<{ success: boolean; message: string; submission?: GovernmentSubmission }>;
  voteOnGovernmentSubmission: (
    submissionId: string,
    vote: 'YES' | 'NO' | 'ABSTAIN'
  ) => { success: boolean; message: string };
  isVideoNftPlaying: boolean;
  setIsVideoNftPlaying: (playing: boolean) => void;
  videoPlayEarningsUsd: number;
  videoNftPoolEarningsUsd: number;
  collectVideoAndNftPoolMoney: () => {
    success: boolean;
    message: string;
    collectedUsd: number;
    collectedBnb: number;
  };
}

const ProtocolContext = createContext<ProtocolContextType | null>(null);

export function ProtocolProvider({ children }: { children: ReactNode }) {
  const [pools, setPools] = useState<LiquidityPool[]>(INITIAL_POOLS);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('ts-bnb');
  const [currentBlock, setCurrentBlock] = useState<number>(38429104);

  // User Wallet State (persisted to localStorage for live balance sync)
  const [wallet, setWallet] = useState<WalletState>(() => {
    const defaultWallet: WalletState = {
      connected: true,
      address: '0x71C...a49B',
      network: 'BNB Smart Chain (Mainnet)',
      chainId: 56,
      balances: {
        BNB: 8.45,
        TS: 2450.0,
        USDT: 1200.0,
      },
      connector: 'MetaMask',
    };
    try {
      const stored = localStorage.getItem('ts_bot_wallet_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.balances) {
          return {
            ...defaultWallet,
            ...parsed,
            balances: {
              ...defaultWallet.balances,
              ...parsed.balances,
            },
          };
        }
      }
    } catch (e) {}
    return defaultWallet;
  });
  const walletRef = useRef<WalletState>(wallet);
  const [lastBalanceRefreshAt, setLastBalanceRefreshAt] = useState<number>(() => Date.now());

  // Gmail Withdrawal Authorization Sync State (in-memory token only)
  const [gmailAuthorized, setGmailAuthorized] = useState<boolean>(() => Boolean(getGmailAccessToken()));
  const [gmailNeedsAuth, setGmailNeedsAuth] = useState<boolean>(() => !getGmailAccessToken());
  const [gmailAccountEmail, setGmailAccountEmail] = useState<string | null>(() => getGmailUserEmail());
  const [isGmailSigningIn, setIsGmailSigningIn] = useState<boolean>(false);
  const [gmailLastSyncMessage, setGmailLastSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user) => {
        setGmailAuthorized(true);
        setGmailNeedsAuth(false);
        setGmailAccountEmail(user.email);
      },
      () => {
        setGmailAuthorized(false);
        setGmailNeedsAuth(true);
        setGmailAccountEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    walletRef.current = wallet;
    try {
      localStorage.setItem('ts_bot_wallet_state', JSON.stringify(wallet));
    } catch (e) {}
  }, [wallet]);

  // User Package 1 ($10 USD) Recharge State (0.016273 BNB at $614.50 BNB/USD)
  const PACKAGE_1_BNB = 0.016273;
  const bnbRate = 614.50;

  const [rechargeBalance, setRechargeBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_recharge_balance');
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {}
    // User confirmed: $10 Mining Package 1 has been recharged
    return PACKAGE_1_BNB;
  });

  const rechargeBalanceUsd = rechargeBalance * bnbRate;
  const hasRecharged = rechargeBalance > 0;

  // Real-time Accumulated 32% Daily Mining Yield on Recharged BNB ($10 Package 1 = $3.20/day -> $16.00 in 5 days)
  const [accumulatedMiningYieldBnb, setAccumulatedMiningYieldBnb] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_yield_bnb');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {}
    // Initial accrued mining yield count for active $10 package
    return 0.000240; // ~$0.15 USD live yield
  });

  const [totalWithdrawnFromMinerBnb, setTotalWithdrawnFromMinerBnb] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_total_withdrawn_miner_bnb');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0;
  });

  const [claimedToWalletMiningBnb, setClaimedToWalletMiningBnb] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_claimed_mining_bnb');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0;
  });

  // Non-decreasing cumulative total achieved across TS BOT & IRD unified mining
  const achievedMiningTotalBnb = accumulatedMiningYieldBnb + totalWithdrawnFromMinerBnb;

  // User LP Positions (Active mining position from $10 Package 1 in TS/BNB pool)
  const [userPositions, setUserPositions] = useState<UserPosition[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_user_positions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        poolId: 'ts-bnb',
        lpTokens: 0.1613,
        sharePercentage: 0.01,
        stakedTokenA: 1.30, // 1.30 TS ($5.00)
        stakedTokenB: 0.0081, // 0.0081 BNB ($5.00)
        accruedFeesUsd: 0.24,
        initialDepositUsd: 10.00,
        currentValueUsd: 10.24,
        joinedAt: Date.now() - 86400000,
      },
    ];
  });

  // Real-time Automated Trading Bot Engine State
  // Active trading figures started with $10 Mining Package 1
  const [botConfig, setBotConfig] = useState<BotConfig>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_engine_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.totalSwapsExecuted === 'number' && parsed.totalVolumeUsd > 0) {
          return {
            ...parsed,
            active: true,
          };
        }
      }
    } catch (e) {}
    return {
      active: true,
      autoRebalance: true,
      minSpreadPct: 0.15,
      maxSlippagePct: 0.5,
      tradingSpeed: 'normal',
      targetPair: 'TS / BNB',
      totalSwapsExecuted: 4,
      totalVolumeUsd: 10.00,
      totalFeesGeneratedUsd: 0.025,
      lastAction: '$10 Mining Package 1 active. Automated liquidity provisioning & 32% daily mining ($16.00 in 5 days) running.',
    };
  });

  // Trade History (Active execution stream since recharge)
  const [tradeHistory, setTradeHistory] = useState<TradeEvent[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_trade_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'tx-rec-pkg1-1',
        timestamp: Date.now() - 95000,
        type: 'BUY',
        poolId: 'ts-bnb',
        tokenIn: 'BNB',
        tokenOut: 'TS',
        amountIn: 0.0081,
        amountOut: 1.30,
        price: 3.84,
        txHash: '0x8f2a91b4c73081b9e0785d1BA051ECdbC721c86e0828ACf43Db07821B07D88a4',
        blockNumber: 38429098,
        gasUsedGwei: 2.1,
        slippagePct: 0.04,
        botInitiated: true,
      },
      {
        id: 'tx-rec-pkg1-2',
        timestamp: Date.now() - 45000,
        type: 'ARBITRAGE_REBALANCE',
        poolId: 'ts-bnb',
        tokenIn: 'TS',
        tokenOut: 'BNB',
        amountIn: 0.65,
        amountOut: 0.0041,
        price: 3.85,
        txHash: '0x3c71a0984efb2891d087c57e2780dcC2018182018a051ecdbc721c86e0828ac',
        blockNumber: 38429102,
        gasUsedGwei: 2.3,
        slippagePct: 0.02,
        botInitiated: true,
      },
    ];
  });

  // Financial Metrics Summary
  const [financialMetrics] = useState<FinancialMetric[]>([
    {
      period: 'Today (Live 24h)',
      tradingVolume: 348200,
      feesCollected: 870.50,
      distributedToLPs: 696.40, // 80% to LPs, 20% to treasury & affiliate rebates
      activeLPs: 412,
      tvl: 1229000,
    },
    {
      period: 'Yesterday',
      tradingVolume: 312500,
      feesCollected: 781.25,
      distributedToLPs: 625.00,
      activeLPs: 405,
      tvl: 1205000,
    },
    {
      period: '7 Days Total',
      tradingVolume: 2450000,
      feesCollected: 6125.00,
      distributedToLPs: 4900.00,
      activeLPs: 395,
      tvl: 1180000,
    },
    {
      period: '30 Days Total',
      tradingVolume: 9850000,
      feesCollected: 24625.00,
      distributedToLPs: 19700.00,
      activeLPs: 360,
      tvl: 1120000,
    },
  ]);

  // Alerts State (Persistent ledger; only withdrawals dispatch email requests to sovereignstateofsouthafrica@gmail.com)
  const [alerts, setAlerts] = useState<CryptoAlert[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [activeAlertToast, setActiveAlertToast] = useState<CryptoAlert | null>(null);

  const dismissAlertToast = () => setActiveAlertToast(null);

  // 4-Level Referral Network State
  // Accurately set to user's real 2 referrals (1 active with $11 recharge, 1 registered). All fake dummy referrals purged.
  const ACCURATE_REAL_REFERRALS: ReferralUser[] = [
    {
      id: 'ref-real-1',
      address: '0x892F3a1bB19051ECdbC721c86e0828ACf4371E2',
      level: 1,
      joinedTimestamp: Date.now() - 86400000 * 2,
      tradingVolumeUsd: 110.0,
      commissionEarnedBnb: 0.000179, // 1% commission on $11 = $0.11 / 614.50 BNB
      commissionEarnedUsd: 0.11,
      status: 'ACTIVE',
      rechargedAmountUsd: 11.0,
      note: 'Recharged $11 Package',
    },
    {
      id: 'ref-real-2',
      address: '0x3a4E1c29B07D886A8A5d47c57e2780dcC204B91',
      level: 1,
      joinedTimestamp: Date.now() - 86400000 * 1,
      tradingVolumeUsd: 0.0,
      commissionEarnedBnb: 0.0,
      commissionEarnedUsd: 0.0,
      status: 'REGISTERED',
      rechargedAmountUsd: 0,
      note: 'Registered Affiliate (Awaiting Recharge)',
    },
  ];

  const [unclaimedCommissionBnb, setUnclaimedCommissionBnb] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_unclaimed_comm_bnb');
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0.000179; // $0.11 USD commission earned from $11 recharge
  });

  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_referral_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(
            (r) => !/^ref-[0-9]+$/.test(r.id) && !r.id?.startsWith('ref-init')
          );
          if (cleaned.length >= 2) return cleaned;
        }
      }
    } catch (e) {}
    return ACCURATE_REAL_REFERRALS;
  });

  // User Authentication & Saved Password State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_current_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    // Default registered account with active affiliate node
    return {
      id: 'usr-default-1',
      email: CONTRACTS.ALERT_EMAIL,
      username: 'TS_Ambassador_BNB',
      referralCode: 'TSBNB888',
      registeredAt: Date.now() - 86400000 * 14,
      walletAddress: '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      rememberMe: true,
      isRegistered: true,
    };
  });

  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_saved_credentials');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      email: CONTRACTS.ALERT_EMAIL,
      password: 'TSBotPassword2026!',
    };
  });

  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);

  // Binance Mining Cloud & Boosted Engine State
  const [binanceCloud, setBinanceCloud] = useState<BinanceMiningCloudState>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_binance_cloud');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      connected: true,
      poolEndpoint: BINANCE_CLOUD_MINING.STRATUM_URL,
      region: 'Frankfurt (EU-Central)',
      hashrateTh: BINANCE_CLOUD_MINING.DEFAULT_HASHRATE_TH,
      baseHashrateTh: BINANCE_CLOUD_MINING.DEFAULT_HASHRATE_TH,
      multiplier: 1,
      activeWorkerId: BINANCE_CLOUD_MINING.DEFAULT_WORKER,
      acceptedShares: 18492,
      rejectedShares: 5,
      efficiencyPct: 99.97,
      lastBoostTimestamp: Date.now() - 3600000,
      isBoostActive: false,
      totalMinedFromCloudBnb: 0.0264,
    };
  });

  const [cloudShares, setCloudShares] = useState<CloudMiningShare[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_cloud_shares');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'share-1',
        timestamp: Date.now() - 4000,
        blockNumber: 38429104,
        workerId: 'binance_worker_tsbnb_node01',
        difficulty: '131.07K',
        hashrateTh: 245.8,
        shareStatus: 'ACCEPTED',
        rewardBnb: 0.000042,
        nonce: '0x7f9a21b4',
      },
      {
        id: 'share-2',
        timestamp: Date.now() - 8000,
        blockNumber: 38429103,
        workerId: 'binance_worker_tsbnb_node01',
        difficulty: '131.07K',
        hashrateTh: 246.1,
        shareStatus: 'VALIDATED',
        rewardBnb: 0.000039,
        nonce: '0x3c81e05a',
      },
      {
        id: 'share-3',
        timestamp: Date.now() - 12000,
        blockNumber: 38429102,
        workerId: 'binance_worker_tsbnb_node01',
        difficulty: '131.07K',
        hashrateTh: 245.5,
        shareStatus: 'ACCEPTED',
        rewardBnb: 0.000041,
        nonce: '0x99a2c41d',
      },
    ];
  });

  // Second Generation Product: Connected TS Mining Machines Fleet
  const [connectedMachines, setConnectedMachines] = useState<ConnectedMachine[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_connected_machines');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m) => ({
            ...m,
            irdLinked: m.irdLinked ?? true,
            irdWalletAddress: m.irdWalletAddress || CONTRACTS.IRD_MASTER_NODE,
            irdFedMinesBnb: typeof m.irdFedMinesBnb === 'number' ? m.irdFedMinesBnb : (m.totalMinedBnb || 0),
          }));
        }
      }
    } catch (e) {}
    // Default initial pre-connected $500 Model TS-BNB-500 Pro flagship
    return [
      {
        id: 'mach-ts-500-init',
        packageId: 'ts-mm-500',
        model: 'TS-BNB-500 Pro',
        name: 'TS BNB Mining Machine Pro ($500 Model)',
        tier: 'PRO',
        priceUsd: 500,
        hashrateTh: 120,
        dailyYieldPct: 6.0,
        purchasedAt: Date.now() - 86400000 * 2,
        status: 'ONLINE',
        totalMinedBnb: 0.0976,
        powerW: 1780,
        temperatureC: 61,
        serialNumber: 'IRD-TS500-SN849204',
        irdLinked: true,
        irdWalletAddress: CONTRACTS.IRD_MASTER_NODE,
        irdFedMinesBnb: 0.0976,
        lastIrdFeedTimestamp: Date.now() - 3000,
      },
    ];
  });

  // IRD Blockchain Wallet Binding & Automated Mining Robot Feeding Pipeline
  const [irdWalletAddress, setIrdWalletAddressState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_ird_wallet_address');
      if (stored && stored.startsWith('0x')) return stored;
    } catch (e) {}
    return CONTRACTS.IRD_MASTER_NODE;
  });

  const setIrdWalletAddress = (addr: string) => {
    setIrdWalletAddressState(addr);
    try {
      localStorage.setItem('ts_bot_ird_wallet_address', addr);
    } catch (e) {}
    setConnectedMachines((prev) => {
      const updated = prev.map((m) => ({ ...m, irdWalletAddress: addr, irdLinked: true }));
      try {
        localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Single unified TS BOT + IRD balance in the same app (eliminates confusing split balance)
  const totalMinesFedToIrdBnb = accumulatedMiningYieldBnb;
  const totalMinesFedToIrdUsd = totalMinesFedToIrdBnb * 614.50;

  const [isMiningRobotFeedingIrd, setIsMiningRobotFeedingIrd] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_robot_feeding_ird');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return true; // Auto-feed enabled by default: Mining robot feeds the mines to IRD
  });

  const toggleMiningRobotAutoFeed = () => {
    setIsMiningRobotFeedingIrd((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ts_bot_mining_robot_feeding_ird', String(next));
      } catch (e) {}
      return next;
    });
  };

  const [irdFeedHistory, setIrdFeedHistory] = useState<IrdFeedEvent[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_ird_feed_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'ird-feed-init-1',
        timestamp: Date.now() - 3000,
        machineName: 'TS BNB Mining Machine Pro ($500 Model)',
        amountBnb: 0.00041,
        amountUsd: 0.25,
        source: 'MINING_ROBOT',
        targetIrdWallet: CONTRACTS.IRD_MASTER_NODE,
        txHash: '0x94b3c829d1a8e104b2a3f8901cb923e1104e90cb5491a92e105820bbca0821de',
        status: 'FED_TO_IRD',
        blockNumber: 38429104,
        note: 'Mining robot automated block reward feed to IRD Blockchain Wallet',
      },
      {
        id: 'ird-feed-init-2',
        timestamp: Date.now() - 6000,
        machineName: 'TS BOT Engine Autopilot',
        amountBnb: 0.00038,
        amountUsd: 0.23,
        source: 'MINING_ROBOT',
        targetIrdWallet: CONTRACTS.IRD_MASTER_NODE,
        txHash: '0x51a8e9401cb2901a88bb3901ca9013e89021e0410cb8921e04bb3801ea89104b',
        status: 'CONFIRMED',
        blockNumber: 38429103,
        note: 'BEP-20 TS/BNB liquidity arbitrage mining feed to IRD',
      },
    ];
  });

  // Cloud Air Drops Tokens & Meme Tokens State
  const [cloudAirdropTokens, setCloudAirdropTokens] = useState<CloudAirdropToken[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_airdrop_tokens');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missingTokens = INITIAL_CLOUD_AIRDROP_TOKENS.filter(
            (t) => !parsed.some((p: CloudAirdropToken) => p.id === t.id)
          );
          return [...missingTokens, ...parsed];
        }
      }
    } catch (e) {}
    return INITIAL_CLOUD_AIRDROP_TOKENS;
  });

  // Mining NFTs State (sync media, RWA value $1 TS BNB, linked NFTs & prepend new flagship NFTs across sessions)
  const [miningNfts, setMiningNfts] = useState<MiningNftAsset[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_nfts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const synced = parsed.map((nft: MiningNftAsset) => {
            const template = INITIAL_MINING_NFTS.find((t) => t.id === nft.id);
            return template
              ? {
                  ...nft,
                  image: template.image,
                  videoUrl: template.videoUrl ?? nft.videoUrl,
                  connectedPoolIds: nft.connectedPoolIds ?? template.connectedPoolIds ?? [],
                  linkedNftIds: nft.linkedNftIds ?? template.linkedNftIds ?? [],
                  rwaValueUsd: nft.rwaValueUsd ?? template.rwaValueUsd ?? 1.00,
                  isMemeNft: nft.isMemeNft ?? template.isMemeNft ?? false,
                  stakePoolApyBoostPct: nft.stakePoolApyBoostPct ?? template.stakePoolApyBoostPct ?? 4.0,
                  editionLabel: nft.editionLabel ?? template.editionLabel,
                }
              : {
                  ...nft,
                  connectedPoolIds: nft.connectedPoolIds ?? [],
                  linkedNftIds: nft.linkedNftIds ?? [],
                  rwaValueUsd: nft.rwaValueUsd ?? 1.00,
                  stakePoolApyBoostPct: nft.stakePoolApyBoostPct ?? 4.0,
                };
          });
          const missingTemplates = INITIAL_MINING_NFTS.filter(
            (t) => !synced.some((s: MiningNftAsset) => s.id === t.id)
          );
          return [...missingTemplates, ...synced];
        }
      }
    } catch (e) {}
    return INITIAL_MINING_NFTS;
  });

  // Connectable Appearing Business Google Ads State (Truworths, Jet, Game, etc.)
  const [adSlots, setAdSlots] = useState<AdCampaignSlot[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_ad_slots');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customAds = parsed.filter((s: AdCampaignSlot) => s.id?.startsWith('ad-custom-'));
          const syncedTemplates = INITIAL_AD_SLOTS.map((tpl) => {
            const existing = parsed.find((s: AdCampaignSlot) => s.id === tpl.id);
            return existing
              ? {
                  ...tpl,
                  connected: existing.connected,
                  impressions24h: existing.impressions24h ?? tpl.impressions24h,
                  totalEarnedUsd: existing.totalEarnedUsd ?? tpl.totalEarnedUsd,
                }
              : tpl;
          });
          return [...customAds, ...syncedTemplates];
        }
      }
    } catch (e) {}
    return INITIAL_AD_SLOTS;
  });

  // Auto Pop-Up Google Business Ads State (Appearing Business Ads Only)
  const [popupAdEnabled, setPopupAdEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_popup_ad_enabled');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return true;
  });
  const [activePopupAdId, setActivePopupAdId] = useState<string | null>(null);
  const [popupAdIndex, setPopupAdIndex] = useState<number>(0);

  // Video TS NFT Play Earnings & NFT Pool Collectable Balance
  const [isVideoNftPlaying, setIsVideoNftPlaying] = useState<boolean>(true);
  const [videoPlayEarningsUsd, setVideoPlayEarningsUsd] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_video_play_earnings_usd');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 1.25;
  });
  const [videoNftPoolEarningsUsd, setVideoNftPoolEarningsUsd] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_video_nft_pool_usd');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 2.40;
  });

  // Live ticker accruing money while playing the Video TS NFT & compounding NFT Pool yield
  useEffect(() => {
    if (!isVideoNftPlaying) return;
    const timer = setInterval(() => {
      setVideoPlayEarningsUsd((prev) => {
        const next = Number((prev + 0.04).toFixed(2));
        try {
          localStorage.setItem('ts_bot_video_play_earnings_usd', String(next));
        } catch (e) {}
        return next;
      });
      setVideoNftPoolEarningsUsd((prev) => {
        const activeOwnedCount = miningNfts.filter((n) => n.owned && n.isStakedFeeding).length;
        const poolBoostIncrement = 0.02 + activeOwnedCount * 0.01;
        const next = Number((prev + poolBoostIncrement).toFixed(2));
        try {
          localStorage.setItem('ts_bot_video_nft_pool_usd', String(next));
        } catch (e) {}
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [isVideoNftPlaying, miningNfts]);

  // CIP-95 Government Governance & Official Project Submission State
  const [cip95State, setCip95State] = useState<Cip95DRepState>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_cip95_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.drepId) return parsed;
      }
    } catch (e) {}
    return INITIAL_CIP95_DREP_STATE;
  });

  const [govSubmissions, setGovSubmissions] = useState<GovernmentSubmission[]>(() => {
    const normalizeSubmission = (s: GovernmentSubmission): GovernmentSubmission => ({
      ...s,
      submissionTrack: s.submissionTrack ?? 'DUAL_GOV_AND_TREASURY',
      treasuryAmountUsd: s.treasuryAmountUsd ?? 250000,
      treasuryAmountAda: s.treasuryAmountAda ?? 312500,
      treasuryDestination: s.treasuryDestination ?? CONTRACTS.RECHARGE_ROUTER_DEFI,
      voteYesCount: s.voteYesCount ?? 42,
      voteNoCount: s.voteNoCount ?? 2,
      voteAbstainCount: s.voteAbstainCount ?? 5,
      votePowerYesAda: s.votePowerYesAda ?? 125000,
      votingOpenOnline: s.votingOpenOnline ?? true,
    });
    try {
      const stored = localStorage.getItem('ts_bot_gov_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeSubmission);
        }
      }
    } catch (e) {}
    return [
      normalizeSubmission({
        id: 'gov-sub-init-1',
        submittedAt: Date.now() - 3600000,
        referenceCode: 'CIP95-ZA-2026-001',
        projectTitle: 'TS Protocol · Economic Federal De-Coin & RWA System',
        entityName: GOOGLE_ADS_DEFAULT_CONFIG.advertiserName,
        cipStandard: 'CIP-95 (Voltaire Governance) + Cardano ADA Stake Pool + BEP-20 Bridge',
        targetAgency: GOVERNMENT_SUBMISSION_AGENCIES[1],
        drepId: INITIAL_CIP95_DREP_STATE.drepId,
        liveAppUrl: `${CONTRACTS.LIVE_APP_URL}/?tab=gov`,
        assetSummary: 'TS Sovereign Video NFT (#TS-VID-001), Cardamom RWA, Treasury Bills, Gold & Cardano ADA Pools',
        adNetworkSummary: '16 Retail Business Google Ads Ready for Gov Launch (Truworths, Jet, Game, Woolworths, PEP, Vodacom, MTN)',
        anchorHash: 'sha256:95a4e1c8d72f0318b490c1a67e4f28d0194b76e2088fa34e1190c3d2a78f0912',
        submissionTrack: 'DUAL_GOV_AND_TREASURY',
        treasuryAmountUsd: 250000,
        treasuryAmountAda: 312500,
        treasuryDestination: CONTRACTS.RECHARGE_ROUTER_DEFI,
        voteYesCount: 42,
        voteNoCount: 2,
        voteAbstainCount: 5,
        votePowerYesAda: 125000,
        votingOpenOnline: true,
        status: 'VOTING_ONLINE',
      }),
    ];
  });

  // Google Ads Config & Conversion Attribution State
  const [googleAdsConfig, setGoogleAdsConfig] = useState<GoogleAdsConfig>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_google_ads_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.googleTagId) {
          return {
            ...GOOGLE_ADS_DEFAULT_CONFIG,
            ...parsed,
            kycVerified: true,
            advertiserName: GOOGLE_ADS_DEFAULT_CONFIG.advertiserName,
            verifiedChecks: GOOGLE_ADS_DEFAULT_CONFIG.verifiedChecks,
          };
        }
      }
    } catch (e) {}
    return GOOGLE_ADS_DEFAULT_CONFIG;
  });

  const [googleAdsConversions, setGoogleAdsConversions] = useState<GoogleAdsConversionEvent[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_google_ads_conversions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'gads-conv-init-1',
        timestamp: Date.now() - 45000,
        eventName: 'conversion',
        sendTo: `${GOOGLE_ADS_DEFAULT_CONFIG.googleTagId}/${GOOGLE_ADS_DEFAULT_CONFIG.conversionLabel}`,
        valueUsd: 25.00,
        currency: 'USD',
        source: 'Cardamom Export Commodity Pool Stake',
        dispatchedToGtag: true,
      },
      {
        id: 'gads-conv-init-2',
        timestamp: Date.now() - 120000,
        eventName: 'conversion',
        sendTo: `${GOOGLE_ADS_DEFAULT_CONFIG.googleTagId}/ts_nft_mint`,
        valueUsd: 16.00,
        currency: 'USD',
        source: 'TS Sovereign De-Coin Gold NFT (#TS-001)',
        dispatchedToGtag: true,
      },
    ];
  });

  // Initialize Google Ads (gtag.js) & Google AdSense scripts automatically when active
  useEffect(() => {
    if (googleAdsConfig.campaignStatus === 'ACTIVE' && googleAdsConfig.googleTagId) {
      initGoogleAdsTag(googleAdsConfig.googleTagId);
      initGoogleAdSense();
    }
  }, [googleAdsConfig.campaignStatus, googleAdsConfig.googleTagId]);

  // Appearing Business Pop-Up Google Ad Cadence
  const appearingBusinessAds = adSlots.filter((a) => a.connected);
  const popupPool = appearingBusinessAds.length > 0 ? appearingBusinessAds : adSlots;

  useEffect(() => {
    if (!popupAdEnabled || googleAdsConfig.campaignStatus !== 'ACTIVE' || popupPool.length === 0) {
      return;
    }
    const delayMs = activePopupAdId ? 65000 : 5000;
    const timer = setTimeout(() => {
      if (!activePopupAdId) {
        const nextAd = popupPool[popupAdIndex % popupPool.length];
        if (nextAd) {
          setActivePopupAdId(nextAd.id);
          setPopupAdIndex((idx) => (idx + 1) % popupPool.length);
        }
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [popupAdEnabled, googleAdsConfig.campaignStatus, activePopupAdId, popupPool, popupAdIndex]);

  // Mining Profit Feed Events History (Airdrops, Meme Tokens & NFTs feeding into mining profits)
  const [miningProfitFeedHistory, setMiningProfitFeedHistory] = useState<MiningProfitFeedEvent[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_profit_feed_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'feed-evt-1',
        timestamp: Date.now() - 15000,
        sourceType: 'NFT_RELIC',
        sourceName: 'TS Gold Hasher Genesis',
        symbolOrId: '#8801',
        amountBnb: 0.00084,
        amountUsd: 0.52,
        txHash: '0x72c1a94081eb92a410f39e84021bca51092a3f8401bc8e1a904f81e20a73c91a',
        blockNumber: 38429103,
      },
      {
        id: 'feed-evt-2',
        timestamp: Date.now() - 42000,
        sourceType: 'MEME_TOKEN',
        sourceName: 'Pepe BNB Meme',
        symbolOrId: 'PEPEBNB',
        amountBnb: 0.00051,
        amountUsd: 0.31,
        txHash: '0x38e9a1047c8b20e491a772c011f48e20c3b7192841d0f2a31b408c112f890e4b',
        blockNumber: 38429094,
      },
      {
        id: 'feed-evt-3',
        timestamp: Date.now() - 85000,
        sourceType: 'CLOUD_AIRDROP',
        sourceName: 'TS Cloud Airdrop',
        symbolOrId: 'TSAIR',
        amountBnb: 0.00039,
        amountUsd: 0.24,
        txHash: '0x11d8b4029e5a173c88f412e010a391b740e52f1903a8c44e921b07d812e901f2',
        blockNumber: 38429080,
      },
    ];
  });

  // Mining Feed State: Accumulates $1.00 USD every 24 hours continuously
  const [miningFeedEnabled, setMiningFeedEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_feed_enabled');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return true;
  });

  const [miningFeedAccumulatedUsd, setMiningFeedAccumulatedUsd] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_feed_usd');
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 0.25; // Initial 6h live progress toward $1.00 / 24h cycle
  });

  const [miningFeedTotalSettledUsd, setMiningFeedTotalSettledUsd] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_mining_feed_settled_usd');
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 1.00; // Initial completed 24h feed cycle ($1.00)
  });

  // Stake Pools & Real-Money Asset (RWA) Pools State
  const [stakePools, setStakePools] = useState<StakePool[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_stake_pools');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_STAKE_POOLS;
  });

  const [stakeHistory, setStakeHistory] = useState<StakePoolEvent[]>(() => {
    try {
      const stored = localStorage.getItem('ts_bot_stake_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'stk-init-1',
        timestamp: Date.now() - 120000,
        poolId: 'cardamom-rwa',
        poolName: 'Cardamom Export Commodity Pool',
        action: 'STAKE',
        amountUsd: 25.00,
        amountBnb: Number((25.00 / 614.50).toFixed(6)),
        paymentMethod: 'USDT',
        txHash: '0x94a7c21088db41e09f2a31c90a11b20e44a72f19c8e11d3a92014c7b1e39a012',
        blockNumber: 38429072,
      },
      {
        id: 'stk-init-2',
        timestamp: Date.now() - 240000,
        poolId: 'tbill-money-pool',
        poolName: 'US Treasury Bills Cash Reserve Pool',
        action: 'STAKE',
        amountUsd: 50.00,
        amountBnb: Number((50.00 / 614.50).toFixed(6)),
        paymentMethod: 'USDT',
        txHash: '0x52b8e04129cf30b712d4a8e910c321a774f02e81b9d22c14019a83e6d021f4b8',
        blockNumber: 38429055,
      },
    ];
  });

  // Check URL query parameters on load for ?ref=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        setPendingInviteCode(refParam.toUpperCase());
      }
    } catch (e) {}
  }, []);

  // Block counter simulation (BNB chain has ~3s block time)
  useEffect(() => {
    const blockTimer = setInterval(() => {
      setCurrentBlock((b) => b + 1);
    }, 3000);
    return () => clearInterval(blockTimer);
  }, []);

  // Bot Trading execution generator (Active trading figures start ONLY after recharging)
  const triggerSingleBotTrade = useCallback(() => {
    if (rechargeBalance <= 0) return;
    setPools((prevPools) => {
      const poolIndex = Math.random() > 0.4 ? 0 : 1;
      const targetPool = prevPools[poolIndex];
      const isBuy = Math.random() > 0.45;
      
      const tradeSizes = [0.15, 0.35, 0.8, 1.2, 2.5, 5.0];
      const bnbAmount = tradeSizes[Math.floor(Math.random() * tradeSizes.length)];
      const tsAmount = bnbAmount * 160 * (1 + (Math.random() * 0.02 - 0.01));

      let tokenIn: string;
      let tokenOut: string;
      let amountIn: number;
      let amountOut: number;

      if (targetPool.id === 'ts-bnb') {
        if (isBuy) {
          // Swapping BNB for TS
          tokenIn = 'BNB';
          tokenOut = 'TS';
          amountIn = bnbAmount;
          const result = calculateAmountOut(amountIn, targetPool.reserveB, targetPool.reserveA, targetPool.feeRate);
          amountOut = result.amountOut;
        } else {
          // Swapping TS for BNB
          tokenIn = 'TS';
          tokenOut = 'BNB';
          amountIn = tsAmount;
          const result = calculateAmountOut(amountIn, targetPool.reserveA, targetPool.reserveB, targetPool.feeRate);
          amountOut = result.amountOut;
        }
      } else {
        // TS / USDT
        if (isBuy) {
          tokenIn = 'USDT';
          tokenOut = 'TS';
          amountIn = bnbAmount * 600;
          const result = calculateAmountOut(amountIn, targetPool.reserveB, targetPool.reserveA, targetPool.feeRate);
          amountOut = result.amountOut;
        } else {
          tokenIn = 'TS';
          tokenOut = 'USDT';
          amountIn = tsAmount;
          const result = calculateAmountOut(amountIn, targetPool.reserveA, targetPool.reserveB, targetPool.feeRate);
          amountOut = result.amountOut;
        }
      }

      // Calculate trade fee
      const feeUsd = (amountIn * (tokenIn === 'BNB' ? 614.5 : tokenIn === 'USDT' ? 1.0 : 3.84)) * targetPool.feeRate;
      const tradeUsd = amountIn * (tokenIn === 'BNB' ? 614.5 : tokenIn === 'USDT' ? 1.0 : 3.84);

      // Create event
      const hexChars = '0123456789abcdef';
      let randomHash = '0x';
      for (let i = 0; i < 64; i++) {
        randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
      }

      const isArbitrage = Math.random() > 0.65;
      const tradeType: 'BUY' | 'SELL' | 'ARBITRAGE_REBALANCE' = isArbitrage ? 'ARBITRAGE_REBALANCE' : isBuy ? 'BUY' : 'SELL';

      const newTrade: TradeEvent = {
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
        type: tradeType,
        poolId: targetPool.id,
        tokenIn,
        tokenOut,
        amountIn: Number(amountIn.toFixed(4)),
        amountOut: Number(amountOut.toFixed(4)),
        price: 3.84 + (Math.random() * 0.04 - 0.02),
        txHash: randomHash,
        blockNumber: currentBlock + 1,
        gasUsedGwei: 3.0 + Math.random() * 1.5,
        slippagePct: Number((Math.random() * 0.15 + 0.02).toFixed(2)),
        botInitiated: true,
      };

      setTradeHistory((prev) => [newTrade, ...prev.slice(0, 49)]);

      // Update bot state stats
      setBotConfig((b) => ({
        ...b,
        totalSwapsExecuted: b.totalSwapsExecuted + 1,
        totalVolumeUsd: b.totalVolumeUsd + tradeUsd,
        totalFeesGeneratedUsd: b.totalFeesGeneratedUsd + feeUsd,
        lastAction: isArbitrage 
          ? `Auto-arbitrage: Captured $${(feeUsd * 1.8).toFixed(2)} cross-DEX spread for TS/BNB` 
          : `Automated ${tokenIn} -> ${tokenOut} liquidity routing executed`,
      }));

      // Accumulate accrued fee for user position if they have share in this pool
      setUserPositions((positions) =>
        positions.map((pos) => {
          if (pos.poolId === targetPool.id) {
            const userFeeCut = feeUsd * (pos.sharePercentage / 100);
            return {
              ...pos,
              accruedFeesUsd: pos.accruedFeesUsd + userFeeCut,
              currentValueUsd: pos.currentValueUsd + userFeeCut * 0.9,
            };
          }
          return pos;
        })
      );

      // Return updated pools with incremental volume & fees
      return prevPools.map((p, idx) => {
        if (idx === poolIndex) {
          return {
            ...p,
            volume24h: p.volume24h + tradeUsd,
            fees24h: p.fees24h + feeUsd,
          };
        }
        return p;
      });
    });
  }, [currentBlock, rechargeBalance]);

  // Real-time Mining Profit Accumulator (Recharged Balance + Connected Machines + Cloud Airdrops, Meme Tokens & Staked NFTs)
  useEffect(() => {
    const baseCloudMult = binanceCloud.connected ? (binanceCloud.multiplier || 1) : 1;
    const nftMultBonus = miningNfts
      .filter((n) => n.owned && n.isStakedFeeding)
      .reduce((sum, n) => sum + n.miningProfitMultiplier, 0);
    const tokenBoostPct = cloudAirdropTokens
      .filter((t) => t.isFeedingMining)
      .reduce((sum, t) => sum + t.miningBoostPct, 0);
    const mult = baseCloudMult + nftMultBonus + (tokenBoostPct / 100);
    
    const miningInterval = setInterval(() => {
      // 1. Yield from Recharged Balance (32% daily base -> $10 mines $3.20/day = $16.00 in 5 days)
      const rechargeDailyBnb = rechargeBalance > 0 ? (rechargeBalance * MINING_PACKAGE_RULES.DAILY_RATE * mult) : 0;

      // 2. Yield from Second Generation Connected Mining Machines (Active hardware fleet)
      const machinesDailyUsd = connectedMachines
        .filter((m) => m.status === 'ONLINE' || m.status === 'OVERCLOCKED')
        .reduce((sum, m) => {
          const overclockMultiplier = m.status === 'OVERCLOCKED' ? 1.20 : 1.0;
          return sum + (m.priceUsd * (m.dailyYieldPct / 100) * overclockMultiplier);
        }, 0);
      const machinesDailyBnb = (machinesDailyUsd / 614.50) * mult;

      // 3. Yield from Cloud Air Drops & Meme Tokens feeding Mining Profits
      const tokensDailyUsd = cloudAirdropTokens
        .filter((t) => t.isFeedingMining)
        .reduce((sum, t) => sum + t.dailyFeedUsd, 0);
      const tokensDailyBnb = tokensDailyUsd / 614.50;

      // 4. Yield from Staked NFTs feeding Mining Profits
      const nftsDailyUsd = miningNfts
        .filter((n) => n.owned && n.isStakedFeeding)
        .reduce((sum, n) => sum + n.dailyFeedUsd, 0);
      const nftsDailyBnb = nftsDailyUsd / 614.50;

      // 5. Base Mining Feed: accumulates $1.00 USD every 24 hours continuously
      const baseFeedDailyBnb = miningFeedEnabled ? MINING_FEED_RULES.DAILY_ACCUMULATION_BNB : 0;
      const baseFeedBlockUsd = miningFeedEnabled ? (MINING_FEED_RULES.DAILY_ACCUMULATION_USD * 3) / 86400 : 0;

      // 6. Connected Ad Campaign Slots revenue feeding Mining Profits & Stake Pools
      const adsDailyUsd = adSlots
        .filter((a) => a.connected)
        .reduce((sum, a) => sum + a.dailyRevenueUsd, 0);
      const adsDailyBnb = adsDailyUsd / 614.50;

      const totalDailyBnb = rechargeDailyBnb + machinesDailyBnb + tokensDailyBnb + nftsDailyBnb + baseFeedDailyBnb + adsDailyBnb;
      if (totalDailyBnb <= 0) return;

      const blockProfitBnb = (totalDailyBnb * 3) / 86400; // 3-second block generation step

      setAccumulatedMiningYieldBnb((prev) => {
        const next = prev + blockProfitBnb;
        try {
          localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
        } catch (e) {}
        return next;
      });

      if (miningFeedEnabled && baseFeedBlockUsd > 0) {
        setMiningFeedAccumulatedUsd((prev) => {
          const next = prev + baseFeedBlockUsd;
          if (next >= MINING_FEED_RULES.DAILY_ACCUMULATION_USD) {
            const remainder = next - MINING_FEED_RULES.DAILY_ACCUMULATION_USD;
            setMiningFeedTotalSettledUsd((sPrev) => {
              const sNext = sPrev + MINING_FEED_RULES.DAILY_ACCUMULATION_USD;
              try {
                localStorage.setItem('ts_bot_mining_feed_settled_usd', String(sNext));
              } catch (e) {}
              return sNext;
            });
            try {
              localStorage.setItem('ts_bot_mining_feed_usd', String(remainder));
            } catch (e) {}
            return remainder;
          }
          try {
            localStorage.setItem('ts_bot_mining_feed_usd', String(next));
          } catch (e) {}
          return next;
        });
      }

      // Increment fed counters on active Cloud Airdrop & Meme Tokens
      if (tokensDailyBnb > 0) {
        setCloudAirdropTokens((prev) => {
          const updated = prev.map((t) => {
            if (t.isFeedingMining) {
              const tBlockBnb = ((t.dailyFeedUsd / 614.50) * 3) / 86400;
              return { ...t, totalFedBnb: t.totalFedBnb + tBlockBnb };
            }
            return t;
          });
          try {
            localStorage.setItem('ts_bot_airdrop_tokens', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      // Increment fed counters on staked NFTs
      if (nftsDailyBnb > 0) {
        setMiningNfts((prev) => {
          const updated = prev.map((n) => {
            if (n.owned && n.isStakedFeeding) {
              const nBlockBnb = ((n.dailyFeedUsd / 614.50) * 3) / 86400;
              return { ...n, totalFedBnb: n.totalFedBnb + nBlockBnb };
            }
            return n;
          });
          try {
            localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      // Increment individual machine mined counters and IRD feed tracking
      if (machinesDailyBnb > 0) {
        setConnectedMachines((prev) => {
          const updated = prev.map((m) => {
            if (m.status === 'ONLINE' || m.status === 'OVERCLOCKED') {
              const overclockMultiplier = m.status === 'OVERCLOCKED' ? 1.20 : 1.0;
              const mDailyUsd = m.priceUsd * (m.dailyYieldPct / 100) * overclockMultiplier;
              const mBlockBnb = ((mDailyUsd / 614.50) * mult * 3) / 86400;
              return {
                ...m,
                totalMinedBnb: m.totalMinedBnb + mBlockBnb,
                irdFedMinesBnb: m.irdLinked ? m.irdFedMinesBnb + mBlockBnb : m.irdFedMinesBnb,
                lastIrdFeedTimestamp: m.irdLinked ? Date.now() : m.lastIrdFeedTimestamp,
              };
            }
            return m;
          });
          try {
            localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      // 5. Unified TS BOT & IRD feed stream (accumulatedMiningYieldBnb already holds the unified balance)
      if (isMiningRobotFeedingIrd && blockProfitBnb > 0) {
        try {
          localStorage.setItem('ts_bot_ird_fed_mines_bnb', String(accumulatedMiningYieldBnb + blockProfitBnb));
        } catch (e) {}

        // Periodically emit real-time automated IRD feed stream event
        if (Math.random() > 0.65) {
          let randomTx = '0x';
          for (let i = 0; i < 64; i++) {
            randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
          }
          const feedBatchBnb = blockProfitBnb * (2 + Math.random() * 2);
          const autoFeedEvent: IrdFeedEvent = {
            id: `ird-stream-${Date.now()}`,
            timestamp: Date.now(),
            machineName: 'TS BOT & IRD Unified Miner',
            amountBnb: Number(feedBatchBnb.toFixed(6)),
            amountUsd: Number((feedBatchBnb * 614.50).toFixed(4)),
            source: 'MINING_ROBOT',
            targetIrdWallet: irdWalletAddress,
            txHash: randomTx,
            status: 'FED_TO_IRD',
            blockNumber: currentBlock + 1,
            note: 'Unified TS BOT & IRD block profit credited in the same Mining Dashboard balance',
          };
          setIrdFeedHistory((prev) => [autoFeedEvent, ...prev.slice(0, 24)]);
        }
      }

      // 6. Stake Pools & Real-Money Asset (RWA) Yield Accrual (including connected TS NFT APY boosts)
      const getPoolBoostDailyPct = (poolId: string) => {
        const boostApy = miningNfts
          .filter((n) => n.owned && (n.connectedPoolIds || []).includes(poolId))
          .reduce((s, n) => s + (n.stakePoolApyBoostPct ?? 4.0), 0);
        return boostApy / 30;
      };

      const stakedDailyUsdTotal = stakePools
        .filter((sp) => sp.userStakedUsd > 0)
        .reduce((sum, sp) => sum + sp.userStakedUsd * ((sp.dailyRatePct + getPoolBoostDailyPct(sp.id)) / 100), 0);

      if (stakedDailyUsdTotal > 0) {
        let stakeFedMiningBnb = 0;
        setStakePools((prev) => {
          const updated = prev.map((sp) => {
            if (sp.userStakedUsd <= 0) return sp;
            const dailyUsd = sp.userStakedUsd * ((sp.dailyRatePct + getPoolBoostDailyPct(sp.id)) / 100);
            const blockUsd = (dailyUsd * 3) / 86400;
            const blockBnb = blockUsd / 614.50;
            if (sp.feedToMiningProfits) {
              stakeFedMiningBnb += blockBnb;
            }
            return {
              ...sp,
              accruedRewardsUsd: sp.accruedRewardsUsd + blockUsd,
              accruedRewardsBnb: sp.accruedRewardsBnb + blockBnb,
            };
          });
          try {
            localStorage.setItem('ts_bot_stake_pools', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        if (stakeFedMiningBnb > 0) {
          setAccumulatedMiningYieldBnb((prev) => {
            const next = prev + stakeFedMiningBnb;
            try {
              localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
            } catch (e) {}
            return next;
          });
        }
      }

      // 7. Connected Ads impressions & earnings ticker
      if (adsDailyBnb > 0) {
        setAdSlots((prev) => {
          const updated = prev.map((ad) => {
            if (!ad.connected) return ad;
            const adBlockUsd = (ad.dailyRevenueUsd * 3) / 86400;
            return {
              ...ad,
              impressions24h: ad.impressions24h + Math.floor(Math.random() * 4 + 1),
              totalEarnedUsd: ad.totalEarnedUsd + adBlockUsd,
            };
          });
          try {
            localStorage.setItem('ts_bot_ad_slots', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      // Update Binance Cloud telemetries
      if (binanceCloud.connected) {
        setBinanceCloud((prev) => ({
          ...prev,
          acceptedShares: prev.acceptedShares + 1,
          totalMinedFromCloudBnb: prev.totalMinedFromCloudBnb + blockProfitBnb,
          hashrateTh: Number((prev.baseHashrateTh * (prev.multiplier || 1) + (Math.random() * 2.0 - 1.0)).toFixed(1)),
        }));
      }
    }, 3000);

    return () => clearInterval(miningInterval);
  }, [rechargeBalance, connectedMachines, cloudAirdropTokens, miningNfts, stakePools, adSlots, miningFeedEnabled, binanceCloud.connected, binanceCloud.multiplier, binanceCloud.baseHashrateTh, isMiningRobotFeedingIrd, irdWalletAddress, currentBlock]);

  // Bot timer loop based on speed (Only runs after confirming recharge)
  useEffect(() => {
    if (!botConfig.active || rechargeBalance <= 0) return;
    const intervalMs = botConfig.tradingSpeed === 'turbo' ? 2000 : botConfig.tradingSpeed === 'fast' ? 4000 : 7000;
    const timer = setInterval(() => {
      triggerSingleBotTrade();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [botConfig.active, botConfig.tradingSpeed, triggerSingleBotTrade, rechargeBalance]);

  const triggerBotBurst = useCallback(() => {
    if (rechargeBalance <= 0) return;
    triggerSingleBotTrade();
  }, [triggerSingleBotTrade, rechargeBalance]);

  // Wallet Actions
  const connectWallet = (connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet') => {
    const dummyAddresses: Record<string, string> = {
      'MetaMask': '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      'Binance Wallet': '0x3Fe90785d1BA051ECdbC721c86e0828ACf48F2a',
      'Trust Wallet': '0x992B19b0785d1BA051ECdbC721c86e0828ACf439E',
    };
    setWallet({
      connected: true,
      address: dummyAddresses[connector] || '0x71C...a49B',
      network: 'BNB Smart Chain (Mainnet)',
      chainId: 56,
      balances: {
        BNB: 14.85,
        TS: 3800.0,
        USDT: 2500.0,
      },
      connector,
    });
  };

  const disconnectWallet = () => {
    setWallet({
      connected: false,
      address: null,
      network: 'Disconnected',
      chainId: 0,
      balances: { BNB: 0, TS: 0, USDT: 0 },
      connector: null,
    });
  };

  const switchNetwork = (network: string, chainId: number) => {
    setWallet((prev) => ({ ...prev, network, chainId }));
  };

  const claimFaucet = () => {
    setWallet((prev) => ({
      ...prev,
      balances: {
        BNB: prev.balances.BNB + 5.0,
        TS: prev.balances.TS + 2000.0,
        USDT: prev.balances.USDT + 1000.0,
      },
    }));
  };

  // Refresh the user's BNB and TS wallet token balances (automatically triggered after Recharge/Withdrawal)
  const refreshTokenBalances = useCallback(
    (source: 'RECHARGE' | 'WITHDRAWAL' | 'MANUAL' = 'MANUAL') => {
      let latestBalances = { ...walletRef.current.balances };
      try {
        const stored = localStorage.getItem('ts_bot_wallet_state');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.balances) {
            latestBalances = {
              ...latestBalances,
              BNB:
                typeof parsed.balances.BNB === 'number' && Number.isFinite(parsed.balances.BNB)
                  ? parsed.balances.BNB
                  : latestBalances.BNB,
              TS:
                typeof parsed.balances.TS === 'number' && Number.isFinite(parsed.balances.TS)
                  ? parsed.balances.TS
                  : latestBalances.TS,
              USDT:
                typeof parsed.balances.USDT === 'number' && Number.isFinite(parsed.balances.USDT)
                  ? parsed.balances.USDT
                  : latestBalances.USDT,
            };
          }
        }
      } catch (e) {}

      const syncedBalances = {
        ...latestBalances,
        BNB: Number(Math.max(0, latestBalances.BNB || 0).toFixed(6)),
        TS: Number(Math.max(0, latestBalances.TS || 0).toFixed(4)),
        USDT: Number(Math.max(0, latestBalances.USDT || 0).toFixed(4)),
      };

      const nextWallet: WalletState = {
        ...walletRef.current,
        balances: syncedBalances,
      };
      walletRef.current = nextWallet;
      setWallet(nextWallet);

      const refreshedAt = Date.now();
      setLastBalanceRefreshAt(refreshedAt);

      try {
        localStorage.setItem('ts_bot_wallet_state', JSON.stringify(nextWallet));
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ts:token-balances-refreshed', {
            detail: {
              BNB: syncedBalances.BNB,
              TS: syncedBalances.TS,
              USDT: syncedBalances.USDT,
              source,
              refreshedAt,
            },
          })
        );
      }

      return {
        BNB: syncedBalances.BNB,
        TS: syncedBalances.TS,
        USDT: syncedBalances.USDT,
        refreshedAt,
      };
    },
    []
  );

  // Add Liquidity (Non-custodial smart contract pool deposit)
  const addLiquidity = (poolId: string, amountA: number, amountB: number) => {
    const targetPool = pools.find((p) => p.id === poolId);
    if (!targetPool) return { success: false, message: 'Pool not found' };

    const tokenASymbol = targetPool.tokenA.symbol;
    const tokenBSymbol = targetPool.tokenB.symbol;

    if (wallet.balances[tokenASymbol] < amountA || wallet.balances[tokenBSymbol] < amountB) {
      return { success: false, message: `Insufficient balance in ${tokenASymbol} or ${tokenBSymbol}` };
    }

    // Deduct user balances
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [tokenASymbol]: prev.balances[tokenASymbol] - amountA,
        [tokenBSymbol]: prev.balances[tokenBSymbol] - amountB,
      },
    }));

    // Calculate LP minted
    const lpMinted = Math.sqrt(amountA * amountB);
    const newTotalSupply = targetPool.totalLpSupply + lpMinted;
    const sharePct = (lpMinted / newTotalSupply) * 100;
    const depositUsd = amountA * targetPool.tokenA.priceUsd + amountB * targetPool.tokenB.priceUsd;

    // Update pool reserves
    setPools((prevPools) =>
      prevPools.map((p) => {
        if (p.id === poolId) {
          return {
            ...p,
            reserveA: p.reserveA + amountA,
            reserveB: p.reserveB + amountB,
            totalLpSupply: newTotalSupply,
            tvlUsd: p.tvlUsd + depositUsd,
          };
        }
        return p;
      })
    );

    // Update or add position
    setUserPositions((prev) => {
      const existing = prev.find((pos) => pos.poolId === poolId);
      if (existing) {
        return prev.map((pos) => {
          if (pos.poolId === poolId) {
            const combinedLp = pos.lpTokens + lpMinted;
            return {
              ...pos,
              lpTokens: combinedLp,
              sharePercentage: (combinedLp / newTotalSupply) * 100,
              stakedTokenA: pos.stakedTokenA + amountA,
              stakedTokenB: pos.stakedTokenB + amountB,
              initialDepositUsd: pos.initialDepositUsd + depositUsd,
              currentValueUsd: pos.currentValueUsd + depositUsd,
            };
          }
          return pos;
        });
      } else {
        return [
          ...prev,
          {
            poolId,
            lpTokens: lpMinted,
            sharePercentage: sharePct,
            stakedTokenA: amountA,
            stakedTokenB: amountB,
            accruedFeesUsd: 0,
            initialDepositUsd: depositUsd,
            currentValueUsd: depositUsd,
            joinedAt: Date.now(),
          },
        ];
      }
    });

    return { 
      success: true, 
      message: `Successfully deposited ${amountA.toFixed(2)} ${tokenASymbol} + ${amountB.toFixed(3)} ${tokenBSymbol}. Minted ${lpMinted.toFixed(2)} LP tokens.` 
    };
  };

  // Remove Liquidity
  const removeLiquidity = (poolId: string, percentage: number) => {
    const position = userPositions.find((p) => p.poolId === poolId);
    const pool = pools.find((p) => p.id === poolId);
    if (!position || !pool || position.lpTokens <= 0) {
      return { success: false, message: 'No active liquidity position to remove' };
    }

    const burnLp = position.lpTokens * (percentage / 100);
    const returnFraction = burnLp / pool.totalLpSupply;
    const returnAmountA = pool.reserveA * returnFraction;
    const returnAmountB = pool.reserveB * returnFraction;
    const feeReward = position.accruedFeesUsd * (percentage / 100);

    // Credit balances back
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [pool.tokenA.symbol]: prev.balances[pool.tokenA.symbol] + returnAmountA,
        [pool.tokenB.symbol]: prev.balances[pool.tokenB.symbol] + returnAmountB + (pool.tokenB.symbol === 'BNB' ? feeReward / 614.5 : feeReward),
      },
    }));

    // Update pool
    setPools((prev) =>
      prev.map((p) => {
        if (p.id === poolId) {
          return {
            ...p,
            reserveA: p.reserveA - returnAmountA,
            reserveB: p.reserveB - returnAmountB,
            totalLpSupply: p.totalLpSupply - burnLp,
            tvlUsd: p.tvlUsd - (returnAmountA * p.tokenA.priceUsd + returnAmountB * p.tokenB.priceUsd),
          };
        }
        return p;
      })
    );

    // Update position
    setUserPositions((prev) =>
      prev
        .map((pos) => {
          if (pos.poolId === poolId) {
            const remainingLp = pos.lpTokens - burnLp;
            if (remainingLp <= 0.001) return null;
            return {
              ...pos,
              lpTokens: remainingLp,
              sharePercentage: (remainingLp / (pool.totalLpSupply - burnLp)) * 100,
              stakedTokenA: pos.stakedTokenA * (1 - percentage / 100),
              stakedTokenB: pos.stakedTokenB * (1 - percentage / 100),
              accruedFeesUsd: pos.accruedFeesUsd * (1 - percentage / 100),
              currentValueUsd: pos.currentValueUsd * (1 - percentage / 100),
            };
          }
          return pos;
        })
        .filter(Boolean) as UserPosition[]
    );

    return {
      success: true,
      message: `Withdrawn ${returnAmountA.toFixed(2)} ${pool.tokenA.symbol} and ${returnAmountB.toFixed(3)} ${pool.tokenB.symbol} (+ accrued trading fees).`,
    };
  };

  // Claim Pool Fees
  const claimPoolFees = (poolId: string) => {
    const position = userPositions.find((p) => p.poolId === poolId);
    if (!position || position.accruedFeesUsd <= 0.01) {
      return { success: false, message: 'No accumulated fee rewards to claim yet.' };
    }

    const fees = position.accruedFeesUsd;
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        USDT: prev.balances.USDT + fees,
      },
    }));

    setUserPositions((prev) =>
      prev.map((pos) => {
        if (pos.poolId === poolId) {
          return { ...pos, accruedFeesUsd: 0 };
        }
        return pos;
      })
    );

    return {
      success: true,
      message: `Claimed $${fees.toFixed(2)} USD in protocol trading fees directly to your wallet!`,
    };
  };

  // Execute Pre-calibrated Liquidity Tier ($10, $30, $50, $100, $200, $500, $1000)
  const executeTierPackage = (poolId: string, tierUsd: number) => {
    const pool = pools.find((p) => p.id === poolId) || pools[0];
    const halfUsd = tierUsd / 2;
    const amountA = halfUsd / pool.tokenA.priceUsd;
    const amountB = halfUsd / pool.tokenB.priceUsd;

    return addLiquidity(pool.id, amountA, amountB);
  };

  // Manual Swap
  const executeManualSwap = (poolId: string, fromTokenSymbol: string, amountIn: number) => {
    const pool = pools.find((p) => p.id === poolId);
    if (!pool) return { success: false, message: 'Pool not found' };

    const isTokenA = fromTokenSymbol === pool.tokenA.symbol;
    const reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
    const toTokenSymbol = isTokenA ? pool.tokenB.symbol : pool.tokenA.symbol;

    if (wallet.balances[fromTokenSymbol] < amountIn) {
      return { success: false, message: `Insufficient ${fromTokenSymbol} balance.` };
    }

    const { amountOut } = calculateAmountOut(amountIn, reserveIn, reserveOut, pool.feeRate);
    if (amountOut <= 0) return { success: false, message: 'Output amount too small.' };

    // Update wallet balances
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [fromTokenSymbol]: prev.balances[fromTokenSymbol] - amountIn,
        [toTokenSymbol]: prev.balances[toTokenSymbol] + amountOut,
      },
    }));

    // Update pool reserves
    setPools((prev) =>
      prev.map((p) => {
        if (p.id === poolId) {
          return {
            ...p,
            reserveA: isTokenA ? p.reserveA + amountIn : p.reserveA - amountOut,
            reserveB: isTokenA ? p.reserveB - amountOut : p.reserveB + amountIn,
            volume24h: p.volume24h + (isTokenA ? amountIn * p.tokenA.priceUsd : amountIn * p.tokenB.priceUsd),
          };
        }
        return p;
      })
    );

    // Create event
    const newTrade: TradeEvent = {
      id: 'tx-manual-' + Date.now(),
      timestamp: Date.now(),
      type: isTokenA ? 'SELL' : 'BUY',
      poolId,
      tokenIn: fromTokenSymbol,
      tokenOut: toTokenSymbol,
      amountIn,
      amountOut,
      price: isTokenA ? amountIn / amountOut : amountOut / amountIn,
      txHash: '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0'),
      blockNumber: currentBlock,
      gasUsedGwei: 3.0,
      slippagePct: 0.05,
      botInitiated: false,
    };
    setTradeHistory((prev) => [newTrade, ...prev.slice(0, 49)]);

    return {
      success: true,
      message: `Swapped ${amountIn.toFixed(4)} ${fromTokenSymbol} for ${amountOut.toFixed(4)} ${toTokenSymbol} via decentralized AMM.`,
    };
  };

  // Process Recharge BNB (Recharge crypto button form)
  // Activates Recharge Balance on Dashboard and starts active trading & 4% mining figures
  const processRechargeBnb = (amountBnb: number, txHashInput?: string, note?: string) => {
    // Generate valid simulated tx hash if not provided
    const hexChars = '0123456789abcdef';
    let randomHash = txHashInput?.trim() || '0x';
    if (!txHashInput) {
      for (let i = 0; i < 64; i++) {
        randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
      }
    }

    const newRechargeBal = rechargeBalance + amountBnb;
    setRechargeBalance(newRechargeBal);
    try {
      localStorage.setItem('ts_bot_recharge_balance', String(newRechargeBal));
    } catch (e) {}

    // Credit user's wallet balances synchronously & persist
    const creditedWallet: WalletState = {
      ...walletRef.current,
      balances: {
        ...walletRef.current.balances,
        BNB: Number((walletRef.current.balances.BNB + amountBnb).toFixed(6)),
      },
    };
    walletRef.current = creditedWallet;
    setWallet(creditedWallet);
    try {
      localStorage.setItem('ts_bot_wallet_state', JSON.stringify(creditedWallet));
    } catch (e) {}

    // Activate Trading Bot and initialize active trading figures
    const rechargeUsd = amountBnb * 614.5;
    setBotConfig((prev) => {
      const updated: BotConfig = {
        ...prev,
        active: true,
        totalSwapsExecuted: prev.totalSwapsExecuted === 0 ? 1 : prev.totalSwapsExecuted + 1,
        totalVolumeUsd: prev.totalVolumeUsd === 0 ? rechargeUsd : prev.totalVolumeUsd + rechargeUsd,
        totalFeesGeneratedUsd: prev.totalFeesGeneratedUsd === 0 ? rechargeUsd * 0.0025 : prev.totalFeesGeneratedUsd + (rechargeUsd * 0.0025),
        lastAction: `Recharge confirmed. Automated liquidity provisioning & 32% daily mining ($16.00 in 5 days per $10) activated for ${amountBnb.toFixed(4)} BNB.`,
      };
      try {
        localStorage.setItem('ts_bot_engine_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Create / enhance active liquidity mining position
    const lpMinted = Math.sqrt(amountBnb * (amountBnb * 160));
    setUserPositions((prev) => {
      const existing = prev.find((p) => p.poolId === 'ts-bnb');
      let updated: UserPosition[];
      if (existing) {
        updated = prev.map((p) =>
          p.poolId === 'ts-bnb'
            ? {
                ...p,
                lpTokens: p.lpTokens + lpMinted,
                stakedTokenA: p.stakedTokenA + amountBnb * 160,
                stakedTokenB: p.stakedTokenB + amountBnb,
                initialDepositUsd: p.initialDepositUsd + rechargeUsd,
                currentValueUsd: p.currentValueUsd + rechargeUsd,
              }
            : p
        );
      } else {
        updated = [
          {
            poolId: 'ts-bnb',
            lpTokens: Number(lpMinted.toFixed(4)),
            sharePercentage: Number(((amountBnb / (1000 + amountBnb)) * 100).toFixed(2)),
            stakedTokenA: Number((amountBnb * 160).toFixed(2)),
            stakedTokenB: Number(amountBnb.toFixed(4)),
            accruedFeesUsd: 0,
            initialDepositUsd: rechargeUsd,
            currentValueUsd: rechargeUsd,
            joinedAt: Date.now(),
          },
          ...prev,
        ];
      }
      try {
        localStorage.setItem('ts_bot_user_positions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Create first active trade event so live trade stream starts immediately
    const initTrade: TradeEvent = {
      id: 'tx-rec-' + Date.now(),
      timestamp: Date.now(),
      type: 'BUY',
      poolId: 'ts-bnb',
      tokenIn: 'BNB',
      tokenOut: 'TS',
      amountIn: Number((amountBnb * 0.5).toFixed(4)),
      amountOut: Number((amountBnb * 0.5 * 160).toFixed(2)),
      price: 3.84,
      txHash: randomHash,
      blockNumber: currentBlock,
      gasUsedGwei: 2.1,
      slippagePct: 0.05,
      botInitiated: true,
    };
    setTradeHistory((prev) => {
      const updated = [initTrade, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('ts_bot_trade_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Alert record for on-chain ledger (NO email dispatch requested for recharges; only withdrawals email sovereignstateofsouthafrica@gmail.com)
    const newAlert: CryptoAlert = {
      id: `alert-rec-${Date.now()}`,
      type: 'RECHARGE',
      asset: 'BNB',
      amountBnb,
      amountUsd: rechargeUsd,
      walletAddress: wallet.address || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: randomHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      recipientEmail: '', // Recharges do not request email alerts
      blockNumber: currentBlock,
      note: note || `BNB Recharge deposit received and verified on BEP-20 network. Recharge Balance credited: ${newRechargeBal.toFixed(4)} BNB.`,
    };

    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      try {
        localStorage.setItem('ts_bot_alerts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveAlertToast(newAlert);
    refreshTokenBalances('RECHARGE');

    return {
      success: true,
      alert: newAlert,
    };
  };

  // Helper to simulate or boost mined BNB yield (e.g. testing $16 mined requirement)
  const addMinedYieldBnb = (amountBnb: number) => {
    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + amountBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Process Withdrawal BNB (Withdrawal crypto button form)
  // RULE 1: Withdrawal starts from $15.00 USD
  // RULE 2: BNB miner must have mined $16.00 USD to withdraw $15.00 because of $1.00 Withdrawal charges
  // ONLY withdrawals must request on email: sovereignstateofsouthafrica@gmail.com
  const processWithdrawalBnb = (
    amountBnb: number, 
    recipientAddress: string, 
    note?: string,
    source: 'miner' | 'wallet' = 'miner'
  ) => {
    const bnbRate = WITHDRAWAL_RULES.BNB_PRICE_USD;
    const amountUsd = amountBnb * bnbRate;
    const withdrawalChargeUsd = WITHDRAWAL_RULES.WITHDRAWAL_CHARGE_USD; // $1.00
    const withdrawalChargeBnb = withdrawalChargeUsd / bnbRate; // ~0.001627 BNB
    const totalRequiredBnb = amountBnb + withdrawalChargeBnb;
    const totalRequiredUsd = amountUsd + withdrawalChargeUsd;

    // Rule 1: Withdrawal starts from $15.00 USD
    if (amountUsd < WITHDRAWAL_RULES.MIN_WITHDRAWAL_USD - 0.05) {
      return {
        success: false,
        message: `Withdrawal starts from $15.00 USD (${(WITHDRAWAL_RULES.MIN_WITHDRAWAL_USD / bnbRate).toFixed(4)} BNB). You requested $${amountUsd.toFixed(2)} USD.`,
      };
    }

    // Rule 2: BNB miner must have mined $16 to withdraw $15 because of Withdrawal charges
    const currentMinedUsd = accumulatedMiningYieldBnb * bnbRate;
    const minMinedNeededUsd = Math.max(WITHDRAWAL_RULES.MIN_MINED_REQUIRED_USD, totalRequiredUsd);
    const minMinedNeededBnb = minMinedNeededUsd / bnbRate;

    if (source === 'miner') {
      if (currentMinedUsd < minMinedNeededUsd - 0.05) {
        return {
          success: false,
          message: `BNB miner must have mined at least $${minMinedNeededUsd.toFixed(2)} USD (${minMinedNeededBnb.toFixed(4)} BNB) to withdraw $${amountUsd.toFixed(2)} USD because of the $1.00 withdrawal charge. Currently mined: $${currentMinedUsd.toFixed(2)} USD (${accumulatedMiningYieldBnb.toFixed(6)} BNB).`,
        };
      }
    } else {
      const totalAvailable = rechargeBalance + wallet.balances.BNB;
      if (totalAvailable < totalRequiredBnb) {
        return {
          success: false,
          message: `Insufficient balance. Required: ${totalRequiredBnb.toFixed(4)} BNB ($${totalRequiredUsd.toFixed(2)} USD with $1.00 withdrawal charge). Available: ${totalAvailable.toFixed(4)} BNB.`,
        };
      }
    }

    if (!recipientAddress || recipientAddress.trim().length < 10) {
      return {
        success: false,
        message: 'Invalid BNB (BEP-20) recipient address provided.',
      };
    }

    // Deduct balances accordingly while preserving non-decreasing achieved total
    if (source === 'miner') {
      const remainingMined = Math.max(0, accumulatedMiningYieldBnb - totalRequiredBnb);
      setAccumulatedMiningYieldBnb(remainingMined);
      setTotalWithdrawnFromMinerBnb((prev) => {
        const next = prev + totalRequiredBnb;
        try {
          localStorage.setItem('ts_bot_total_withdrawn_miner_bnb', String(next));
        } catch (e) {}
        return next;
      });
      setClaimedToWalletMiningBnb((prev) => {
        const next = Math.min(prev, remainingMined);
        try {
          localStorage.setItem('ts_bot_claimed_mining_bnb', String(next));
        } catch (e) {}
        return next;
      });
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(remainingMined));
      } catch (e) {}
    } else {
      // Deduct from recharge balance first, then wallet balance
      if (rechargeBalance >= totalRequiredBnb) {
        const remainingRecharge = rechargeBalance - totalRequiredBnb;
        setRechargeBalance(remainingRecharge);
        try {
          localStorage.setItem('ts_bot_recharge_balance', String(remainingRecharge));
        } catch (e) {}
      } else {
        const fromWallet = totalRequiredBnb - rechargeBalance;
        setRechargeBalance(0);
        try {
          localStorage.setItem('ts_bot_recharge_balance', '0');
        } catch (e) {}
        const updatedWallet: WalletState = {
          ...walletRef.current,
          balances: {
            ...walletRef.current.balances,
            BNB: Number(Math.max(0, walletRef.current.balances.BNB - fromWallet).toFixed(6)),
          },
        };
        walletRef.current = updatedWallet;
        setWallet(updatedWallet);
        try {
          localStorage.setItem('ts_bot_wallet_state', JSON.stringify(updatedWallet));
        } catch (e) {}
      }
    }

    const hexChars = '0123456789abcdef';
    let randomHash = '0x';
    for (let i = 0; i < 64; i++) {
      randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    // ONLY withdrawals dispatch email request to: sovereignstateofsouthafrica@gmail.com
    const newAlert: CryptoAlert = {
      id: `alert-wd-${Date.now()}`,
      type: 'WITHDRAWAL',
      asset: 'BNB',
      amountBnb,
      amountUsd,
      withdrawalChargeUsd,
      withdrawalChargeBnb,
      totalDebitedBnb: totalRequiredBnb,
      walletAddress: recipientAddress.trim(),
      txHash: randomHash,
      timestamp: Date.now(),
      status: 'DISPATCHED',
      recipientEmail: CONTRACTS.ALERT_EMAIL, // sovereignstateofsouthafrica@gmail.com
      blockNumber: currentBlock,
      note: note || `Official BNB Withdrawal: $${amountUsd.toFixed(2)} (${amountBnb.toFixed(4)} BNB) dispatched. $${withdrawalChargeUsd.toFixed(2)} withdrawal charge applied ($${totalRequiredUsd.toFixed(2)} total debited from miner). Official verification sent to ${CONTRACTS.ALERT_EMAIL}`,
    };

    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      try {
        localStorage.setItem('ts_bot_alerts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveAlertToast(newAlert);
    refreshTokenBalances('WITHDRAWAL');

    return {
      success: true,
      message: `Withdrawal request of ${amountBnb.toFixed(4)} BNB ($${amountUsd.toFixed(2)} USD) submitted! $${withdrawalChargeUsd.toFixed(2)} withdrawal charge applied. Official verification request dispatched to ${CONTRACTS.ALERT_EMAIL}.`,
      alert: newAlert,
    };
  };

  // Connect Google account for Gmail withdrawal authorization delivery
  const connectGmailAuthorization = async () => {
    setIsGmailSigningIn(true);
    try {
      const result = await googleSignInForGmail();
      setGmailAuthorized(true);
      setGmailNeedsAuth(false);
      setGmailAccountEmail(result.user.email);
      setGmailLastSyncMessage(
        `Gmail withdrawal authorization synced for ${result.user.email || CONTRACTS.ALERT_EMAIL}.`
      );
      return { success: true, email: result.user.email || CONTRACTS.ALERT_EMAIL };
    } catch (err: any) {
      const errMsg = err?.message || 'Google Sign-In was cancelled or blocked.';
      setGmailLastSyncMessage(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsGmailSigningIn(false);
    }
  };

  const disconnectGmailAuthorization = async () => {
    await logoutGmailAuth();
    setGmailAuthorized(false);
    setGmailNeedsAuth(true);
    setGmailAccountEmail(null);
    setGmailLastSyncMessage('Gmail withdrawal authorization disconnected.');
  };

  const dispatchWithdrawalEmailForAlert = async (
    alertOrId: CryptoAlert | string
  ): Promise<WithdrawalEmailResult> => {
    const targetAlert =
      typeof alertOrId === 'string'
        ? alerts.find((a) => a.id === alertOrId)
        : alertOrId;
    if (!targetAlert) {
      return { delivered: false, error: 'Withdrawal alert record not found.' };
    }

    const emailRes = await sendWithdrawalAuthorizationEmail({
      recipientEmail: targetAlert.recipientEmail || CONTRACTS.ALERT_EMAIL,
      amountBnb: targetAlert.amountBnb,
      amountUsd: targetAlert.amountUsd,
      withdrawalChargeUsd: targetAlert.withdrawalChargeUsd ?? 1.0,
      totalDebitedBnb: targetAlert.totalDebitedBnb ?? targetAlert.amountBnb,
      destinationAddress: targetAlert.walletAddress,
      txHash: targetAlert.txHash,
      blockNumber: targetAlert.blockNumber,
      source: targetAlert.note,
    });

    if (emailRes.needsAuth) {
      setGmailAuthorized(false);
      setGmailNeedsAuth(true);
    }

    const patch: Partial<CryptoAlert> = emailRes.delivered
      ? {
          gmailDeliveryStatus: 'SENT',
          gmailMessageId: emailRes.messageId,
          gmailSentFrom: emailRes.sentFrom,
          gmailError: undefined,
        }
      : {
          gmailDeliveryStatus: emailRes.needsAuth ? 'NEEDS_AUTH' : 'FAILED',
          gmailError: emailRes.error,
        };

    setAlerts((prev) => {
      const updated = prev.map((a) =>
        a.id === targetAlert.id ? { ...a, ...patch } : a
      );
      try {
        localStorage.setItem('ts_bot_alerts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveAlertToast((prev) =>
      prev && prev.id === targetAlert.id ? { ...prev, ...patch } : prev
    );

    if (emailRes.delivered) {
      setGmailLastSyncMessage(
        `Email sent to ${CONTRACTS.ALERT_EMAIL} (Message ID: ${emailRes.messageId}).`
      );
    } else if (emailRes.error) {
      setGmailLastSyncMessage(emailRes.error);
    }

    return emailRes;
  };

  const sendTestWithdrawalAuthEmail = async (): Promise<WithdrawalEmailResult> => {
    let hex = '0x';
    for (let i = 0; i < 64; i++) {
      hex += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }
    const emailRes = await sendWithdrawalAuthorizationEmail({
      recipientEmail: CONTRACTS.ALERT_EMAIL,
      amountBnb: 0.02441,
      amountUsd: 15.0,
      withdrawalChargeUsd: 1.0,
      totalDebitedBnb: 0.026037,
      destinationAddress: walletRef.current.address || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: hex,
      blockNumber: currentBlock,
      source: 'Gmail Withdrawal Authorization Sync Check',
      isTestSync: true,
    });
    if (emailRes.needsAuth) {
      setGmailAuthorized(false);
      setGmailNeedsAuth(true);
    }
    if (emailRes.delivered) {
      setGmailLastSyncMessage(
        `Verification sync email delivered to ${CONTRACTS.ALERT_EMAIL} (ID: ${emailRes.messageId}).`
      );
    } else if (emailRes.error) {
      setGmailLastSyncMessage(emailRes.error);
    }
    return emailRes;
  };

  // Sync/Claim Daily Mining Yield to Wallet WITHOUT zeroing or decreasing the Mining Dashboard balance
  const claimMiningYield = () => {
    if (accumulatedMiningYieldBnb <= 0.00001) {
      return {
        success: false,
        message: 'No accumulated mining profit available yet.',
        amountBnb: 0,
      };
    }

    const unclaimedDelta = Number(Math.max(0, accumulatedMiningYieldBnb - claimedToWalletMiningBnb).toFixed(6));
    if (unclaimedDelta <= 0.00001) {
      return {
        success: true,
        message: `All ${accumulatedMiningYieldBnb.toFixed(6)} BNB ($${(accumulatedMiningYieldBnb * 614.5).toFixed(2)}) in your unified TS BOT & IRD Mining Dashboard is already synced and ready for withdrawal.`,
        amountBnb: 0,
      };
    }

    const nextClaimedMarker = accumulatedMiningYieldBnb;
    setClaimedToWalletMiningBnb(nextClaimedMarker);
    try {
      localStorage.setItem('ts_bot_claimed_mining_bnb', String(nextClaimedMarker));
    } catch (e) {}

    const nextWallet: WalletState = {
      ...walletRef.current,
      balances: {
        ...walletRef.current.balances,
        BNB: Number((walletRef.current.balances.BNB + unclaimedDelta).toFixed(6)),
      },
    };
    walletRef.current = nextWallet;
    setWallet(nextWallet);
    try {
      localStorage.setItem('ts_bot_wallet_state', JSON.stringify(nextWallet));
    } catch (e) {}
    refreshTokenBalances('MANUAL');

    return {
      success: true,
      message: `Synced +${unclaimedDelta.toFixed(6)} BNB ($${(unclaimedDelta * 614.5).toFixed(2)}) profit to wallet while keeping your ${accumulatedMiningYieldBnb.toFixed(6)} BNB Mining Dashboard balance intact for withdrawal!`,
      amountBnb: unclaimedDelta,
    };
  };

  // Binance Mining Cloud methods
  const connectBinanceMiningCloud = (regionName: string = 'Frankfurt (EU-Central)') => {
    setBinanceCloud((prev) => {
      const updated = {
        ...prev,
        connected: true,
        region: regionName,
        hashrateTh: Number((prev.baseHashrateTh * (prev.multiplier || 1)).toFixed(1)),
      };
      try {
        localStorage.setItem('ts_bot_binance_cloud', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const disconnectBinanceMiningCloud = () => {
    setBinanceCloud((prev) => {
      const updated = {
        ...prev,
        connected: false,
        hashrateTh: 0,
      };
      try {
        localStorage.setItem('ts_bot_binance_cloud', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const setCloudRegion = (regionId: string) => {
    const reg = BINANCE_CLOUD_MINING.REGIONS.find((r) => r.id === regionId);
    if (!reg) return;
    setBinanceCloud((prev) => {
      const updated = {
        ...prev,
        region: reg.name,
      };
      try {
        localStorage.setItem('ts_bot_binance_cloud', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const setMiningMultiplier = (multiplier: number) => {
    const tier = BINANCE_CLOUD_MINING.BOOST_TIERS.find((t) => t.multiplier === multiplier) || BINANCE_CLOUD_MINING.BOOST_TIERS[0];
    const newHash = Number((BINANCE_CLOUD_MINING.DEFAULT_HASHRATE_TH + tier.bonusHashTh).toFixed(1));
    setBinanceCloud((prev) => {
      const updated = {
        ...prev,
        multiplier,
        hashrateTh: newHash,
      };
      try {
        localStorage.setItem('ts_bot_binance_cloud', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const boostMiningEngine = (targetMultiplier?: number) => {
    const chosenMult = targetMultiplier || (binanceCloud.multiplier >= 10 ? 10 : (binanceCloud.multiplier === 1 ? 2 : binanceCloud.multiplier === 2 ? 5 : 10));
    const tier = BINANCE_CLOUD_MINING.BOOST_TIERS.find((t) => t.multiplier === chosenMult) || BINANCE_CLOUD_MINING.BOOST_TIERS[1];
    const boostedHash = Number((BINANCE_CLOUD_MINING.DEFAULT_HASHRATE_TH + tier.bonusHashTh).toFixed(1));

    // Instant block reward burst added to miner yield (helps reach or exceed $16 threshold required for $15 withdrawal)
    const instantBurstBnb = Number((0.0055 * chosenMult).toFixed(6));
    
    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + instantBurstBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    setBinanceCloud((prev) => {
      const updated: BinanceMiningCloudState = {
        ...prev,
        connected: true,
        multiplier: chosenMult,
        hashrateTh: boostedHash,
        isBoostActive: true,
        lastBoostTimestamp: Date.now(),
        acceptedShares: prev.acceptedShares + 12,
        totalMinedFromCloudBnb: prev.totalMinedFromCloudBnb + instantBurstBnb,
      };
      try {
        localStorage.setItem('ts_bot_binance_cloud', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Add boosted block share record
    const hexChars = '0123456789abcdef';
    let randomNonce = '0x';
    for (let i = 0; i < 8; i++) {
      randomNonce += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const newShare: CloudMiningShare = {
      id: `share-boost-${Date.now()}`,
      timestamp: Date.now(),
      blockNumber: currentBlock,
      workerId: binanceCloud.activeWorkerId,
      difficulty: `${(131.07 * chosenMult).toFixed(2)}K`,
      hashrateTh: boostedHash,
      shareStatus: 'BOOSTED',
      rewardBnb: instantBurstBnb,
      nonce: randomNonce,
    };

    setCloudShares((prev) => {
      const updated = [newShare, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('ts_bot_cloud_shares', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Binance Mining Cloud Engine Boosted to ${chosenMult}x (${tier.name})! Hashrate overclocked to ${boostedHash} TH/s. +${instantBurstBnb.toFixed(4)} BNB ($${(instantBurstBnb * 614.5).toFixed(2)}) instant block reward credited!`,
      addedBnb: instantBurstBnb,
      newHashrateTh: boostedHash,
    };
  };

  // Second Generation Product: TS Mining Machines Management
  const buyMiningMachinePackage = (
    packageId: string,
    paymentMethod: 'BNB' | 'USDT' | 'RECHARGE' = 'BNB'
  ) => {
    const pkg = TS_MINING_MACHINE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Invalid mining machine package selected.' };
    }

    const bnbRate = 614.50;
    const bnbCost = pkg.priceUsd / bnbRate;
    const usdtCost = pkg.priceUsd;

    if (paymentMethod === 'BNB') {
      if (wallet.balances.BNB < bnbCost) {
        return {
          success: false,
          message: `Insufficient BNB balance in wallet. Required: ${bnbCost.toFixed(4)} BNB ($${pkg.priceUsd}), available: ${wallet.balances.BNB.toFixed(4)} BNB.`,
        };
      }
      setWallet((prev) => ({
        ...prev,
        balances: {
          ...prev.balances,
          BNB: prev.balances.BNB - bnbCost,
        },
      }));
    } else if (paymentMethod === 'USDT') {
      if (wallet.balances.USDT < usdtCost) {
        return {
          success: false,
          message: `Insufficient USDT balance. Required: ${usdtCost.toFixed(2)} USDT, available: ${wallet.balances.USDT.toFixed(2)} USDT.`,
        };
      }
      setWallet((prev) => ({
        ...prev,
        balances: {
          ...prev.balances,
          USDT: prev.balances.USDT - usdtCost,
        },
      }));
    } else if (paymentMethod === 'RECHARGE') {
      if (rechargeBalance < bnbCost) {
        return {
          success: false,
          message: `Insufficient Recharge Balance. Required: ${bnbCost.toFixed(4)} BNB ($${pkg.priceUsd}), available: ${rechargeBalance.toFixed(4)} BNB.`,
        };
      }
      setRechargeBalance((prev) => {
        const next = Math.max(0, prev - bnbCost);
        try {
          localStorage.setItem('ts_bot_recharge_balance', String(next));
        } catch (e) {}
        return next;
      });
    }

    // Generate unique hardware serial number
    const hexChars = '0123456789ABCDEF';
    let serialSn = `IRD-TS${pkg.priceUsd}-SN`;
    for (let i = 0; i < 6; i++) {
      serialSn += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const newMachine: ConnectedMachine = {
      id: `mach-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      packageId: pkg.id,
      model: pkg.model,
      name: pkg.name,
      tier: pkg.tier,
      priceUsd: pkg.priceUsd,
      hashrateTh: pkg.hashrateTh,
      dailyYieldPct: pkg.dailyYieldPct,
      purchasedAt: Date.now(),
      status: 'ONLINE',
      totalMinedBnb: 0,
      powerW: pkg.powerConsumptionW,
      temperatureC: 58 + Math.floor(Math.random() * 6),
      serialNumber: serialSn,
      irdLinked: true,
      irdWalletAddress: irdWalletAddress,
      irdFedMinesBnb: 0,
      lastIrdFeedTimestamp: Date.now(),
    };

    setConnectedMachines((prev) => {
      const updated = [newMachine, ...prev];
      try {
        localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Overclock & boost Binance Cloud pool with machine hashrate
    setBinanceCloud((prev) => ({
      ...prev,
      baseHashrateTh: prev.baseHashrateTh + pkg.hashrateTh,
      hashrateTh: prev.hashrateTh + (pkg.hashrateTh * (prev.multiplier || 1)),
      acceptedShares: prev.acceptedShares + 25,
    }));

    // Record on-chain purchase event in ledger
    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const newAlert: CryptoAlert = {
      id: `alert-mach-${Date.now()}`,
      type: 'RECHARGE',
      asset: 'BNB',
      amountBnb: bnbCost,
      amountUsd: pkg.priceUsd,
      walletAddress: wallet.address || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: randomTx,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      recipientEmail: '',
      blockNumber: currentBlock,
      note: `Bought Second Generation Mining Machine: ${pkg.name} (${pkg.model}, ${pkg.hashrateTh} TH/s). Serial: ${serialSn}. Linked to IRD Blockchain Wallet (${shortenAddress(irdWalletAddress)}). Connected to Binance Stratum pool.`,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveAlertToast(newAlert);

    // Also record initial IRD link event
    const irdLinkEvent: IrdFeedEvent = {
      id: `ird-buy-${Date.now()}`,
      timestamp: Date.now(),
      machineId: newMachine.id,
      machineName: newMachine.name,
      amountBnb: 0,
      amountUsd: 0,
      source: 'HARDWARE_RIG',
      targetIrdWallet: irdWalletAddress,
      txHash: randomTx,
      status: 'CONFIRMED',
      blockNumber: currentBlock,
      note: `Hardware Rig ${newMachine.model} (S/N: ${serialSn}) Linked to IRD Blockchain Wallet. Mining Robot feeding activated.`,
    };
    setIrdFeedHistory((prev) => [irdLinkEvent, ...prev.slice(0, 24)]);

    return {
      success: true,
      message: `🎉 Successfully purchased ${pkg.name}! Hardware S/N: ${serialSn} is now CONNECTED and LINKED to IRD Blockchain Wallet (${shortenAddress(irdWalletAddress)}) with ${pkg.dailyYieldPct}% daily yield!`,
      machine: newMachine,
    };
  };

  const connectMiningMachine = (machineId: string) => {
    setConnectedMachines((prev) => {
      const updated = prev.map((m) => m.id === machineId ? { ...m, status: 'ONLINE' as const } : m);
      try {
        localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const disconnectMiningMachine = (machineId: string) => {
    setConnectedMachines((prev) => {
      const updated = prev.map((m) => m.id === machineId ? { ...m, status: 'MAINTENANCE' as const } : m);
      try {
        localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const toggleMachineOverclock = (machineId: string) => {
    setConnectedMachines((prev) => {
      const updated = prev.map((m) => {
        if (m.id === machineId) {
          const nextStatus = m.status === 'OVERCLOCKED' ? 'ONLINE' : 'OVERCLOCKED';
          return {
            ...m,
            status: nextStatus as 'ONLINE' | 'OVERCLOCKED',
            temperatureC: nextStatus === 'OVERCLOCKED' ? 69 : 60,
          };
        }
        return m;
      });
      try {
        localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Link any mining machine directly to IRD Blockchain Wallet
  const linkMachineToIrd = (machineId: string, customIrdAddress?: string) => {
    const targetAddr = customIrdAddress || irdWalletAddress;
    setConnectedMachines((prev) => {
      const updated = prev.map((m) =>
        m.id === machineId
          ? {
              ...m,
              irdLinked: true,
              irdWalletAddress: targetAddr,
            }
          : m
      );
      try {
        localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const targetMachine = connectedMachines.find((m) => m.id === machineId);

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const newFeedEvent: IrdFeedEvent = {
      id: `ird-link-${Date.now()}`,
      timestamp: Date.now(),
      machineId,
      machineName: targetMachine?.name || 'TS Mining Rig',
      amountBnb: targetMachine?.totalMinedBnb || 0.005,
      amountUsd: (targetMachine?.totalMinedBnb || 0.005) * 614.50,
      source: 'HARDWARE_RIG',
      targetIrdWallet: targetAddr,
      txHash: randomTx,
      status: 'CONFIRMED',
      blockNumber: currentBlock,
      note: `Machine ${targetMachine?.model || ''} successfully linked to IRD Blockchain Wallet (${shortenAddress(targetAddr)})`,
    };

    setIrdFeedHistory((prev) => [newFeedEvent, ...prev.slice(0, 24)]);

    return {
      success: true,
      message: `✅ Mining Machine ${targetMachine?.name || ''} successfully LINKED to IRD Blockchain Wallet! Mined rewards will automatically feed to ${shortenAddress(targetAddr)}.`,
    };
  };

  // Unified TS BOT & IRD Sync / Feed (keeps TS BOT & IRD in one shared balance, never decreasing Mining Dashboard)
  const feedMinesToIrd = (machineId?: string) => {
    let feedAmountBnb = 0;
    let sourceLabel: 'MINING_ROBOT' | 'HARDWARE_RIG' | 'CLOUD_CLUSTER' = 'MINING_ROBOT';
    let machineName = 'TS BOT & IRD Unified Miner';

    if (machineId) {
      const mach = connectedMachines.find((m) => m.id === machineId);
      if (mach) {
        const unsyncedMachineBnb = Math.max(0, mach.totalMinedBnb - (mach.irdFedMinesBnb || 0));
        feedAmountBnb = unsyncedMachineBnb > 0.00005
          ? unsyncedMachineBnb
          : (mach.priceUsd * (mach.dailyYieldPct / 100)) / 614.50 / 24;
        sourceLabel = 'HARDWARE_RIG';
        machineName = mach.name;

        setConnectedMachines((prev) => {
          const updated = prev.map((m) =>
            m.id === machineId
              ? {
                  ...m,
                  irdFedMinesBnb: m.irdFedMinesBnb + feedAmountBnb,
                  lastIrdFeedTimestamp: Date.now(),
                }
              : m
          );
          try {
            localStorage.setItem('ts_bot_connected_machines', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        setAccumulatedMiningYieldBnb((prev) => {
          const next = prev + feedAmountBnb;
          try {
            localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
          } catch (e) {}
          return next;
        });
      }
    } else {
      feedAmountBnb = accumulatedMiningYieldBnb;
      sourceLabel = 'MINING_ROBOT';
      machineName = 'TS BOT & IRD Unified Balance';
    }

    const feedAmountUsd = feedAmountBnb * 614.50;

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const newFeedEvent: IrdFeedEvent = {
      id: `ird-feed-${Date.now()}`,
      timestamp: Date.now(),
      machineId,
      machineName,
      amountBnb: feedAmountBnb,
      amountUsd: feedAmountUsd,
      source: sourceLabel,
      targetIrdWallet: irdWalletAddress,
      txHash: randomTx,
      status: 'FED_TO_IRD',
      blockNumber: currentBlock,
      note: `${machineName} unified balance confirmed: ${feedAmountBnb.toFixed(6)} BNB ($${feedAmountUsd.toFixed(2)}) ready in same-view TS BOT & IRD Dashboard.`,
    };

    setIrdFeedHistory((prev) => {
      const updated = [newFeedEvent, ...prev.slice(0, 24)];
      try {
        localStorage.setItem('ts_bot_ird_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const newAlert: CryptoAlert = {
      id: `alert-ird-${Date.now()}`,
      type: 'RECHARGE',
      asset: 'BNB',
      amountBnb: feedAmountBnb,
      amountUsd: feedAmountUsd,
      walletAddress: irdWalletAddress,
      txHash: randomTx,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      recipientEmail: '',
      blockNumber: currentBlock,
      note: `TS BOT & IRD Unified Balance Synced: ${feedAmountBnb.toFixed(6)} BNB ($${feedAmountUsd.toFixed(2)}) available in the same view.`,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveAlertToast(newAlert);

    return {
      success: true,
      message: machineId
        ? `⚡ Credited +${feedAmountBnb.toFixed(6)} BNB ($${feedAmountUsd.toFixed(2)}) from ${machineName} into your unified TS BOT & IRD Mining Balance!`
        : `✅ TS BOT & IRD Unified Balance synchronized (${feedAmountBnb.toFixed(6)} BNB / $${feedAmountUsd.toFixed(2)}) in the same view—ready to withdraw profits!`,
      amountBnb: feedAmountBnb,
      amountUsd: feedAmountUsd,
      txHash: randomTx,
    };
  };

  // Claim Cloud Airdrop or Meme Token and optionally start feeding Mining Profits
  const claimAirdropToken = (tokenId: string) => {
    const token = cloudAirdropTokens.find((t) => t.id === tokenId);
    if (!token) return { success: false, message: 'Token not found.' };
    if (token.status !== 'CLAIMABLE') {
      return { success: false, message: `${token.symbol} airdrop has already been claimed.` };
    }

    const instantFeedBnb = Number(((token.dailyFeedUsd * 0.25) / 614.50).toFixed(6));

    setCloudAirdropTokens((prev) => {
      const updated = prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              claimedAmount: t.claimableAmount,
              isFeedingMining: true,
              status: 'FEEDING_MINING' as const,
              totalFedBnb: t.totalFedBnb + instantFeedBnb,
              lastClaimedAt: Date.now(),
            }
          : t
      );
      try {
        localStorage.setItem('ts_bot_airdrop_tokens', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + instantFeedBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: MiningProfitFeedEvent = {
      id: `feed-claim-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: token.category === 'MEME_TOKEN' ? 'MEME_TOKEN' : 'CLOUD_AIRDROP',
      sourceName: token.name,
      symbolOrId: token.symbol,
      amountBnb: instantFeedBnb,
      amountUsd: instantFeedBnb * 614.50,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [evt, ...prev.slice(0, 29)];
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Claimed ${token.claimableAmount.toLocaleString()} ${token.symbol} and routed liquidity into Mining Profits (+${instantFeedBnb.toFixed(4)} BNB instant boost, +${token.dailyFeedUsd.toFixed(2)} USD/day)!`,
    };
  };

  // Toggle whether a claimed Cloud Airdrop / Meme Token is actively feeding Mining Profits
  const toggleTokenFeedMining = (tokenId: string) => {
    const token = cloudAirdropTokens.find((t) => t.id === tokenId);
    if (!token) return { success: false, message: 'Token not found.' };
    if (token.status === 'CLAIMABLE') {
      return claimAirdropToken(tokenId);
    }

    const nextFeeding = !token.isFeedingMining;
    setCloudAirdropTokens((prev) => {
      const updated = prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              isFeedingMining: nextFeeding,
              status: nextFeeding ? ('FEEDING_MINING' as const) : ('CLAIMED' as const),
            }
          : t
      );
      try {
        localStorage.setItem('ts_bot_airdrop_tokens', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: nextFeeding
        ? `${token.symbol} is now feeding +${token.miningBoostPct}% mining boost ($${token.dailyFeedUsd.toFixed(2)}/day) into Mining Profits.`
        : `${token.symbol} mining profit feed paused.`,
    };
  };

  // Mint or Claim Mining NFT
  const mintOrClaimNft = (nftId: string) => {
    const nft = miningNfts.find((n) => n.id === nftId);
    if (!nft) return { success: false, message: 'NFT not found.' };
    if (nft.owned) return { success: false, message: `${nft.name} is already in your wallet.` };

    if (wallet.balances.BNB < nft.mintCostBnb) {
      return {
        success: false,
        message: `Insufficient BNB balance to mint ${nft.name}. Required: ${nft.mintCostBnb} BNB, available: ${wallet.balances.BNB.toFixed(4)} BNB.`,
      };
    }

    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        BNB: prev.balances.BNB - nft.mintCostBnb,
      },
    }));

    const instantNftFeed = Number(((nft.dailyFeedUsd * 0.2) / 614.50).toFixed(6));

    setMiningNfts((prev) => {
      const updated = prev.map((n) =>
        n.id === nftId
          ? {
              ...n,
              owned: true,
              isStakedFeeding: true,
              totalFedBnb: n.totalFedBnb + instantNftFeed,
            }
          : n
      );
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + instantNftFeed;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: MiningProfitFeedEvent = {
      id: `feed-nft-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'NFT_RELIC',
      sourceName: nft.name,
      symbolOrId: nft.tokenId,
      amountBnb: instantNftFeed,
      amountUsd: instantNftFeed * 614.50,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [evt, ...prev.slice(0, 29)];
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Minted & staked ${nft.name} (${nft.tokenId})! Now feeding +${nft.miningProfitMultiplier}x multiplier and $${nft.dailyFeedUsd.toFixed(2)}/day into Mining Profits.`,
    };
  };

  // Toggle staking an owned NFT to feed Mining Profits
  const toggleNftFeedMining = (nftId: string) => {
    const nft = miningNfts.find((n) => n.id === nftId);
    if (!nft) return { success: false, message: 'NFT not found.' };
    if (!nft.owned) {
      return mintOrClaimNft(nftId);
    }

    const nextStaked = !nft.isStakedFeeding;
    setMiningNfts((prev) => {
      const updated = prev.map((n) =>
        n.id === nftId ? { ...n, isStakedFeeding: nextStaked } : n
      );
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: nextStaked
        ? `${nft.name} (${nft.tokenId}) staked! Actively feeding +${nft.miningProfitMultiplier}x boost ($${nft.dailyFeedUsd.toFixed(2)}/day) to Mining Profits.`
        : `${nft.name} (${nft.tokenId}) unstaked from Mining Profit feeder.`,
    };
  };

  // Harvest all active Cloud Airdrop, Meme Token, and Staked NFT feeds into Mining Profits
  const harvestAllFeedsToMiningProfits = () => {
    const activeTokens = cloudAirdropTokens.filter((t) => t.isFeedingMining);
    const activeNfts = miningNfts.filter((n) => n.owned && n.isStakedFeeding);

    if (activeTokens.length === 0 && activeNfts.length === 0) {
      return {
        success: false,
        message: 'No active Cloud Airdrops, Meme Tokens, or Staked NFTs are feeding yet. Activate at least one asset first.',
        addedBnb: 0,
        addedUsd: 0,
      };
    }

    const totalDailyUsd =
      activeTokens.reduce((s, t) => s + t.dailyFeedUsd, 0) +
      activeNfts.reduce((s, n) => s + n.dailyFeedUsd, 0);

    // Harvest a 15% cycle settlement batch directly into Mining Profits
    const addedUsd = Number((totalDailyUsd * 0.15).toFixed(2));
    const addedBnb = Number((addedUsd / 614.50).toFixed(6));

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + addedBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    // Update fed tallies proportionally
    setCloudAirdropTokens((prev) => {
      const updated = prev.map((t) => {
        if (!t.isFeedingMining) return t;
        const shareBnb = ((t.dailyFeedUsd * 0.15) / 614.50);
        return { ...t, totalFedBnb: t.totalFedBnb + shareBnb };
      });
      try {
        localStorage.setItem('ts_bot_airdrop_tokens', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setMiningNfts((prev) => {
      const updated = prev.map((n) => {
        if (!n.owned || !n.isStakedFeeding) return n;
        const shareBnb = ((n.dailyFeedUsd * 0.15) / 614.50);
        return { ...n, totalFedBnb: n.totalFedBnb + shareBnb };
      });
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const newEvents: MiningProfitFeedEvent[] = [
      ...(activeNfts.length > 0
        ? [
            {
              id: `feed-harv-nft-${Date.now()}`,
              timestamp: Date.now(),
              sourceType: 'NFT_RELIC' as const,
              sourceName: `${activeNfts.length} Staked Mining NFTs`,
              symbolOrId: activeNfts.map((n) => n.tokenId).join(', '),
              amountBnb: Number(((activeNfts.reduce((s, n) => s + n.dailyFeedUsd, 0) * 0.15) / 614.50).toFixed(6)),
              amountUsd: Number((activeNfts.reduce((s, n) => s + n.dailyFeedUsd, 0) * 0.15).toFixed(2)),
              txHash: randomTx,
              blockNumber: currentBlock,
            },
          ]
        : []),
      ...(activeTokens.length > 0
        ? [
            {
              id: `feed-harv-tok-${Date.now() + 1}`,
              timestamp: Date.now(),
              sourceType: (activeTokens.some((t) => t.category === 'MEME_TOKEN') ? 'MEME_TOKEN' : 'CLOUD_AIRDROP') as 'MEME_TOKEN' | 'CLOUD_AIRDROP',
              sourceName: `${activeTokens.length} Airdrop & Meme Pools`,
              symbolOrId: activeTokens.map((t) => t.symbol).join('/'),
              amountBnb: Number(((activeTokens.reduce((s, t) => s + t.dailyFeedUsd, 0) * 0.15) / 614.50).toFixed(6)),
              amountUsd: Number((activeTokens.reduce((s, t) => s + t.dailyFeedUsd, 0) * 0.15).toFixed(2)),
              txHash: randomTx,
              blockNumber: currentBlock,
            },
          ]
        : []),
    ];

    setMiningProfitFeedHistory((prev) => {
      const updated = [...newEvents, ...prev].slice(0, 30);
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Harvested +${addedBnb.toFixed(4)} BNB ($${addedUsd.toFixed(2)}) from ${activeTokens.length} Airdrop/Meme pools and ${activeNfts.length} staked NFTs directly into Mining Profits!`,
      addedBnb,
      addedUsd,
    };
  };

  // Mining Feed ($1.00 / 24h) Toggle & Settlement Actions
  const toggleMiningFeed = () => {
    setMiningFeedEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ts_bot_mining_feed_enabled', String(next));
      } catch (e) {}
      return next;
    });
  };

  const collectMiningFeedToProfits = () => {
    if (miningFeedAccumulatedUsd < 0.01) {
      return {
        success: false,
        message: 'Mining feed is still accumulating ($1.00 every 24 hours). Wait for at least $0.01 USD or advance a 24h cycle.',
        addedUsd: 0,
        addedBnb: 0,
      };
    }

    const addedUsd = Number(miningFeedAccumulatedUsd.toFixed(4));
    const addedBnb = Number((addedUsd / WITHDRAWAL_RULES.BNB_PRICE_USD).toFixed(6));

    setMiningFeedAccumulatedUsd(0);
    setMiningFeedTotalSettledUsd((prev) => {
      const next = prev + addedUsd;
      try {
        localStorage.setItem('ts_bot_mining_feed_usd', '0');
        localStorage.setItem('ts_bot_mining_feed_settled_usd', String(next));
      } catch (e) {}
      return next;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + addedBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    try {
      localStorage.setItem('ts_bot_ird_fed_mines_bnb', String(accumulatedMiningYieldBnb + addedBnb));
    } catch (e) {}

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: MiningProfitFeedEvent = {
      id: `feed-24h-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'MINING_FEED',
      sourceName: '24h Mining Feed ($1.00 / 24h)',
      symbolOrId: '24H-FEED',
      amountBnb: addedBnb,
      amountUsd: addedUsd,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [evt, ...prev].slice(0, 30);
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Settled +$${addedUsd.toFixed(2)} USD (+${addedBnb.toFixed(6)} BNB) from Mining Feed into Mining Profits!`,
      addedUsd,
      addedBnb,
    };
  };

  const advance24hMiningFeed = () => {
    const addedUsd = MINING_FEED_RULES.DAILY_ACCUMULATION_USD; // $1.00 per 24h
    const addedBnb = Number((addedUsd / WITHDRAWAL_RULES.BNB_PRICE_USD).toFixed(6));

    setMiningFeedTotalSettledUsd((prev) => {
      const next = prev + addedUsd;
      try {
        localStorage.setItem('ts_bot_mining_feed_settled_usd', String(next));
      } catch (e) {}
      return next;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + addedBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    try {
      localStorage.setItem('ts_bot_ird_fed_mines_bnb', String(accumulatedMiningYieldBnb + addedBnb));
    } catch (e) {}

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: MiningProfitFeedEvent = {
      id: `feed-24h-cyc-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'MINING_FEED',
      sourceName: '24-Hour Mining Feed Cycle',
      symbolOrId: '$1.00 / 24h',
      amountBnb: addedBnb,
      amountUsd: addedUsd,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [evt, ...prev].slice(0, 30);
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Completed 24-hour Mining Feed cycle: +$${addedUsd.toFixed(2)} USD (+${addedBnb.toFixed(6)} BNB) accumulated into Mining Profits!`,
      addedUsd,
      addedBnb,
    };
  };

  // Create custom TS NFT / TS MEM NFT (supports Video Coin, ZB 10z Gold & $1 TS BNB RWA Parity)
  const createTsNft = (params: {
    name: string;
    collection?: string;
    rarity: MiningNftAsset['rarity'];
    dailyFeedUsd?: number;
    stakePoolApyBoostPct?: number;
    connectPoolIds?: string[];
    linkedNftIds?: string[];
    rwaValueUsd?: number;
    isMemeNft?: boolean;
    image?: string;
    videoUrl?: string;
  }) => {
    const cleanName = params.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Enter a name for your TS NFT.' };
    }

    const rarityPresets: Record<
      MiningNftAsset['rarity'],
      { mult: number; dailyUsd: number; apyBoost: number; floorUsd: number }
    > = {
      Legendary: { mult: 1.0, dailyUsd: 16.0, apyBoost: 6.5, floorUsd: 1.00 },
      Epic: { mult: 0.65, dailyUsd: 11.5, apyBoost: 4.5, floorUsd: 1.00 },
      Rare: { mult: 0.45, dailyUsd: 8.0, apyBoost: 3.0, floorUsd: 1.00 },
      Common: { mult: 0.25, dailyUsd: 4.5, apyBoost: 2.0, floorUsd: 1.00 },
    };

    const preset = rarityPresets[params.rarity] || rarityPresets.Legendary;
    const chosenDailyUsd = params.dailyFeedUsd && params.dailyFeedUsd > 0 ? params.dailyFeedUsd : preset.dailyUsd;
    const chosenApyBoost =
      params.stakePoolApyBoostPct && params.stakePoolApyBoostPct > 0
        ? params.stakePoolApyBoostPct
        : preset.apyBoost;
    const chosenRwaValueUsd =
      params.rwaValueUsd && params.rwaValueUsd > 0 ? Number(params.rwaValueUsd.toFixed(2)) : CONTRACTS.TS_BNB_RWA_UNIT_USD;
    const poolIds = params.connectPoolIds ?? [];
    const linkedNfts = params.linkedNftIds ?? [];
    const tokenNum = params.isMemeNft
      ? `TS-MEM-${Math.floor(100 + Math.random() * 899)}`
      : params.videoUrl
      ? `TS-VID-${Math.floor(100 + Math.random() * 899)}`
      : `TS-${Math.floor(100 + Math.random() * 899)}`;
    const instantFeedUsd = Number((chosenDailyUsd * 0.1).toFixed(2));
    const instantFeedBnb = Number((instantFeedUsd / 614.50).toFixed(6));

    const newNft: MiningNftAsset = {
      id: `nft-ts-custom-${Date.now()}`,
      tokenId: `#${tokenNum}`,
      name: cleanName,
      collection: params.collection?.trim() || 'TS MEM NFT · Isiphahla Royal Dynasty',
      rarity: params.rarity,
      isMemeNft: params.isMemeNft ?? false,
      rwaValueUsd: chosenRwaValueUsd,
      image: params.image || CONTRACTS.TS_MEM_GOLD_BNB_IMAGE,
      videoUrl: params.videoUrl,
      floorValueUsd: chosenRwaValueUsd,
      miningProfitMultiplier: preset.mult,
      dailyFeedUsd: chosenDailyUsd,
      owned: true,
      isStakedFeeding: true,
      totalFedBnb: instantFeedBnb,
      mintCostBnb: 0.05,
      connectedPoolIds: poolIds,
      linkedNftIds: linkedNfts,
      stakePoolApyBoostPct: chosenApyBoost,
      editionLabel: `${params.isMemeNft ? 'TS MEM · ' : ''}$${chosenRwaValueUsd.toFixed(2)} TS BNB RWA Value`,
      description: `${params.videoUrl ? '3D Animated Video ' : ''}${params.isMemeNft ? 'TS MEM ' : ''}BEP-721 NFT pegged at $${chosenRwaValueUsd.toFixed(2)} TS BNB RWA value, linked to ${linkedNfts.length} NFTs and ${poolIds.length} RWA Stake Pool${poolIds.length === 1 ? '' : 's'} (+${chosenApyBoost.toFixed(1)}% APY).`,
    };

    setMiningNfts((prev) => {
      const updated = [newNft, ...prev];
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + instantFeedBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: MiningProfitFeedEvent = {
      id: `feed-create-nft-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'NFT_RELIC',
      sourceName: `${newNft.name} Created`,
      symbolOrId: newNft.tokenId,
      amountBnb: instantFeedBnb,
      amountUsd: instantFeedUsd,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [evt, ...prev].slice(0, 30);
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (poolIds.length > 0) {
      const firstPool = stakePools.find((p) => p.id === poolIds[0]);
      const stkEvt: StakePoolEvent = {
        id: `stk-nft-${Date.now()}`,
        timestamp: Date.now(),
        poolId: poolIds[0],
        poolName: poolIds.length > 1 ? `${firstPool?.name || poolIds[0]} (+${poolIds.length - 1} pools)` : (firstPool?.name || poolIds[0]),
        action: 'FEED_MINING',
        amountUsd: instantFeedUsd,
        amountBnb: instantFeedBnb,
        paymentMethod: 'BNB',
        txHash: randomTx,
        blockNumber: currentBlock,
      };
      setStakeHistory((prev) => {
        const updated = [stkEvt, ...prev.slice(0, 29)];
        try {
          localStorage.setItem('ts_bot_stake_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    return {
      success: true,
      message: `Created TS NFT ${newNft.name} (${newNft.tokenId})! Connected to ${poolIds.length} Stake Pool${poolIds.length === 1 ? '' : 's'} (+${chosenApyBoost.toFixed(1)}% APY) and feeding Mining Profits.`,
      nft: newNft,
    };
  };

  // Connect or disconnect a TS NFT from a specific Stake Pool
  const toggleNftStakePoolConnection = (nftId: string, poolId: string) => {
    const nft = miningNfts.find((n) => n.id === nftId);
    const pool = stakePools.find((p) => p.id === poolId);
    if (!nft || !pool) return { success: false, message: 'NFT or Stake Pool not found.' };
    if (!nft.owned) {
      return { success: false, message: `Mint ${nft.name} first before connecting it to Stake Pools.` };
    }

    const current = nft.connectedPoolIds || [];
    const isConnected = current.includes(poolId);
    const nextPools = isConnected ? current.filter((id) => id !== poolId) : [...current, poolId];

    setMiningNfts((prev) => {
      const updated = prev.map((n) =>
        n.id === nftId ? { ...n, connectedPoolIds: nextPools } : n
      );
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (!isConnected) {
      let randomTx = '0x';
      for (let i = 0; i < 64; i++) {
        randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
      }
      const evt: StakePoolEvent = {
        id: `stk-link-${Date.now()}`,
        timestamp: Date.now(),
        poolId: pool.id,
        poolName: `${pool.name} · Linked ${nft.tokenId}`,
        action: 'FEED_MINING',
        amountUsd: 0,
        amountBnb: 0,
        paymentMethod: 'BNB',
        txHash: randomTx,
        blockNumber: currentBlock,
      };
      setStakeHistory((prev) => {
        const updated = [evt, ...prev.slice(0, 29)];
        try {
          localStorage.setItem('ts_bot_stake_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    return {
      success: true,
      message: isConnected
        ? `Disconnected ${nft.name} (${nft.tokenId}) from ${pool.name}.`
        : `Connected ${nft.name} (${nft.tokenId}) to ${pool.name} (+${(nft.stakePoolApyBoostPct ?? 4.0).toFixed(1)}% APY Boost)!`,
    };
  };

  // Connect one TS NFT to all Stake Pools
  const connectNftToAllStakePools = (nftId: string) => {
    const nft = miningNfts.find((n) => n.id === nftId);
    if (!nft) return { success: false, message: 'NFT not found.' };
    if (!nft.owned) {
      return { success: false, message: `Mint ${nft.name} first before connecting to all Stake Pools.` };
    }

    const allIds = stakePools.map((p) => p.id);
    setMiningNfts((prev) => {
      const updated = prev.map((n) =>
        n.id === nftId ? { ...n, connectedPoolIds: allIds, isStakedFeeding: true } : n
      );
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Connected ${nft.name} (${nft.tokenId}) across all ${allIds.length} Stake Pools (+${(nft.stakePoolApyBoostPct ?? 4.0).toFixed(1)}% APY each)!`,
    };
  };

  // Connect all owned TS NFTs to a chosen Stake Pool
  const connectStakePoolWithAllNfts = (poolId: string) => {
    const pool = stakePools.find((p) => p.id === poolId);
    if (!pool) return { success: false, message: 'Stake pool not found.' };
    const ownedNfts = miningNfts.filter((n) => n.owned);
    if (ownedNfts.length === 0) {
      return { success: false, message: 'Create or mint a TS NFT first to connect to this pool.' };
    }

    setMiningNfts((prev) => {
      const updated = prev.map((n) => {
        if (!n.owned) return n;
        const current = n.connectedPoolIds || [];
        if (current.includes(poolId)) return n;
        return { ...n, connectedPoolIds: [...current, poolId] };
      });
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Connected all ${ownedNfts.length} owned TS NFTs to ${pool.name}!`,
    };
  };

  // Bidirectional link/unlink between two NFTs (e.g. TS MEM NFT <-> TS Sovereign Video NFT)
  const toggleNftToNftLink = (sourceNftId: string, targetNftId: string) => {
    if (sourceNftId === targetNftId) {
      return { success: false, message: 'Select a different NFT to cross-link.' };
    }
    const source = miningNfts.find((n) => n.id === sourceNftId);
    const target = miningNfts.find((n) => n.id === targetNftId);
    if (!source || !target) {
      return { success: false, message: 'NFT asset not found.' };
    }

    const currentlyLinked = (source.linkedNftIds || []).includes(targetNftId);

    setMiningNfts((prev) => {
      const updated = prev.map((n) => {
        if (n.id === sourceNftId) {
          const cur = n.linkedNftIds || [];
          return {
            ...n,
            linkedNftIds: currentlyLinked
              ? cur.filter((id) => id !== targetNftId)
              : [...new Set([...cur, targetNftId])],
          };
        }
        if (n.id === targetNftId) {
          const cur = n.linkedNftIds || [];
          return {
            ...n,
            linkedNftIds: currentlyLinked
              ? cur.filter((id) => id !== sourceNftId)
              : [...new Set([...cur, sourceNftId])],
          };
        }
        return n;
      });
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: currentlyLinked
        ? `Unlinked ${source.tokenId} from ${target.tokenId}.`
        : `Linked ${source.tokenId} ↔ ${target.tokenId} at $${(source.rwaValueUsd ?? 1.0).toFixed(2)} TS BNB RWA Value!`,
    };
  };

  // Unified Action: Link all owned TS MEM & Sovereign NFTs together + across all RWA Stake Pools ($1 TS BNB RWA Value)
  const linkAllNftsToRwaAndTsBnb = () => {
    const owned = miningNfts.filter((n) => n.owned);
    if (owned.length === 0) {
      return { success: false, message: 'Mint or own at least one TS NFT first.' };
    }

    const allPoolIds = stakePools.map((p) => p.id);
    const allOwnedIds = owned.map((n) => n.id);
    const parityBonusUsd = Number((owned.length * CONTRACTS.TS_BNB_RWA_UNIT_USD).toFixed(2));
    const parityBonusBnb = Number((parityBonusUsd / 614.50).toFixed(6));

    setMiningNfts((prev) => {
      const updated = prev.map((n) => {
        if (!n.owned) return n;
        return {
          ...n,
          rwaValueUsd: CONTRACTS.TS_BNB_RWA_UNIT_USD,
          connectedPoolIds: allPoolIds,
          linkedNftIds: allOwnedIds.filter((id) => id !== n.id),
          isStakedFeeding: true,
        };
      });
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + parityBonusBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const feedEvt: MiningProfitFeedEvent = {
      id: `feed-rwa-link-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'NFT_RELIC',
      sourceName: `TS MEM & NFT RWA Mesh ($1.00 TS BNB)`,
      symbolOrId: `${owned.length} NFTs ↔ ${allPoolIds.length} RWA Pools`,
      amountBnb: parityBonusBnb,
      amountUsd: parityBonusUsd,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [feedEvt, ...prev].slice(0, 30);
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Linked ${owned.length} TS MEM & Sovereign NFTs together and across all ${allPoolIds.length} RWA Stake Pools ($1.00 TS BNB RWA Value · +$${parityBonusUsd.toFixed(2)} credited)!`,
    };
  };

  // Toggle Ad Campaign Slot Connection
  const toggleAdConnection = (adId: string) => {
    const ad = adSlots.find((a) => a.id === adId);
    if (!ad) return { success: false, message: 'Ad campaign slot not found.' };

    const nextConnected = !ad.connected;
    const instantBatchUsd = nextConnected ? Number((ad.dailyRevenueUsd * 0.1).toFixed(2)) : 0;
    const instantBatchBnb = Number((instantBatchUsd / 614.50).toFixed(6));

    setAdSlots((prev) => {
      const updated = prev.map((item) =>
        item.id === adId
          ? {
              ...item,
              connected: nextConnected,
              totalEarnedUsd: item.totalEarnedUsd + instantBatchUsd,
            }
          : item
      );
      try {
        localStorage.setItem('ts_bot_ad_slots', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (nextConnected && instantBatchBnb > 0) {
      setAccumulatedMiningYieldBnb((prev) => {
        const next = prev + instantBatchBnb;
        try {
          localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
        } catch (e) {}
        return next;
      });

      let randomTx = '0x';
      for (let i = 0; i < 64; i++) {
        randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
      }
      const evt: MiningProfitFeedEvent = {
        id: `feed-ad-${Date.now()}`,
        timestamp: Date.now(),
        sourceType: 'AD_REVENUE',
        sourceName: ad.title,
        symbolOrId: ad.connectedTarget,
        amountBnb: instantBatchBnb,
        amountUsd: instantBatchUsd,
        txHash: randomTx,
        blockNumber: currentBlock,
      };
      setMiningProfitFeedHistory((prev) => {
        const updated = [evt, ...prev].slice(0, 30);
        try {
          localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    return {
      success: true,
      message: nextConnected
        ? `Connected "${ad.title}"! Earning +$${ad.dailyRevenueUsd.toFixed(2)}/day into ${ad.connectedTarget.replace('_', ' ')}.`
        : `Disconnected "${ad.title}" ad stream.`,
    };
  };

  // Connect All Available Ad Slots
  const connectAllAds = () => {
    const toConnect = adSlots.filter((a) => !a.connected);
    if (toConnect.length === 0) {
      return { success: true, message: 'All available ad campaign placements are already connected!' };
    }

    setAdSlots((prev) => {
      const updated = prev.map((a) => ({ ...a, connected: true }));
      try {
        localStorage.setItem('ts_bot_ad_slots', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const totalDaily = adSlots.reduce((s, a) => s + a.dailyRevenueUsd, 0);
    return {
      success: true,
      message: `Connected all ${adSlots.length} Ad Network slots! Streaming +$${totalDaily.toFixed(2)}/day across TS NFTs, Stake Pools, and Mining Profits.`,
    };
  };

  // Google Ads Tag & Conversion Controls
  const triggerGoogleAdsConversion = (source: string, valueUsd: number = 10.0) => {
    if (googleAdsConfig.campaignStatus !== 'ACTIVE') {
      return {
        success: false,
        message: 'Activate Google Ads campaign status first to dispatch gtag conversions.',
      };
    }

    const res = dispatchGoogleAdsConversion({
      googleTagId: googleAdsConfig.googleTagId,
      conversionLabel: googleAdsConfig.conversionLabel,
      valueUsd,
      currency: 'USD',
    });

    const convEvt: GoogleAdsConversionEvent = {
      id: `gads-conv-${Date.now()}`,
      timestamp: Date.now(),
      eventName: 'conversion',
      sendTo: res.sendTo,
      valueUsd: Number(valueUsd.toFixed(2)),
      currency: 'USD',
      source,
      dispatchedToGtag: res.dispatched,
    };

    setGoogleAdsConversions((prev) => {
      const updated = [convEvt, ...prev].slice(0, 25);
      try {
        localStorage.setItem('ts_bot_google_ads_conversions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Dispatched Google Ads conversion (${res.sendTo}) · Value $${valueUsd.toFixed(2)} USD for ${source}.`,
    };
  };

  const updateGoogleAdsConfig = (
    updates: Partial<Pick<GoogleAdsConfig, 'googleTagId' | 'conversionLabel' | 'dailyBudgetUsd'>>
  ) => {
    const cleanTag = (updates.googleTagId ?? googleAdsConfig.googleTagId).trim();
    if (!cleanTag) {
      return { success: false, message: 'Enter a valid Google Ads Tag ID (e.g. AW-1684920315).' };
    }
    const nextConfig: GoogleAdsConfig = {
      ...googleAdsConfig,
      ...updates,
      googleTagId: cleanTag,
      conversionLabel: (updates.conversionLabel ?? googleAdsConfig.conversionLabel).trim() || 'ts_protocol_yield',
      dailyBudgetUsd: updates.dailyBudgetUsd && updates.dailyBudgetUsd > 0 ? updates.dailyBudgetUsd : googleAdsConfig.dailyBudgetUsd,
    };
    setGoogleAdsConfig(nextConfig);
    try {
      localStorage.setItem('ts_bot_google_ads_config', JSON.stringify(nextConfig));
    } catch (e) {}
    if (nextConfig.campaignStatus === 'ACTIVE') {
      initGoogleAdsTag(nextConfig.googleTagId);
    }
    return {
      success: true,
      message: `Updated Google Ads Tag to ${nextConfig.googleTagId} (Budget: $${nextConfig.dailyBudgetUsd.toFixed(2)}/day).`,
    };
  };

  const toggleGoogleAdsStatus = () => {
    const nextStatus: GoogleAdsConfig['campaignStatus'] =
      googleAdsConfig.campaignStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const nextConfig: GoogleAdsConfig = {
      ...googleAdsConfig,
      campaignStatus: nextStatus,
    };
    setGoogleAdsConfig(nextConfig);
    try {
      localStorage.setItem('ts_bot_google_ads_config', JSON.stringify(nextConfig));
    } catch (e) {}
    if (nextStatus === 'ACTIVE') {
      initGoogleAdsTag(nextConfig.googleTagId);
    }
    return {
      success: true,
      message:
        nextStatus === 'ACTIVE'
          ? `Google Ads campaign activated for ${nextConfig.advertiserName} (${nextConfig.googleTagId})!`
          : 'Google Ads campaign paused.',
    };
  };

  // Pop-Up Google Business Ad Controls
  const activePopupAd = activePopupAdId
    ? adSlots.find((a) => a.id === activePopupAdId) || null
    : null;

  const togglePopupAdEnabled = () => {
    setPopupAdEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ts_bot_popup_ad_enabled', String(next));
      } catch (e) {}
      if (!next) setActivePopupAdId(null);
      return next;
    });
  };

  const openPopupBusinessAd = (adId?: string) => {
    const target = adId
      ? adSlots.find((a) => a.id === adId)
      : popupPool[popupAdIndex % Math.max(1, popupPool.length)];
    if (!target) return;
    setActivePopupAdId(target.id);
    setPopupAdIndex((idx) => (idx + 1) % Math.max(1, popupPool.length));
  };

  const dismissPopupBusinessAd = () => {
    setActivePopupAdId(null);
  };

  const nextPopupBusinessAd = () => {
    if (popupPool.length === 0) return;
    const currentIdx = popupPool.findIndex((a) => a.id === activePopupAdId);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % popupPool.length : 0;
    const nextAd = popupPool[nextIdx];
    if (nextAd) {
      setActivePopupAdId(nextAd.id);
      setPopupAdIndex((nextIdx + 1) % popupPool.length);
    }
  };

  const recordPopupAdEngagement = (adId: string, action: 'IMPRESSION' | 'CLICK') => {
    const ad = adSlots.find((a) => a.id === adId);
    if (!ad) return;
    const bonusUsd = action === 'CLICK' ? 0.15 : 0.02;
    const bonusBnb = bonusUsd / 614.50;

    setAdSlots((prev) => {
      const updated = prev.map((a) =>
        a.id === adId
          ? {
              ...a,
              impressions24h: a.impressions24h + 1,
              totalEarnedUsd: a.totalEarnedUsd + bonusUsd,
            }
          : a
      );
      try {
        localStorage.setItem('ts_bot_ad_slots', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + bonusBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    if (action === 'CLICK' && googleAdsConfig.campaignStatus === 'ACTIVE') {
      triggerGoogleAdsConversion(`${ad.advertiser} Click`, bonusUsd);
    }
  };

  // Create & Connect Custom Business Ad Placement (Google Ads or Web3 Partner)
  const createAdConnection = (params: {
    title: string;
    advertiser: string;
    placement: AdCampaignSlot['placement'];
    connectedTarget: AdCampaignSlot['connectedTarget'];
    dailyRevenueUsd?: number;
    targetAddress?: string;
    network?: AdCampaignSlot['network'];
    campaignType?: AdCampaignSlot['campaignType'];
    businessCategory?: AdCampaignSlot['businessCategory'];
    brandDomain?: string;
    destinationUrl?: string;
    headlineOffer?: string;
  }) => {
    const cleanTitle = params.title.trim();
    if (!cleanTitle) {
      return { success: false, message: 'Enter a business name or ad title.' };
    }
    const dailyUsd = params.dailyRevenueUsd && params.dailyRevenueUsd > 0 ? params.dailyRevenueUsd : 4.20;
    const isGoogle = (params.network ?? 'GOOGLE_ADS') === 'GOOGLE_ADS';
    const domainClean = (params.brandDomain || '').trim() || 'business.google.com';
    const newAd: AdCampaignSlot = {
      id: `ad-custom-${Date.now()}`,
      title: cleanTitle,
      advertiser:
        params.advertiser.trim() ||
        cleanTitle.split('·')[0].trim(),
      network: params.network ?? 'GOOGLE_ADS',
      campaignType: params.campaignType ?? (isGoogle ? 'PERFORMANCE_MAX' : 'DISPLAY'),
      businessCategory: params.businessCategory ?? 'FASHION_RETAIL',
      brandDomain: domainClean,
      destinationUrl:
        params.destinationUrl?.trim() ||
        (domainClean.startsWith('http') ? domainClean : `https://${domainClean}`),
      headlineOffer:
        params.headlineOffer?.trim() ||
        `Verified Business Deals · Route +$${dailyUsd.toFixed(2)}/day to ${params.connectedTarget.replace('_', ' ')}`,
      adFormat: 'POPUP_BUSINESS',
      placement: params.placement,
      connectedTarget: params.connectedTarget,
      dailyRevenueUsd: dailyUsd,
      impressions24h: 12400,
      ctrPct: 4.8,
      connected: true,
      targetAddress: params.targetAddress?.trim() || CONTRACTS.RECHARGE_ROUTER_DEFI,
      totalEarnedUsd: 0.42,
      description: `Appearing Google Business Pop-Up Ad for ${params.advertiser.trim() || cleanTitle}. Streams daily business sponsorship yield into ${params.connectedTarget.replace('_', ' ')}.`,
    };

    setAdSlots((prev) => {
      const updated = [newAd, ...prev];
      try {
        localStorage.setItem('ts_bot_ad_slots', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (isGoogle && googleAdsConfig.campaignStatus === 'ACTIVE') {
      triggerGoogleAdsConversion(`Google Business Ad: ${newAd.advertiser}`, dailyUsd);
    }

    return {
      success: true,
      message: `Added appearing Google Business Ad "${newAd.title}" (+$${dailyUsd.toFixed(2)}/day)!`,
    };
  };

  // CIP-95 Voltaire Governance Wallet & Government Project Submission Actions
  const connectCip95Wallet = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const w = window as unknown as {
        cardano?: Record<
          string,
          {
            name?: string;
            enable: (opts?: { extensions?: Array<{ cip: number }> }) => Promise<{
              getNetworkId?: () => Promise<number>;
              cip95?: {
                getPubDRepKey?: () => Promise<string>;
                getRegisteredPubStakeKeys?: () => Promise<string[]>;
              };
            }>;
          }
        >;
      };

      let walletName = 'TS Protocol CIP-95 Governance Bridge';
      let drepKeyHash = cip95State.drepKeyHash;
      let registeredKey = cip95State.registeredPubStakeKey;
      let networkId = 1;

      if (w.cardano) {
        const providerKey = ['lace', 'eternl', 'vespr', 'nami', 'flint'].find(
          (k) => Boolean(w.cardano?.[k])
        );
        if (providerKey && w.cardano[providerKey]) {
          try {
            const api = await w.cardano[providerKey].enable({
              extensions: [{ cip: 95 }],
            });
            walletName = `${w.cardano[providerKey].name || providerKey.toUpperCase()} (CIP-95)`;
            if (api.getNetworkId) {
              networkId = await api.getNetworkId();
            }
            if (api.cip95?.getPubDRepKey) {
              const pubDRep = await api.cip95.getPubDRepKey();
              if (pubDRep) drepKeyHash = pubDRep;
            }
            if (api.cip95?.getRegisteredPubStakeKeys) {
              const keys = await api.cip95.getRegisteredPubStakeKeys();
              if (keys && keys[0]) registeredKey = keys[0];
            }
          } catch {
            // Fall back cleanly to built-in CIP-95 governance bridge if user rejects extension prompt
          }
        }
      }

      const nextState: Cip95DRepState = {
        ...cip95State,
        connected: true,
        walletName,
        networkId,
        drepKeyHash,
        registeredPubStakeKey: registeredKey,
        lastSyncedAt: Date.now(),
      };
      setCip95State(nextState);
      try {
        localStorage.setItem('ts_bot_cip95_state', JSON.stringify(nextState));
      } catch (e) {}

      return {
        success: true,
        message: `Connected ${walletName} with active CIP-95 DRep credentials (${nextState.drepId}).`,
      };
    } catch {
      return { success: false, message: 'Could not initialize CIP-95 wallet bridge.' };
    }
  };

  const registerCip95DRep = () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const nextState: Cip95DRepState = {
      ...cip95State,
      connected: true,
      drepId: `drep1ygq8k9ts95sovereign${suffix}malkhut8rwa`,
      votingPowerAda: cip95State.votingPowerAda + 25000,
      lastSyncedAt: Date.now(),
    };
    setCip95State(nextState);
    try {
      localStorage.setItem('ts_bot_cip95_state', JSON.stringify(nextState));
    } catch (e) {}
    return {
      success: true,
      message: `Registered CIP-95 DRep ID ${nextState.drepId} (+25,000 ADA voting power synced).`,
    };
  };

  const submitProjectToGovernment = async (params: {
    projectTitle: string;
    targetAgency: string;
    cipStandard?: string;
    assetSummary?: string;
    adNetworkSummary?: string;
    submissionTrack?: GovernmentSubmission['submissionTrack'];
    treasuryAmountUsd?: number;
    treasuryDestination?: string;
  }): Promise<{ success: boolean; message: string; submission?: GovernmentSubmission }> => {
    const cleanTitle = params.projectTitle.trim();
    if (!cleanTitle) {
      return { success: false, message: 'Enter a Project Title for Government & Treasury submission.' };
    }

    const track = params.submissionTrack ?? 'DUAL_GOV_AND_TREASURY';
    const reqUsd =
      params.treasuryAmountUsd && params.treasuryAmountUsd > 0 ? params.treasuryAmountUsd : 250000;
    const reqAda = Math.round(reqUsd / 0.8);
    const connectedAdsCount = adSlots.filter((a) => a.connected).length;
    const ownedVideoNfts = miningNfts.filter((n) => n.owned && Boolean(n.videoUrl)).length;
    const payloadString = JSON.stringify({
      projectTitle: cleanTitle,
      entityName: googleAdsConfig.advertiserName,
      targetAgency: params.targetAgency,
      submissionTrack: track,
      treasuryAmountUsd: reqUsd,
      treasuryDestination: params.treasuryDestination || CONTRACTS.RECHARGE_ROUTER_DEFI,
      drepId: cip95State.drepId,
      liveAppUrl: `${CONTRACTS.LIVE_APP_URL}/?tab=gov`,
      connectedAdsCount,
      ownedVideoNfts,
      timestamp: Date.now(),
    });

    let anchorHash = 'sha256:';
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const buf = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(payloadString)
        );
        anchorHash += Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } else {
        anchorHash += `${Date.now().toString(16)}95f8a2b1c4d7`;
      }
    } catch {
      anchorHash += `${Date.now().toString(16)}95f8a2b1c4d7`;
    }

    const refNum = String(govSubmissions.length + 1).padStart(3, '0');
    const resolvedStatus: GovernmentSubmission['status'] =
      track === 'TREASURY_ALLOCATION'
        ? 'SUBMITTED_TO_TREASURY'
        : 'VOTING_ONLINE';

    const submission: GovernmentSubmission = {
      id: `gov-sub-${Date.now()}`,
      submittedAt: Date.now(),
      referenceCode: `CIP95-ZA-2026-${refNum}`,
      projectTitle: cleanTitle,
      entityName: googleAdsConfig.advertiserName,
      cipStandard:
        params.cipStandard?.trim() ||
        'CIP-95 (Voltaire Governance) + Cardano ADA Stake Pool + BEP-20 Bridge',
      targetAgency: params.targetAgency,
      drepId: cip95State.drepId,
      liveAppUrl: `${CONTRACTS.LIVE_APP_URL}/?tab=gov`,
      assetSummary:
        params.assetSummary?.trim() ||
        `${miningNfts.filter((n) => n.owned).length} TS NFTs (${ownedVideoNfts} Video Coin) · ${stakePools.length} RWA & Cardano Pools`,
      adNetworkSummary:
        params.adNetworkSummary?.trim() ||
        `${connectedAdsCount}/${adSlots.length} Appearing Retail Business Google Ads Active`,
      anchorHash,
      submissionTrack: track,
      treasuryAmountUsd: reqUsd,
      treasuryAmountAda: reqAda,
      treasuryDestination: params.treasuryDestination?.trim() || CONTRACTS.RECHARGE_ROUTER_DEFI,
      voteYesCount: 1,
      voteNoCount: 0,
      voteAbstainCount: 0,
      votePowerYesAda: cip95State.votingPowerAda,
      userVote: 'YES',
      votingOpenOnline: true,
      status: resolvedStatus,
    };

    setGovSubmissions((prev) => {
      const updated = [submission, ...prev];
      try {
        localStorage.setItem('ts_bot_gov_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (googleAdsConfig.campaignStatus === 'ACTIVE') {
      triggerGoogleAdsConversion(`CIP-95 ${track}: ${submission.referenceCode}`, 25.0);
    }

    const trackMsg =
      track === 'GOVERNMENT_VOTING'
        ? 'Submitted to Government for Online Voting'
        : track === 'TREASURY_ALLOCATION'
        ? `Submitted to Treasury ($${reqUsd.toLocaleString()} / ${reqAda.toLocaleString()} ADA)`
        : `Submitted to Government for Online Voting & Treasury ($${reqUsd.toLocaleString()})`;

    return {
      success: true,
      message: `${trackMsg} — Ref: ${submission.referenceCode} (${anchorHash.slice(0, 20)}...)`,
      submission,
    };
  };

  // Cast an online CIP-95 Government / Treasury vote on a submitted dossier
  const voteOnGovernmentSubmission = (
    submissionId: string,
    vote: 'YES' | 'NO' | 'ABSTAIN'
  ): { success: boolean; message: string } => {
    const target = govSubmissions.find((s) => s.id === submissionId);
    if (!target) {
      return { success: false, message: 'Governance submission not found.' };
    }

    const prevVote = target.userVote;
    setGovSubmissions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== submissionId) return s;
        let yes = s.voteYesCount ?? 0;
        let no = s.voteNoCount ?? 0;
        let abstain = s.voteAbstainCount ?? 0;
        let powerYes = s.votePowerYesAda ?? 0;

        if (prevVote === 'YES') {
          yes = Math.max(0, yes - 1);
          powerYes = Math.max(0, powerYes - cip95State.votingPowerAda);
        } else if (prevVote === 'NO') {
          no = Math.max(0, no - 1);
        } else if (prevVote === 'ABSTAIN') {
          abstain = Math.max(0, abstain - 1);
        }

        if (vote === 'YES') {
          yes += 1;
          powerYes += cip95State.votingPowerAda;
        } else if (vote === 'NO') {
          no += 1;
        } else {
          abstain += 1;
        }

        return {
          ...s,
          voteYesCount: yes,
          voteNoCount: no,
          voteAbstainCount: abstain,
          votePowerYesAda: powerYes,
          userVote: vote,
          votingOpenOnline: true,
        };
      });
      try {
        localStorage.setItem('ts_bot_gov_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Online CIP-95 Vote recorded: "${vote}" on ${target.referenceCode} using ${cip95State.votingPowerAda.toLocaleString()} ADA voting power (${cip95State.drepId}).`,
    };
  };

  // Collect money generated from Video TS NFT playback + connected NFT Pool
  const collectVideoAndNftPoolMoney = () => {
    const stakeAccruedUsd = stakePools.reduce((sum, p) => sum + p.accruedRewardsUsd, 0);
    const totalPlayUsd = Number(videoPlayEarningsUsd.toFixed(2));
    const totalPoolUsd = Number((videoNftPoolEarningsUsd + stakeAccruedUsd).toFixed(2));
    const totalCollectedUsd = Number((totalPlayUsd + totalPoolUsd).toFixed(2));

    if (totalCollectedUsd <= 0) {
      return {
        success: false,
        message: 'Play the Video TS NFT or wait a moment for NFT Pool yield to accumulate.',
        collectedUsd: 0,
        collectedBnb: 0,
      };
    }

    const totalCollectedBnb = Number((totalCollectedUsd / 614.50).toFixed(6));

    setVideoPlayEarningsUsd(0);
    setVideoNftPoolEarningsUsd(0);
    try {
      localStorage.setItem('ts_bot_video_play_earnings_usd', '0');
      localStorage.setItem('ts_bot_video_nft_pool_usd', '0');
    } catch (e) {}

    // Sweep accrued Stake Pool rewards into this collection as well
    if (stakeAccruedUsd > 0) {
      setStakePools((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          totalYieldPaidUsd: p.totalYieldPaidUsd + p.accruedRewardsUsd,
          accruedRewardsUsd: 0,
          accruedRewardsBnb: 0,
        }));
        try {
          localStorage.setItem('ts_bot_stake_pools', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    // Credit collected BNB to Mining Profits & USDT equiv to Wallet USDT so both balances reflect collection
    setAccumulatedMiningYieldBnb((prev) => {
      const next = prev + totalCollectedBnb;
      try {
        localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
      } catch (e) {}
      return next;
    });

    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        USDT: Number((prev.balances.USDT + totalCollectedUsd).toFixed(2)),
      },
    }));

    setMiningNfts((prev) => {
      const updated = prev.map((n) =>
        n.videoUrl
          ? { ...n, totalFedBnb: Number((n.totalFedBnb + totalCollectedBnb).toFixed(6)) }
          : n
      );
      try {
        localStorage.setItem('ts_bot_mining_nfts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: MiningProfitFeedEvent = {
      id: `feed-video-nft-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'NFT_RELIC',
      sourceName: 'Video TS NFT Play + NFT Pool Collection',
      symbolOrId: '#TS-VID-001',
      amountBnb: totalCollectedBnb,
      amountUsd: totalCollectedUsd,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setMiningProfitFeedHistory((prev) => {
      const updated = [evt, ...prev].slice(0, 30);
      try {
        localStorage.setItem('ts_bot_profit_feed_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Collected $${totalCollectedUsd.toFixed(2)} ($${totalPlayUsd.toFixed(2)} Video Play + $${totalPoolUsd.toFixed(2)} NFT Pool) = +${totalCollectedBnb.toFixed(6)} BNB into Mining Profits & Wallet USDT!`,
      collectedUsd: totalCollectedUsd,
      collectedBnb: totalCollectedBnb,
    };
  };

  // Stake Pools & Real-Money Asset (RWA) Pool Actions
  const stakeIntoPool = (
    poolId: string,
    amountUsd: number,
    paymentMethod: 'BNB' | 'USDT' | 'RECHARGE' = 'USDT'
  ) => {
    const pool = stakePools.find((p) => p.id === poolId);
    if (!pool) return { success: false, message: 'Stake pool not found.' };
    if (isNaN(amountUsd) || amountUsd < pool.minStakeUsd) {
      return {
        success: false,
        message: `Minimum stake for ${pool.name} is $${pool.minStakeUsd.toFixed(2)} USD.`,
      };
    }

    const amountBnb = amountUsd / 614.50;

    if (paymentMethod === 'USDT') {
      if (wallet.balances.USDT < amountUsd) {
        return {
          success: false,
          message: `Insufficient USDT balance. Required: $${amountUsd.toFixed(2)}, available: $${wallet.balances.USDT.toFixed(2)}.`,
        };
      }
      setWallet((prev) => ({
        ...prev,
        balances: { ...prev.balances, USDT: prev.balances.USDT - amountUsd },
      }));
    } else if (paymentMethod === 'BNB') {
      if (wallet.balances.BNB < amountBnb) {
        return {
          success: false,
          message: `Insufficient BNB balance. Required: ${amountBnb.toFixed(4)} BNB, available: ${wallet.balances.BNB.toFixed(4)} BNB.`,
        };
      }
      setWallet((prev) => ({
        ...prev,
        balances: { ...prev.balances, BNB: prev.balances.BNB - amountBnb },
      }));
    } else {
      if (rechargeBalance < amountBnb) {
        return {
          success: false,
          message: `Insufficient Recharge Balance. Required: ${amountBnb.toFixed(4)} BNB ($${amountUsd.toFixed(2)}), available: ${rechargeBalance.toFixed(4)} BNB.`,
        };
      }
      setRechargeBalance((prev) => {
        const next = Math.max(0, prev - amountBnb);
        try {
          localStorage.setItem('ts_bot_recharge_balance', String(next));
        } catch (e) {}
        return next;
      });
    }

    setStakePools((prev) => {
      const updated = prev.map((sp) =>
        sp.id === poolId
          ? {
              ...sp,
              tvlUsd: sp.tvlUsd + amountUsd,
              userStakedUsd: sp.userStakedUsd + amountUsd,
              userStakedBnb: sp.userStakedBnb + amountBnb,
            }
          : sp
      );
      try {
        localStorage.setItem('ts_bot_stake_pools', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: StakePoolEvent = {
      id: `stk-${Date.now()}`,
      timestamp: Date.now(),
      poolId: pool.id,
      poolName: pool.name,
      action: 'STAKE',
      amountUsd,
      amountBnb: Number(amountBnb.toFixed(6)),
      paymentMethod,
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setStakeHistory((prev) => {
      const updated = [evt, ...prev.slice(0, 29)];
      try {
        localStorage.setItem('ts_bot_stake_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Staked $${amountUsd.toFixed(2)} (${amountBnb.toFixed(4)} BNB) via ${paymentMethod} into ${pool.name} (${pool.apyPct}% APY)!`,
    };
  };

  const unstakeFromPool = (poolId: string, percentage: number) => {
    const pool = stakePools.find((p) => p.id === poolId);
    if (!pool || pool.userStakedUsd <= 0) {
      return { success: false, message: 'No active stake in this pool.' };
    }

    const pct = Math.min(100, Math.max(1, percentage)) / 100;
    const returnUsd = pool.userStakedUsd * pct;
    const rewardUsd = pool.accruedRewardsUsd * pct;
    const totalUsd = returnUsd + rewardUsd;
    const totalBnb = totalUsd / 614.50;

    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        USDT: prev.balances.USDT + totalUsd,
      },
    }));

    setStakePools((prev) => {
      const updated = prev.map((sp) =>
        sp.id === poolId
          ? {
              ...sp,
              tvlUsd: Math.max(0, sp.tvlUsd - returnUsd),
              userStakedUsd: Math.max(0, sp.userStakedUsd - returnUsd),
              userStakedBnb: Math.max(0, sp.userStakedBnb - returnUsd / 614.50),
              accruedRewardsUsd: Math.max(0, sp.accruedRewardsUsd - rewardUsd),
              accruedRewardsBnb: Math.max(0, sp.accruedRewardsBnb - rewardUsd / 614.50),
              totalYieldPaidUsd: sp.totalYieldPaidUsd + rewardUsd,
            }
          : sp
      );
      try {
        localStorage.setItem('ts_bot_stake_pools', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: StakePoolEvent = {
      id: `unstk-${Date.now()}`,
      timestamp: Date.now(),
      poolId: pool.id,
      poolName: pool.name,
      action: 'UNSTAKE',
      amountUsd: Number(totalUsd.toFixed(2)),
      amountBnb: Number(totalBnb.toFixed(6)),
      paymentMethod: 'USDT',
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setStakeHistory((prev) => {
      const updated = [evt, ...prev.slice(0, 29)];
      try {
        localStorage.setItem('ts_bot_stake_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Unstaked $${returnUsd.toFixed(2)} + $${rewardUsd.toFixed(2)} yield = $${totalUsd.toFixed(2)} USDT returned to your wallet!`,
    };
  };

  const claimStakeReward = (poolId: string) => {
    const pool = stakePools.find((p) => p.id === poolId);
    if (!pool || pool.accruedRewardsUsd <= 0.001) {
      return { success: false, message: 'No accrued rewards ready to claim from this pool yet.' };
    }

    const rewardUsd = pool.accruedRewardsUsd;
    const rewardBnb = rewardUsd / 614.50;

    if (pool.feedToMiningProfits) {
      setAccumulatedMiningYieldBnb((prev) => {
        const next = prev + rewardBnb;
        try {
          localStorage.setItem('ts_bot_mining_yield_bnb', String(next));
        } catch (e) {}
        return next;
      });
    } else {
      setWallet((prev) => ({
        ...prev,
        balances: {
          ...prev.balances,
          USDT: prev.balances.USDT + rewardUsd,
        },
      }));
    }

    setStakePools((prev) => {
      const updated = prev.map((sp) =>
        sp.id === poolId
          ? {
              ...sp,
              accruedRewardsUsd: 0,
              accruedRewardsBnb: 0,
              totalYieldPaidUsd: sp.totalYieldPaidUsd + rewardUsd,
            }
          : sp
      );
      try {
        localStorage.setItem('ts_bot_stake_pools', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let randomTx = '0x';
    for (let i = 0; i < 64; i++) {
      randomTx += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const evt: StakePoolEvent = {
      id: `clm-${Date.now()}`,
      timestamp: Date.now(),
      poolId: pool.id,
      poolName: pool.name,
      action: pool.feedToMiningProfits ? 'FEED_MINING' : 'CLAIM_REWARD',
      amountUsd: Number(rewardUsd.toFixed(2)),
      amountBnb: Number(rewardBnb.toFixed(6)),
      paymentMethod: pool.feedToMiningProfits ? 'BNB' : 'USDT',
      txHash: randomTx,
      blockNumber: currentBlock,
    };

    setStakeHistory((prev) => {
      const updated = [evt, ...prev.slice(0, 29)];
      try {
        localStorage.setItem('ts_bot_stake_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: pool.feedToMiningProfits
        ? `Fed +$${rewardUsd.toFixed(2)} (${rewardBnb.toFixed(5)} BNB) from ${pool.name} directly into Mining Profits!`
        : `Claimed +$${rewardUsd.toFixed(2)} USDT real-money yield from ${pool.name} to your wallet!`,
    };
  };

  const toggleStakeFeedToMining = (poolId: string) => {
    const pool = stakePools.find((p) => p.id === poolId);
    if (!pool) return { success: false, message: 'Stake pool not found.' };

    const next = !pool.feedToMiningProfits;
    setStakePools((prev) => {
      const updated = prev.map((sp) =>
        sp.id === poolId ? { ...sp, feedToMiningProfits: next } : sp
      );
      try {
        localStorage.setItem('ts_bot_stake_pools', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: next
        ? `${pool.name} yield now streams directly into Mining Profits!`
        : `${pool.name} yield now settles to your USDT real-money wallet balance.`,
    };
  };

  // Reset system data to fresh pre-recharge state for testing
  const resetSystemData = () => {
    setRechargeBalance(0);
    setAccumulatedMiningYieldBnb(0);
    setUserPositions([]);
    setTradeHistory([]);
    setReferralUsers([]);
    setUnclaimedCommissionBnb(0);
    setAlerts([]);
    setConnectedMachines([]);
    setBotConfig({
      active: false,
      autoRebalance: true,
      minSpreadPct: 0.15,
      maxSlippagePct: 0.5,
      tradingSpeed: 'normal',
      targetPair: 'TS / BNB',
      totalSwapsExecuted: 0,
      totalVolumeUsd: 0,
      totalFeesGeneratedUsd: 0,
      lastAction: 'Standby - Awaiting BNB Recharge to activate automated mining & arbitrage trading engine.',
    });
    try {
      localStorage.removeItem('ts_bot_recharge_balance');
      localStorage.removeItem('ts_bot_mining_yield_bnb');
      localStorage.removeItem('ts_bot_user_positions');
      localStorage.removeItem('ts_bot_trade_history');
      localStorage.removeItem('ts_bot_referral_users');
      localStorage.removeItem('ts_bot_engine_config');
      localStorage.removeItem('ts_bot_alerts');
      localStorage.removeItem('ts_bot_connected_machines');
    } catch (e) {}
  };

  // Claim Referral Commission
  const claimReferralCommission = () => {
    if (unclaimedCommissionBnb <= 0.0001) {
      return {
        success: false,
        message: 'No pending affiliate commissions to claim at this moment.',
        amountBnb: 0,
        amountUsd: 0,
      };
    }

    const claimedBnb = unclaimedCommissionBnb;
    const claimedUsd = claimedBnb * 614.5;

    // Credit to wallet
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        BNB: prev.balances.BNB + claimedBnb,
      },
    }));

    setUnclaimedCommissionBnb(0);

    const hexChars = '0123456789abcdef';
    let randomHash = '0x';
    for (let i = 0; i < 64; i++) {
      randomHash += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const newAlert: CryptoAlert = {
      id: `alert-comm-${Date.now()}`,
      type: 'RECHARGE',
      asset: 'BNB',
      amountBnb: claimedBnb,
      amountUsd: claimedUsd,
      walletAddress: wallet.address || CONTRACTS.RECHARGE_ROUTER_DEFI,
      txHash: randomHash,
      timestamp: Date.now(),
      status: 'CONFIRMED',
      recipientEmail: '', // Only withdrawals request on email
      blockNumber: currentBlock,
      note: `Affiliate Commission Payout of ${claimedBnb.toFixed(4)} BNB ($${claimedUsd.toFixed(2)}) Claimed Directly to Wallet`,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveAlertToast(newAlert);

    return {
      success: true,
      message: `Successfully claimed ${claimedBnb.toFixed(4)} BNB ($${claimedUsd.toFixed(2)}) in multi-level referral rewards directly to your wallet!`,
      amountBnb: claimedBnb,
      amountUsd: claimedUsd,
    };
  };

  // Register New User & Activate Affiliate Node
  // Referral list starts recording after your affiliate link is shared and referral completed signing
  const registerUser = (
    email: string,
    password: string,
    username?: string,
    inviterCode?: string,
    rememberMe: boolean = true
  ) => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Generate unique referral code derived from email or random hex
    const generatedCode = 'TS' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const boundInviter = inviterCode?.trim().toUpperCase() || pendingInviteCode?.trim().toUpperCase() || undefined;

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      username: username?.trim() || email.split('@')[0],
      referralCode: generatedCode,
      inviterCode: boundInviter,
      registeredAt: Date.now(),
      walletAddress: wallet.address || '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      savedPassword: rememberMe ? password : undefined,
      rememberMe,
      isRegistered: true,
    };

    setCurrentUser(newUser);

    try {
      localStorage.setItem('ts_bot_current_user', JSON.stringify(newUser));
      if (rememberMe) {
        localStorage.setItem(
          'ts_bot_saved_credentials',
          JSON.stringify({ email: newUser.email, password })
        );
        setSavedCredentials({ email: newUser.email, password });
      }
    } catch (e) {}

    // If an inviter code or affiliate link was used, record the referral immediately in the referrals list!
    if (boundInviter) {
      const hexChars = '0123456789abcdef';
      let randomAddr = '0x';
      for (let i = 0; i < 40; i++) {
        randomAddr += hexChars[Math.floor(Math.random() * hexChars.length)];
      }

      const initialTradingVolume = 1500;
      const commissionBnb = (initialTradingVolume * 0.01) / 614.5;

      const newRef: ReferralUser = {
        id: `ref-dyn-${Date.now()}`,
        address: randomAddr,
        level: 1,
        joinedTimestamp: Date.now(),
        tradingVolumeUsd: initialTradingVolume,
        commissionEarnedBnb: commissionBnb,
        commissionEarnedUsd: initialTradingVolume * 0.01,
        status: 'ACTIVE',
      };

      setReferralUsers((prev) => {
        const updated = [newRef, ...prev];
        try {
          localStorage.setItem('ts_bot_referral_users', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setUnclaimedCommissionBnb((prev) => prev + commissionBnb);
      setPendingInviteCode(null);
    }

    return {
      success: true,
      message: `Registration complete! Your affiliate node is active with code ${generatedCode}.${
        boundInviter ? ` Successfully bound to referral sponsor ${boundInviter}.` : ''
      }`,
      user: newUser,
    };
  };

  // Log in User
  const loginUser = (emailOrUser: string, password: string, rememberMe: boolean = true) => {
    if (!emailOrUser) {
      return { success: false, message: 'Please enter your registered email or username.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    // Authenticate user
    const loggedUser: AuthUser = {
      id: currentUser?.id || `usr-${Date.now()}`,
      email: emailOrUser.includes('@') ? emailOrUser.toLowerCase() : currentUser?.email || `${emailOrUser}@tsprotocol.io`,
      username: emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser,
      referralCode: currentUser?.referralCode || 'TSBNB888',
      registeredAt: currentUser?.registeredAt || Date.now() - 86400000 * 14,
      walletAddress: wallet.address || '0x71C8A5a8B0d8B19b0785d1BA051ECdbC721ca49B',
      savedPassword: rememberMe ? password : undefined,
      rememberMe,
      isRegistered: true,
    };

    setCurrentUser(loggedUser);

    try {
      localStorage.setItem('ts_bot_current_user', JSON.stringify(loggedUser));
      if (rememberMe) {
        localStorage.setItem(
          'ts_bot_saved_credentials',
          JSON.stringify({ email: loggedUser.email, password })
        );
        setSavedCredentials({ email: loggedUser.email, password });
      }
    } catch (e) {}

    return {
      success: true,
      message: `Welcome back, ${loggedUser.username}! Affiliate referrals and trading engine unlocked.`,
      user: loggedUser,
    };
  };

  // Logout User
  const logoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('ts_bot_current_user');
    } catch (e) {}
  };

  // Recover Password
  const recoverPassword = (email: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const tempPassword = 'TS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!';

    return {
      success: true,
      message: `Password recovery passcode generated for ${email}. Temporary recovery pass: ${tempPassword}`,
      tempPass: tempPassword,
    };
  };

  // Simulate a newly registered referral completing onboarding under user's code
  const addSimulatedReferral = (level: 1 | 2 | 3 | 4 = 1) => {
    const hexChars = '0123456789abcdef';
    let randomAddr = '0x';
    for (let i = 0; i < 40; i++) {
      randomAddr += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const tradeVol = [1500, 2500, 4200, 6000][Math.floor(Math.random() * 4)];
    const rate = level === 1 ? 0.01 : level === 2 ? 0.005 : level === 3 ? 0.0025 : 0.001;
    const earnedUsd = tradeVol * rate;
    const earnedBnb = earnedUsd / 614.5;

    const newRef: ReferralUser = {
      id: `ref-dyn-${Date.now()}`,
      address: randomAddr,
      level,
      joinedTimestamp: Date.now(),
      tradingVolumeUsd: tradeVol,
      commissionEarnedBnb: earnedBnb,
      commissionEarnedUsd: earnedUsd,
      status: 'ACTIVE',
    };

    setReferralUsers((prev) => {
      const updated = [newRef, ...prev];
      try {
        localStorage.setItem('ts_bot_referral_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setUnclaimedCommissionBnb((prev) => prev + earnedBnb);

    return {
      success: true,
      message: `New registered referral added under your affiliate code! You earned +${earnedBnb.toFixed(4)} BNB ($${earnedUsd.toFixed(2)} USD).`,
    };
  };

  const selectedPool = pools.find((p) => p.id === selectedPoolId) || pools[0];

  return (
    <ProtocolContext.Provider
      value={{
        pools,
        selectedPool,
        setSelectedPoolId,
        userPositions,
        tradeHistory,
        botConfig,
        setBotConfig,
        wallet,
        refreshTokenBalances,
        lastBalanceRefreshAt,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        claimFaucet,
        addLiquidity,
        removeLiquidity,
        claimPoolFees,
        executeManualSwap,
        executeTierPackage,
        processRechargeBnb,
        processWithdrawalBnb,
        addMinedYieldBnb,
        alerts,
        activeAlertToast,
        dismissAlertToast,
        gmailAuthorized,
        gmailNeedsAuth,
        gmailAccountEmail,
        isGmailSigningIn,
        gmailLastSyncMessage,
        connectGmailAuthorization,
        disconnectGmailAuthorization,
        dispatchWithdrawalEmailForAlert,
        sendTestWithdrawalAuthEmail,
        referralUsers,
        unclaimedCommissionBnb,
        claimReferralCommission,
        currentUser,
        savedCredentials,
        registerUser,
        loginUser,
        logoutUser,
        recoverPassword,
        pendingInviteCode,
        setPendingInviteCode,
        addSimulatedReferral,
        financialMetrics,
        currentBlock,
        triggerBotBurst,
        rechargeBalance,
        rechargeBalanceUsd,
        hasRecharged,
        accumulatedMiningYieldBnb,
        achievedMiningTotalBnb,
        totalWithdrawnFromMinerBnb,
        claimedToWalletMiningBnb,
        claimMiningYield,
        resetSystemData,
        binanceCloud,
        cloudShares,
        connectBinanceMiningCloud,
        disconnectBinanceMiningCloud,
        boostMiningEngine,
        setCloudRegion,
        setMiningMultiplier,
        connectedMachines,
        connectMiningMachine,
        disconnectMiningMachine,
        toggleMachineOverclock,
        buyMiningMachinePackage,
        irdWalletAddress,
        setIrdWalletAddress,
        totalMinesFedToIrdBnb,
        totalMinesFedToIrdUsd,
        irdFeedHistory,
        isMiningRobotFeedingIrd,
        toggleMiningRobotAutoFeed,
        feedMinesToIrd,
        linkMachineToIrd,
        cloudAirdropTokens,
        miningNfts,
        miningProfitFeedHistory,
        claimAirdropToken,
        toggleTokenFeedMining,
        mintOrClaimNft,
        toggleNftFeedMining,
        harvestAllFeedsToMiningProfits,
        stakePools,
        stakeHistory,
        stakeIntoPool,
        unstakeFromPool,
        claimStakeReward,
        toggleStakeFeedToMining,
        miningFeedEnabled,
        miningFeedAccumulatedUsd,
        miningFeedTotalSettledUsd,
        toggleMiningFeed,
        collectMiningFeedToProfits,
        advance24hMiningFeed,
        adSlots,
        createTsNft,
        toggleNftStakePoolConnection,
        toggleNftToNftLink,
        linkAllNftsToRwaAndTsBnb,
        connectNftToAllStakePools,
        connectStakePoolWithAllNfts,
        toggleAdConnection,
        connectAllAds,
        createAdConnection,
        googleAdsConfig,
        googleAdsConversions,
        updateGoogleAdsConfig,
        toggleGoogleAdsStatus,
        triggerGoogleAdsConversion,
        popupAdEnabled,
        activePopupAd,
        togglePopupAdEnabled,
        openPopupBusinessAd,
        dismissPopupBusinessAd,
        nextPopupBusinessAd,
        recordPopupAdEngagement,
        cip95State,
        govSubmissions,
        connectCip95Wallet,
        registerCip95DRep,
        submitProjectToGovernment,
        voteOnGovernmentSubmission,
        isVideoNftPlaying,
        setIsVideoNftPlaying,
        videoPlayEarningsUsd,
        videoNftPoolEarningsUsd,
        collectVideoAndNftPoolMoney,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}
