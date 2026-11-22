import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Send,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useProtocol } from '../context/ProtocolContext';
import { CONTRACTS, formatUSD, shortenAddress } from '../data/constants';
import { GoogleSignInButton } from './GoogleSignInButton';

interface AlertsLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsLedgerModal: React.FC<AlertsLedgerModalProps> = ({ isOpen, onClose }) => {
  const {
    alerts,
    withdrawalEmail,
    updateWithdrawalEmail,
    gmailAuthorized,
    gmailNeedsAuth,
    gmailAccountEmail,
    isGmailSigningIn,
    gmailLastSyncMessage,
    connectGmailAuthorization,
    disconnectGmailAuthorization,
    dispatchWithdrawalEmailForAlert,
    sendTestWithdrawalAuthEmail,
  } = useProtocol();

  const [filterType, setFilterType] = useState<'ALL' | 'RECHARGE' | 'WITHDRAWAL'>('ALL');
  const [confirmTestEmail, setConfirmTestEmail] = useState(false);
  const [confirmResendAlertId, setConfirmResendAlertId] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState<string>(withdrawalEmail || CONTRACTS.ALERT_EMAIL);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  const handleSaveWithdrawalEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateWithdrawalEmail(emailInput);
    setFeedbackMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleConfirmTestEmail = async () => {
    setIsSendingEmail(true);
    setFeedbackMsg(null);
    const targetEmail = emailInput.trim() || withdrawalEmail || CONTRACTS.ALERT_EMAIL;
    const res = await sendTestWithdrawalAuthEmail(targetEmail);
    setIsSendingEmail(false);
    setConfirmTestEmail(false);
    if (res.delivered) {
      setFeedbackMsg({
        type: 'success',
        text: `Test withdrawal authorization email sent via Gmail to ${targetEmail} (Message ID: ${res.messageId}).`,
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Could not send test authorization email.',
      });
    }
  };

  const handleConfirmResendAlert = async (alertId: string) => {
    setIsSendingEmail(true);
    setFeedbackMsg(null);
    const targetEmail = emailInput.trim() || withdrawalEmail || CONTRACTS.ALERT_EMAIL;
    const res = await dispatchWithdrawalEmailForAlert(alertId, targetEmail);
    setIsSendingEmail(false);
    setConfirmResendAlertId(null);
    if (res.delivered) {
      setFeedbackMsg({
        type: 'success',
        text: `Withdrawal authorization email sent via Gmail to ${targetEmail} (Message ID: ${res.messageId}).`,
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Failed to deliver email via Gmail.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Withdrawal Email Authorization & Alerts Log
              </h3>
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Authorized Recipient: {withdrawalEmail}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Gmail Withdrawal Authorization Sync Card */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/35 space-y-3 shrink-0 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${gmailAuthorized ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="font-bold text-white">
                  Gmail Withdrawal Authorization Sync
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    gmailAuthorized
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                  }`}
                >
                  {gmailAuthorized ? 'SYNCED' : 'SIGN-IN REQUIRED'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {gmailAuthorized ? (
                  <>
                    Connected as <strong className="text-emerald-300 font-mono">{gmailAccountEmail || withdrawalEmail}</strong>. Real withdrawal authorization emails deliver directly to <strong className="text-white font-mono">{withdrawalEmail}</strong>.
                  </>
                ) : (
                  <>
                    Sign in with Google (<strong className="text-amber-300 font-mono">{withdrawalEmail}</strong>) so withdrawals transmit real authorization emails to your Gmail inbox.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {gmailNeedsAuth ? (
                <GoogleSignInButton
                  onClick={() => connectGmailAuthorization()}
                  disabled={isGmailSigningIn}
                  label={isGmailSigningIn ? 'Connecting...' : 'Sign in with Google'}
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmTestEmail(true)}
                    disabled={isSendingEmail}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnectGmailAuthorization()}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 cursor-pointer"
                    title="Disconnect Gmail Session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Editable Withdrawal Recipient Email Address Bar */}
          <form onSubmit={handleSaveWithdrawalEmail} className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[11px] font-semibold text-zinc-300 shrink-0">
              Recipient Email:
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={CONTRACTS.ALERT_EMAIL}
              className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
              required
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Save Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailInput(CONTRACTS.ALERT_EMAIL);
                  const res = updateWithdrawalEmail(CONTRACTS.ALERT_EMAIL);
                  setFeedbackMsg({ type: res.success ? 'success' : 'error', text: res.message });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono cursor-pointer"
              >
                Default
              </button>
            </div>
          </form>

          {confirmTestEmail && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
              <div className="text-amber-200 font-semibold">
                Confirm sending a test withdrawal authorization email via Gmail?
              </div>
              <div className="text-[11px] text-zinc-300 font-mono">
                To: {emailInput.trim() || withdrawalEmail} • Subject: [TS PROTOCOL] Withdrawal Email Authorization Sync Verified
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmTestEmail}
                  disabled={isSendingEmail}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? 'Sending...' : 'Confirm & Send Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmTestEmail(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(feedbackMsg || gmailLastSyncMessage) && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                feedbackMsg?.type === 'error'
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/70 border-emerald-800/70 text-emerald-300'
              }`}
            >
              {feedbackMsg?.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMsg?.text || gmailLastSyncMessage}</span>
            </div>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('RECHARGE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'RECHARGE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Recharges ({alerts.filter((a) => a.type === 'RECHARGE').length})
          </button>
          <button
            onClick={() => setFilterType('WITHDRAWAL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'WITHDRAWAL'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Withdrawals ({alerts.filter((a) => a.type === 'WITHDRAWAL').length})
          </button>
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredAlerts.map((alert) => {
            const isRecharge = alert.type === 'RECHARGE';
            const isGmailSent = alert.gmailDeliveryStatus === 'SENT' && alert.gmailMessageId;
            return (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isRecharge
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {alert.type}
                    </span>
                    <span className="font-bold text-white font-mono">
                      {alert.amountBnb.toFixed(4)} BNB
                    </span>
                    <span className="text-zinc-500 font-mono">({formatUSD(alert.amountUsd)})</span>
                    {alert.withdrawalChargeUsd && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                        +${alert.withdrawalChargeUsd.toFixed(2)} Fee
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-500 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-zinc-300 font-sans text-xs">{alert.note}</p>

                <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span>Target: {shortenAddress(alert.walletAddress)}</span>
                    <span className="text-zinc-600">•</span>
                    <span>Block #{alert.blockNumber}</span>
                  </div>

                  {!isRecharge && (
                    <div className="flex items-center gap-2">
                      {isGmailSent ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Gmail Sent (ID: {shortenAddress(alert.gmailMessageId!)})</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmResendAlertId(alert.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 font-sans font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Gmail Auth</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {confirmResendAlertId === alert.id && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-2 mt-2">
                    <div className="text-[11px] text-amber-200 font-sans font-semibold">
                      Send withdrawal authorization email for {alert.amountBnb.toFixed(4)} BNB ({formatUSD(alert.amountUsd)}) to {emailInput.trim() || withdrawalEmail}?
                    </div>
                    {gmailNeedsAuth ? (
                      <div className="flex items-center justify-between gap-2">
                        <GoogleSignInButton
                          onClick={() => connectGmailAuthorization()}
                          disabled={isGmailSigningIn}
                          label="Sign in with Google first"
                        />
                        <button
                          type="button"
                          onClick={() => setConfirmResendAlertId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmResendAlert(alert.id)}
                          disabled={isSendingEmail}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] cursor-pointer disabled:opacity-50"
                        >
                          {isSendingEmail ? 'Sending...' : 'Confirm & Send Email'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmResendAlertId(null)}
                          className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
