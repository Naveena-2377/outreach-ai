"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createLead } from "@/lib/actions/leads";

export function AddLeadForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      await createLead({
        name: String(form.get("name") || ""),
        company: String(form.get("company") || "") || undefined,
        title: String(form.get("title") || "") || undefined,
        email: String(form.get("email") || "") || undefined,
        website: String(form.get("website") || "") || undefined,
        linkedin_url: String(form.get("linkedin_url") || "") || undefined,
        tag: (form.get("tag") as "hot" | "warm" | "cold" | "follow_up" | "client") || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-accent-cyan px-4 py-2.5 text-sm font-semibold text-bg-app hover:opacity-90"
      >
        <Plus size={16} />
        Add Lead
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-text-primary">Add Lead</h3>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" required placeholder="Name" className="input" />
          <input name="company" placeholder="Company" className="input" />
          <input name="title" placeholder="Title" className="input" />
          <input name="email" type="email" placeholder="Email" className="input" />
          <input name="website" placeholder="Website" className="input" />
          <input name="linkedin_url" placeholder="LinkedIn URL" className="input" />
          <select name="tag" className="input" defaultValue="warm">
            <option value="hot">Hot Lead</option>
            <option value="warm">Warm Lead</option>
            <option value="cold">Cold Lead</option>
            <option value="follow_up">Follow Up Needed</option>
            <option value="client">Client</option>
          </select>

          {error && <p className="text-sm text-accent-pink">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-md bg-accent-cyan py-2.5 text-sm font-semibold text-bg-app hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Lead"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border-strong);
          background: var(--bg-app);
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .input:focus {
          outline: none;
          border-color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
}
