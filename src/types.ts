export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  icon: string;
  priceUsd: number;
  change24h: number;
}

export interface LiquidityPool {
  id: string;
  pairName: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: number;
  reserveB: number;
  totalLpSupply: number;
  feeRate: number; // e.g. 0.0025 = 0.25%
  tvlUsd: number;
  volume24h: number;
  fees24h: number;
  apyBase: number;
  apyReward: number;
  contractAddress: string;
}

export interface UserPosition {
  poolId: string;
  lpTokens: number;
  sharePercentage: number;
  stakedTokenA: number;
  stakedTokenB: number;
  accruedFeesUsd: number;
  initialDepositUsd: number;
  currentValueUsd: number;
  joinedAt: number;
}

export interface TradeEvent {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL' | 'ARBITRAGE_REBALANCE';
  poolId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  price: number;
  txHash: string;
  blockNumber: number;
  gasUsedGwei: number;
  slippagePct: number;
  botInitiated: boolean;
}

export interface BotConfig {
  active: boolean;
  autoRebalance: boolean;
  minSpreadPct: number;
  maxSlippagePct: number;
  tradingSpeed: 'normal' | 'fast' | 'turbo';
  targetPair: string;
  totalSwapsExecuted: number;
  totalVolumeUsd: number;
  totalFeesGeneratedUsd: number;
  lastAction: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
  chainId: number;
  balances: {
    BNB: number;
    TS: number;
    USDT: number;
    [key: string]: number;
  };
  connector: 'MetaMask' | 'Binance Wallet' | 'Trust Wallet' | null;
}

export interface FinancialMetric {
  period: string;
  tradingVolume: number;
  feesCollected: number;
  distributedToLPs: number;
  activeLPs: number;
  tvl: number;
}

export interface CryptoAlert {
  id: string;
  type: 'RECHARGE' | 'WITHDRAWAL';
  asset: 'BNB';
  amountBnb: number;
  amountUsd: number;
  walletAddress: string;
  txHash: string;
  timestamp: number;
  status: 'CONFIRMED' | 'DISPATCHED' | 'PENDING';
  recipientEmail: string;
  blockNumber: number;
  note?: string;
  withdrawalChargeUsd?: number;
  withdrawalChargeBnb?: number;
  totalDebitedBnb?: number;
  gmailDeliveryStatus?: 'SENT' | 'NEEDS_AUTH' | 'FAILED';
  gmailMessageId?: string;
  gmailSentFrom?: string;
  gmailError?: string;
}

export interface ReferralUser {
  id: string;
  address: string;
  level: 1 | 2 | 3 | 4;
  joinedTimestamp: number;
  tradingVolumeUsd: number;
  commissionEarnedBnb: number;
  commissionEarnedUsd: number;
  status: 'ACTIVE' | 'IDLE' | 'REGISTERED';
  rechargedAmountUsd?: number;
  note?: string;
}

export interface ReferralLevelStats {
  level: 1 | 2 | 3 | 4;
  ratePct: number;
  count: number;
  volumeUsd: number;
  earnedBnb: number;
  earnedUsd: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  referralCode: string;
  inviterCode?: string;
  registeredAt: number;
  walletAddress: string;
  savedPassword?: string;
  rememberMe: boolean;
  isRegistered: boolean;
}

export interface CloudMiningShare {
  id: string;
  timestamp: number;
  blockNumber: number;
  workerId: string;
  difficulty: string;
  hashrateTh: number;
  shareStatus: 'ACCEPTED' | 'VALIDATED' | 'BOOSTED';
  rewardBnb: number;
  nonce: string;
}

export interface BinanceMiningCloudState {
  connected: boolean;
  poolEndpoint: string;
  region: string;
  hashrateTh: number;
  baseHashrateTh: number;
  multiplier: number;
  activeWorkerId: string;
  acceptedShares: number;
  rejectedShares: number;
  efficiencyPct: number;
  lastBoostTimestamp: number;
  isBoostActive: boolean;
  totalMinedFromCloudBnb: number;
}

export interface MiningMachinePackage {
  id: string;
  name: string;
  model: string;
  tier: string;
  priceUsd: number;
  hashrateTh: number;
  dailyYieldPct: number;
  dailyBnbReward: number;
  powerConsumptionW: number;
  cooling: string;
  efficiencyJTh: number;
  featured?: boolean;
  image: string;
  badge?: string;
  description: string;
  specs: {
    dimensions: string;
    weight: string;
    connection: string;
    warranty: string;
  };
}

export interface ConnectedMachine {
  id: string;
  packageId: string;
  model: string;
  name: string;
  tier: string;
  priceUsd: number;
  hashrateTh: number;
  dailyYieldPct: number;
  purchasedAt: number;
  status: 'ONLINE' | 'OVERCLOCKED' | 'MAINTENANCE';
  totalMinedBnb: number;
  powerW: number;
  temperatureC: number;
  serialNumber: string;
  irdLinked: boolean;
  irdWalletAddress: string;
  irdFedMinesBnb: number;
  lastIrdFeedTimestamp?: number;
}

export interface IrdFeedEvent {
  id: string;
  timestamp: number;
  machineId?: string;
  machineName?: string;
  amountBnb: number;
  amountUsd: number;
  source: 'MINING_ROBOT' | 'HARDWARE_RIG' | 'CLOUD_CLUSTER';
  targetIrdWallet: string;
  txHash: string;
  status: 'FED_TO_IRD' | 'SYNCED' | 'CONFIRMED';
  blockNumber: number;
  note?: string;
}

export interface CloudAirdropToken {
  id: string;
  symbol: string;
  name: string;
  category: 'CLOUD_AIRDROP' | 'MEME_TOKEN';
  network: string;
  contractAddress: string;
  claimableAmount: number;
  claimedAmount: number;
  priceUsd: number;
  miningBoostPct: number;
  dailyFeedUsd: number;
  isFeedingMining: boolean;
  status: 'CLAIMABLE' | 'CLAIMED' | 'FEEDING_MINING';
  totalFedBnb: number;
  lastClaimedAt?: number;
  description: string;
}

export interface MiningNftAsset {
  id: string;
  tokenId: string;
  name: string;
  collection: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  image: string;
  videoUrl?: string;
  floorValueUsd: number;
  miningProfitMultiplier: number;
  dailyFeedUsd: number;
  owned: boolean;
  isStakedFeeding: boolean;
  totalFedBnb: number;
  mintCostBnb: number;
  connectedPoolIds?: string[];
  linkedNftIds?: string[];
  rwaValueUsd?: number;
  isMemeNft?: boolean;
  stakePoolApyBoostPct?: number;
  editionLabel?: string;
  description: string;
}

export interface MiningProfitFeedEvent {
  id: string;
  timestamp: number;
  sourceType: 'CLOUD_AIRDROP' | 'MEME_TOKEN' | 'NFT_RELIC' | 'MINING_FEED' | 'AD_REVENUE';
  sourceName: string;
  symbolOrId: string;
  amountBnb: number;
  amountUsd: number;
  txHash: string;
  blockNumber: number;
}

export interface AdCampaignSlot {
  id: string;
  title: string;
  advertiser: string;
  network?: 'GOOGLE_ADS' | 'WEB3_PARTNER';
  campaignType?: 'SEARCH' | 'DISPLAY' | 'PERFORMANCE_MAX' | 'NFT_SPONSOR';
  businessCategory?: 'FASHION_RETAIL' | 'SUPERSTORE_TECH' | 'GROCERY_FOOD' | 'FINANCE_TELECOM';
  brandDomain?: string;
  destinationUrl?: string;
  headlineOffer?: string;
  adFormat?: 'POPUP_BUSINESS' | 'BANNER' | 'SEARCH' | 'DISPLAY';
  placement: 'NFT_SHOWCASE' | 'STAKE_POOL_SPONSOR' | 'MINING_CLOUD' | 'DASHBOARD_BANNER';
  connectedTarget: 'TS_NFT' | 'STAKE_POOLS' | 'MINING_PROFITS';
  dailyRevenueUsd: number;
  impressions24h: number;
  ctrPct: number;
  connected: boolean;
  targetAddress: string;
  totalEarnedUsd: number;
  description: string;
}

export interface GoogleAdsConfig {
  advertiserName: string;
  entityType: string;
  jurisdiction: string;
  kycVerified: boolean;
  verifiedChecks: string[];
  googleTagId: string;
  conversionLabel: string;
  campaignStatus: 'ACTIVE' | 'PAUSED' | 'READY';
  dailyBudgetUsd: number;
}

export interface GoogleAdsConversionEvent {
  id: string;
  timestamp: number;
  eventName: string;
  sendTo: string;
  valueUsd: number;
  currency: string;
  source: string;
  dispatchedToGtag: boolean;
}

export type StakePoolCategory =
  | 'COMMODITY_RWA'
  | 'TREASURY_MONEY'
  | 'REAL_ESTATE_RWA'
  | 'CRYPTO_STAKE';

export interface StakePool {
  id: string;
  name: string;
  symbol: string;
  category: StakePoolCategory;
  assetBacking: string;
  custodian: string;
  settlementCurrency: 'USD' | 'BNB' | 'USDT';
  apyPct: number;
  dailyRatePct: number;
  tvlUsd: number;
  minStakeUsd: number;
  lockPeriodDays: number;
  userStakedUsd: number;
  userStakedBnb: number;
  accruedRewardsUsd: number;
  accruedRewardsBnb: number;
  feedToMiningProfits: boolean;
  totalYieldPaidUsd: number;
  description: string;
}

export interface StakePoolEvent {
  id: string;
  timestamp: number;
  poolId: string;
  poolName: string;
  action: 'STAKE' | 'UNSTAKE' | 'CLAIM_REWARD' | 'FEED_MINING';
  amountUsd: number;
  amountBnb: number;
  paymentMethod: 'BNB' | 'USDT' | 'RECHARGE';
  txHash: string;
  blockNumber: number;
}

export interface Cip95DRepState {
  connected: boolean;
  walletName: string;
  networkId: number;
  drepId: string;
  drepKeyHash: string;
  registeredPubStakeKey: string;
  delegatedPool: string;
  votingPowerAda: number;
  cipStandards: string[];
  lastSyncedAt: number;
}

export interface GovernmentSubmission {
  id: string;
  submittedAt: number;
  referenceCode: string;
  projectTitle: string;
  entityName: string;
  cipStandard: string;
  targetAgency: string;
  drepId: string;
  liveAppUrl: string;
  assetSummary: string;
  adNetworkSummary: string;
  anchorHash: string;
  submissionTrack: 'GOVERNMENT_VOTING' | 'TREASURY_ALLOCATION' | 'DUAL_GOV_AND_TREASURY';
  treasuryAmountUsd?: number;
  treasuryAmountAda?: number;
  treasuryDestination?: string;
  voteYesCount?: number;
  voteNoCount?: number;
  voteAbstainCount?: number;
  votePowerYesAda?: number;
  userVote?: 'YES' | 'NO' | 'ABSTAIN';
  votingOpenOnline?: boolean;
  status:
    | 'SUBMITTED_TO_GOV'
    | 'VOTING_ONLINE'
    | 'SUBMITTED_TO_TREASURY'
    | 'LAUNCH_READY'
    | 'VERIFIED_ANCHOR';
}
