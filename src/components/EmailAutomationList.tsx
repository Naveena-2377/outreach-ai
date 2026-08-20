"use client";

import { useState } from "react";
import { Send, Loader2, MailCheck, MailOpen, MailX, FileText } from "lucide-react";
import { sendEmail, markEmailReplied } from "@/lib/actions/emails";

type EmailRow = {
  id: string;
  subject: string | null;
  body: string;
  status: string;
  sequence_step: number;
  sent_at: string | null;
  created_at: string;
  lead_id: string;
  leads: { name: string; company: string | null; email: string | null }[] | { name: string; company: string | null; email: string | null } | null;
};

const STATUS_STYLE: Record<string, { label: string; className: string; icon: typeof FileText }> = {
  draft: { label: "Draft", className: "text-text-muted border-border-strong", icon: FileText },
  sent: { label: "Sent", className: "text-accent-cyan border-accent-cyan/30", icon: Send },
  opened: { label: "Opened", className: "text-accent-green border-accent-green/30", icon: MailOpen },
  replied: { label: "Replied", className: "text-accent-green border-accent-green/30", icon: MailCheck },
  bounced: { label: "Bounced", className: "text-accent-pink border-accent-pink/30", icon: MailX },
};

function getLead(email: EmailRow) {
  return Array.isArray(email.leads) ? email.leads[0] : email.leads;
}

export function EmailAutomationList({ emails }: { emails: EmailRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await sendEmail(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkReplied(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await markEmailReplied(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-bg-card/50 px-8 py-16 text-center text-sm text-text-secondary">
        No email drafts yet. Go to AI Personalization, generate one for a lead, and save it as a
        draft, it will show up here ready to send.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-accent-pink">{error}</p>}
      <div className="space-y-3">
        {emails.map((email) => {
          const style = STATUS_STYLE[email.status] ?? STATUS_STYLE.draft;
          const StatusIcon = style.icon;
          const isBusy = busyId === email.id;
          const lead = getLead(email);

          return (
            <div
              key={email.id}
              className="rounded-xl border border-border-subtle bg-bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {lead?.name ?? "Unknown lead"}
                    </span>
                    {lead?.company && (
                      <span className="text-sm text-text-muted">at {lead.company}</span>
                    )}
                    {email.sequence_step > 0 && (
                      <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs text-text-muted">
                        Follow-up #{email.sequence_step}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-sm text-text-secondary">
                    {email.subject || "(no subject)"}
                  </div>
                  {!lead?.email && (
                    <p className="mt-1 text-xs text-accent-pink">
                      This lead has no email on file. Sending will fail until one is added.
                    </p>
                  )}
                </div>

                <span
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${style.className}`}
                >
                  <StatusIcon size={13} />
                  {style.label}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {email.status === "draft" && (
                  <button
                    onClick={() => handleSend(email.id)}
                    disabled={isBusy || !lead?.email}
                    className="flex items-center gap-2 rounded-md bg-accent-cyan px-4 py-2 text-sm font-semibold text-bg-app hover:opacity-90 disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send
                  </button>
                )}
                {(email.status === "sent" || email.status === "opened") && (
                  <button
                    onClick={() => handleMarkReplied(email.id)}
                    disabled={isBusy}
                    className="flex items-center gap-2 rounded-md border border-accent-green/40 px-4 py-2 text-sm font-medium text-accent-green hover:bg-accent-green/10 disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 size={14} className="animate-spin" /> : <MailCheck size={14} />}
                    Mark as replied
                  </button>
                )}
                {email.sent_at && (
                  <span className="text-xs text-text-muted">
                    Sent {new Date(email.sent_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}