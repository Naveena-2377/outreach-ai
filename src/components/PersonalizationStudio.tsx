"use client";

import { useState } from "react";
import { Sparkles, Loader2, Save, Check } from "lucide-react";
import { saveEmailDraft } from "@/lib/actions/emails";

type LeadOption = { id: string; name: string; company: string | null; website: string | null };

export function PersonalizationStudio({ leads }: { leads: LeadOption[] }) {
  const [leadId, setLeadId] = useState(leads[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [senderContext, setSenderContext] = useState(
    "A freelance web development & AI automation agency helping small businesses ship websites and automate their client outreach."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [tone, setTone] = useState("friendly");

  async function handleGenerate() {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leadId, notes, senderContext, tone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setSubject(json.draft.subject);
      setBody(json.draft.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!leadId || !subject || !body) return;
    try {
      await saveEmailDraft({ leadId, subject, body });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-bg-card/50 px-8 py-16 text-center text-sm text-text-secondary">
        Add a lead first (Lead Database or Client Finder), then come back here to draft a
        personalized email for them.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
        <label className="text-sm text-text-secondary">Lead</label>
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary focus:border-accent-cyan focus:outline-none"
        >
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
              {l.company ? ` — ${l.company}` : ""}
            </option>
          ))}
        </select>

        <label className="mt-5 block text-sm text-text-secondary">
          Notes about this lead (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="e.g. just raised a seed round, hiring designers, posted about slow site load times…"
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />

        <label className="mt-5 block text-sm text-text-secondary">What you offer</label>
        <textarea
          value={senderContext}
          onChange={(e) => setSenderContext(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary focus:border-accent-cyan focus:outline-none"
        />
                <label className="mt-5 block text-sm text-text-secondary">Tone</label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary focus:border-accent-cyan focus:outline-none"
        >
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
          <option value="professional">Professional</option>
          <option value="understandable">Simple & Understandable</option>
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-md bg-accent-cyan px-5 py-2.5 text-sm font-semibold text-bg-app hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Writing…" : "Generate draft"}
        </button>
        {error && <p className="mt-3 text-sm text-accent-pink">{error}</p>}
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
        <div className="font-mono-label mb-4 text-[10px] text-text-secondary">DRAFT</div>
        <label className="text-sm text-text-secondary">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Generated subject line will appear here"
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <label className="mt-4 block text-sm text-text-secondary">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Generated email body will appear here — fully editable before you save or send."
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!subject || !body}
          className="mt-4 flex items-center gap-2 rounded-md border border-accent-cyan px-4 py-2 text-sm font-medium text-accent-cyan hover:bg-accent-cyan-dim disabled:opacity-40"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved as draft" : "Save as draft"}
        </button>
      </div>
    </div>
  );
}
