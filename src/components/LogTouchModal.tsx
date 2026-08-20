"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { createLeadTouch } from "@/lib/actions/leads";

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other (call, in-person, etc.)" },
] as const;

interface LogTouchModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
  onLogged: () => void;
}

export default function LogTouchModal({
  leadId,
  leadName,
  onClose,
  onLogged,
}: LogTouchModalProps) {
  const [channel, setChannel] = useState<typeof CHANNELS[number]["value"]>("whatsapp");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await createLeadTouch({ leadId, channel, note: note.trim() || undefined });
      onLogged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log touch.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border-subtle bg-bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Log a Touch — {leadName}
        </h2>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Called, no answer. Will try again Thursday."
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-accent-pink">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-bg-card-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-bg-app disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log Touch"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}