"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { updateLead } from "@/lib/actions/leads";

interface EditLeadModalProps {
  leadId: string;
  initialName: string;
  initialCompany: string | null;
  initialEmail: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditLeadModal({
  leadId,
  initialName,
  initialCompany,
  initialEmail,
  onClose,
  onSaved,
}: EditLeadModalProps) {
  const [name, setName] = useState(initialName);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      await updateLead(leadId, {
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border-subtle bg-bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Edit Lead
        </h2>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          />
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          />
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          />
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Phone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          />
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}