"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, Check, X, Loader2 } from "lucide-react";
import { createLeadsBulk, type NewLead } from "@/lib/actions/leads";

type ParsedRow = NewLead & { _valid: boolean };

type StringLeadField = Exclude<keyof NewLead, "tag">;

// Maps common CSV header variants to our lead fields
const FIELD_ALIASES: Record<string, StringLeadField> = {
  name: "name",
  "full name": "name",
  fullname: "name",
  company: "company",
  organization: "company",
  title: "title",
  "job title": "title",
  role: "title",
  website: "website",
  url: "website",
  linkedin: "linkedin_url",
  "linkedin url": "linkedin_url",
  "linkedin_url": "linkedin_url",
  email: "email",
  "email address": "email",
  location: "location",
  city: "location",
  industry: "industry",
};

function normalizeRow(raw: Record<string, string>): ParsedRow {
  const row: Partial<NewLead> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = FIELD_ALIASES[key.trim().toLowerCase()];
    if (field && value?.trim()) {
      row[field] = value.trim();
    }
  }
  return { ...row, name: row.name ?? "", _valid: Boolean(row.name) };
}

export function CsvImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    setResult(null);
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map(normalizeRow);
        if (parsed.length === 0) {
          setError("No rows found in that file.");
          return;
        }
        setRows(parsed);
      },
      error: (err) => setError(err.message),
    });
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r._valid);
    if (validRows.length === 0) {
      setError("No rows have a name — nothing to import.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const count = await createLeadsBulk(
        validRows.map(({ _valid, ...r }) => r)
      );
      setResult({ count });
      setRows([]);
      setFileName(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
      <div className="font-mono-label mb-1 text-[10px] text-text-secondary">
        IMPORT LEADS
      </div>
      <p className="mb-5 text-sm text-text-secondary">
        Upload a CSV exported from LinkedIn Sales Navigator, an event list, or
        any spreadsheet. Recognized columns: name, company, title, website,
        linkedin, email, location, industry.
      </p>

      {rows.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center transition-colors hover:border-accent-cyan hover:bg-bg-card-hover"
        >
          <UploadCloud size={28} className="text-accent-cyan" />
          <div className="text-sm text-text-primary">Click to choose a CSV file</div>
          <div className="text-xs text-text-muted">or drag it here</div>
        </button>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between rounded-md border border-border-subtle bg-bg-card-hover px-4 py-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={18} className="text-accent-cyan" />
              <span className="text-sm text-text-primary">{fileName}</span>
            </div>
            <button
              onClick={() => {
                setRows([]);
                setFileName(null);
              }}
              className="text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mb-4 flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-accent-green">
              <Check size={14} /> {validCount} ready to import
            </span>
            {invalidCount > 0 && (
              <span className="flex items-center gap-1.5 text-accent-amber">
                <X size={14} /> {invalidCount} skipped (no name)
              </span>
            )}
          </div>

          <div className="mb-5 max-h-64 overflow-y-auto rounded-md border border-border-subtle">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-card-hover">
                <tr className="font-mono-label text-left text-[10px] text-text-muted">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    <td className={`px-3 py-2 ${!r._valid ? "text-text-muted" : "text-text-primary"}`}>
                      {r.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">{r.company ?? "—"}</td>
                    <td className="px-3 py-2 text-text-secondary">{r.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || validCount === 0}
            className="flex items-center gap-2 rounded-md bg-accent-cyan px-5 py-2.5 text-sm font-semibold text-bg-app transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {importing ? "Importing…" : `Import ${validCount} leads`}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && <p className="mt-4 text-sm text-accent-pink">{error}</p>}
      {result && (
        <p className="mt-4 text-sm text-accent-green">
          Imported {result.count} lead{result.count === 1 ? "" : "s"} — check the Lead Database.
        </p>
      )}
    </div>
  );
}
