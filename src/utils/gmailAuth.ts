import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CONTRACTS } from '../data/constants';

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'] as const;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  login_hint: CONTRACTS.ALERT_EMAIL,
  prompt: 'consent select_account',
});

// Strict in-memory token caching only (never localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUserEmail: string | null = null;

export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      cachedUserEmail = user.email;
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      cachedUserEmail = null;
      onAuthFailure?.();
    }
  });
};

export const googleSignInForGmail = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Gmail send authorization token from Google Sign-In.');
    }
    cachedAccessToken = credential.accessToken;
    cachedUserEmail = result.user.email;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getGmailAccessToken = (): string | null => cachedAccessToken;
export const getGmailUserEmail = (): string | null => cachedUserEmail;

export const logoutGmailAuth = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedUserEmail = null;
};

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface WithdrawalEmailPayload {
  recipientEmail?: string;
  amountBnb: number;
  amountUsd: number;
  withdrawalChargeUsd?: number;
  totalDebitedBnb?: number;
  destinationAddress: string;
  txHash: string;
  blockNumber: number;
  source?: string;
  isTestSync?: boolean;
}

export interface WithdrawalEmailResult {
  delivered: boolean;
  needsAuth?: boolean;
  messageId?: string;
  threadId?: string;
  sentFrom?: string;
  error?: string;
}

export const sendWithdrawalAuthorizationEmail = async (
  payload: WithdrawalEmailPayload
): Promise<WithdrawalEmailResult> => {
  const accessToken = getGmailAccessToken();
  if (!accessToken) {
    return {
      delivered: false,
      needsAuth: true,
      error: 'Connect your Google account (sovereignstateofsouthafrica@gmail.com) to authorize live Gmail delivery.',
    };
  }

  const toEmail = payload.recipientEmail || CONTRACTS.ALERT_EMAIL;
  const fromEmail = cachedUserEmail || toEmail;
  const chargeUsd = payload.withdrawalChargeUsd ?? 1.0;
  const totalBnb = payload.totalDebitedBnb ?? payload.amountBnb;
  const timestampIso = new Date().toISOString();

  const subject = payload.isTestSync
    ? `[TS PROTOCOL] Withdrawal Email Authorization Sync Verified`
    : `[TS PROTOCOL] Withdrawal Authorization Request - ${payload.amountBnb.toFixed(4)} BNB ($${payload.amountUsd.toFixed(2)} USD)`;

  const bodyLines = [
    payload.isTestSync
      ? 'TS PROTOCOL — GMAIL WITHDRAWAL AUTHORIZATION SYNC CONFIRMED'
      : 'TS PROTOCOL — OFFICIAL BNB WITHDRAWAL AUTHORIZATION REQUEST',
    '====================================================================',
    '',
    `Authorized Recipient Email : ${toEmail}`,
    `Dispatched From Account    : ${fromEmail}`,
    `Timestamp (UTC)            : ${timestampIso}`,
    `Network                    : BNB Smart Chain (BEP-20)`,
    '',
    'TRANSACTION DETAILS',
    '--------------------------------------------------------------------',
    `Requested Withdrawal       : ${payload.amountBnb.toFixed(6)} BNB ($${payload.amountUsd.toFixed(2)} USD)`,
    `Protocol Withdrawal Charge : $${chargeUsd.toFixed(2)} USD`,
    `Total Debited from Miner   : ${totalBnb.toFixed(6)} BNB`,
    `Destination Wallet Address : ${payload.destinationAddress}`,
    `Transaction Hash           : ${payload.txHash}`,
    `Block Height               : #${payload.blockNumber}`,
    `Source Engine              : ${payload.source || 'Unified TS BOT & IRD Miner'}`,
    '',
    'Status: AUTHORIZED & DISPATCHED VIA GMAIL API',
    'Please retain this authorization email as proof of your withdrawal dispatch.',
  ];

  const mimeMessage = [
    `To: ${toEmail}`,
    `From: ${fromEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyLines.join('\r\n'),
  ].join('\r\n');

  try {
    const raw = encodeBase64Url(mimeMessage);
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMessage =
        errData?.error?.message || `Gmail API returned HTTP ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        cachedAccessToken = null;
        return {
          delivered: false,
          needsAuth: true,
          error: `Gmail authorization expired or insufficient permissions: ${errMessage}`,
        };
      }
      return {
        delivered: false,
        error: errMessage,
      };
    }

    const data = await response.json();
    return {
      delivered: true,
      messageId: data.id,
      threadId: data.threadId,
      sentFrom: fromEmail,
    };
  } catch (err: any) {
    return {
      delivered: false,
      error: err?.message || 'Network error calling Gmail API.',
    };
  }
};
