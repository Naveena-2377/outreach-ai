"use client";

import { useState } from "react";
import { MapPin, Loader2, PlusCircle, Search, Check, X, ExternalLink, ChevronDown } from "lucide-react";
import { createLeadsBulk, type NewLead } from "@/lib/actions/leads";

type PlacesLead = NewLead & {
  socialPlatform?: string;
  socialUrl?: string;
  _foundEmail?: string;
  _emailLoading?: boolean;
};

function openLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function LocalBusinessFinder() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [leads, setLeads] = useState<PlacesLead[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  async function runSearch(pageToken?: string) {
    const res = await fetch("/api/leads/places-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, city, region, pageToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Search failed");
    return json as { leads: PlacesLead[]; nextPageToken: string | null };
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setImported(null);
    setLeads([]);
    setNextPageToken(null);
    setLoading(true);

    try {
      const { leads, nextPageToken } = await runSearch();
      setLeads(leads);
      setNextPageToken(nextPageToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!nextPageToken) return;
    setLoadingMore(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const { leads: more, nextPageToken: newToken } = await runSearch(nextPageToken);
      setLeads((prev) => [...prev, ...more]);
      setNextPageToken(newToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleFindEmail(index: number) {
    const lead = leads[index];
    if (!lead.website) return;

    setLeads((prev) =>
      prev.map((l, i) => (i === index ? { ...l, _emailLoading: true } : l))
    );

    try {
      const domain = new URL(lead.website).hostname.replace(/^www\./, "");
      const res = await fetch("/api/leads/hunter-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      const email = json.leads?.[0]?.email;
      setLeads((prev) =>
        prev.map((l, i) =>
          i === index ? { ...l, _foundEmail: email ?? "not found", _emailLoading: false } : l
        )
      );
    } catch (e) {
      setLeads((prev) =>
        prev.map((l, i) =>
          i === index
            ? { ...l, _foundEmail: e instanceof Error ? e.message : "lookup failed", _emailLoading: false }
            : l
        )
      );
    }
  }

  async function handleImportAll() {
    setImporting(true);
    try {
      const toImport = leads.map((l) => {
        const { socialPlatform, socialUrl, _foundEmail, _emailLoading, ...rest } = l;
        return {
          ...rest,
          email: _foundEmail && _foundEmail !== "not found" && !_foundEmail.includes("failed") ? _foundEmail : rest.email,
          notes: socialUrl ? `${socialPlatform}: ${socialUrl}` : undefined,
        };
      });
      const count = await createLeadsBulk(toImport);
      setImported(count);
      setLeads([]);
      setNextPageToken(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
      <div className="font-mono-label mb-1 text-[10px] text-text-secondary">
        LOCAL BUSINESS FINDER
      </div>
      <p className="mb-5 text-sm text-text-secondary">
        Search real businesses by category and region, down to a single city or
        town. Powered by Google Places. Results land here for you to review and
        reach out to manually.
      </p>

      <form onSubmit={handleSearch} className="grid grid-cols-3 gap-3">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. salon)"
          required
          className="rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g. Erode)"
          className="rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Region (e.g. Tamil Nadu)"
          className="rounded-md border border-border-strong bg-bg-card-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="col-span-3 flex items-center justify-center gap-2 rounded-md bg-accent-cyan px-5 py-2.5 text-sm font-semibold text-bg-app hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          {loading ? "Searching..." : "Search businesses"}
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
          <div className="mb-3 max-h-96 overflow-y-auto rounded-md border border-border-subtle">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-card-hover">
                <tr className="font-mono-label text-left text-[10px] text-text-muted">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Website</th>
                  <th className="px-3 py-2">Social</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className="px-3 py-2 text-text-primary">{l.name}</td>
                    <td className="px-3 py-2 text-text-secondary">{l.phone ? l.phone : "none"}</td>
                    <td className="px-3 py-2">
                      {l.website ? (
                        <button
                          type="button"
                          onClick={() => openLink(l.website as string)}
                          className="flex items-center gap-1.5 text-accent-green hover:underline"
                        >
                          <Check size={13} /> {new URL(l.website).hostname.replace(/^www\./, "")}
                          <ExternalLink size={11} />
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-text-muted">
                          <X size={13} /> no website
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {l.socialUrl ? (
                        <button
                          type="button"
                          onClick={() => openLink(l.socialUrl as string)}
                          className="inline-flex items-center gap-1 rounded-full border border-accent-cyan/30 bg-accent-cyan-dim px-2 py-0.5 text-xs text-accent-cyan hover:underline"
                        >
                          {l.socialPlatform}
                          <ExternalLink size={10} />
                        </button>
                      ) : (
                        "none"
                      )}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {l._foundEmail ? (
                        <span className={l._foundEmail.includes("not found") || l._foundEmail.includes("failed") ? "text-text-muted" : "text-accent-green"}>
                          {l._foundEmail}
                        </span>
                      ) : l.website ? (
                        <button
                          type="button"
                          onClick={() => handleFindEmail(i)}
                          disabled={l._emailLoading}
                          className="flex items-center gap-1 text-xs text-accent-cyan hover:underline disabled:opacity-60"
                        >
                          {l._emailLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Search size={12} />
                          )}
                          Find email
                        </button>
                      ) : (
                        "none"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImportAll}
              disabled={importing}
              className="flex items-center gap-2 rounded-md border border-accent-cyan px-4 py-2 text-sm font-medium text-accent-cyan hover:bg-accent-cyan-dim disabled:opacity-60"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Import all {leads.length}
            </button>

            {nextPageToken && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-card-hover disabled:opacity-60"
              >
                {loadingMore ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
                {loadingMore ? "Loading..." : "Load next 20"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}