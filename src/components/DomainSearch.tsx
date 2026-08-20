"use client";

import { useState } from "react";
import { Search, Loader2, PlusCircle } from "lucide-react";
import { createLeadsBulk, type NewLead } from "@/lib/actions/leads";

export function DomainSearch() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<NewLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setImported(null);
    setLeads([]);
    setLoading(true);

    try {
      const res = await fetch("/api/leads/hunter-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, "") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      setLeads(json.leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleImportAll() {
    setImporting(true);
    try {
      const count = await createLeadsBulk(leads);
      setImported(count);
      setLeads([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
      <div className="font-mono-label mb-1 text-[10px] text-text-secondary">
        FIND CONTACTS AT A COMPANY
      </div>
      <p className="mb-5 text-sm text-text-secondary">
        Powered by Hunter.io's Domain Search API — looks up verified email
        contacts for a company's domain. Needs a free Hunter.io API key.
      </p>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. stripe.com"
          required
          className="flex-1 rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-accent-cyan px-5 py-2.5 text-sm font-semibold text-bg-app hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-accent-pink">{error}</p>}
      {imported !== null && (
        <p className="mt-4 text-sm text-accent-green">
          Imported {imported} lead{imported === 1 ? "" : "s"} to your database.
        </p>
      )}

      {leads.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 max-h-64 overflow-y-auto rounded-md border border-border-subtle">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-card-hover">
                <tr className="font-mono-label text-left text-[10px] text-text-muted">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className="px-3 py-2 text-text-primary">{l.name}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.title ?? "—"}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleImportAll}
            disabled={importing}
            className="flex items-center gap-2 rounded-md border border-accent-cyan px-4 py-2 text-sm font-medium text-accent-cyan hover:bg-accent-cyan-dim disabled:opacity-60"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
            Import all {leads.length}
          </button>
        </div>
      )}
    </div>
  );
}
