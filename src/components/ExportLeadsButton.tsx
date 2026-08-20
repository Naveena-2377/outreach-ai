"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";

type ExportLead = {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  tag: string | null;
  last_interaction_at: string | null;
};

export function ExportLeadsButton({ leads }: { leads: ExportLead[] }) {
  function handleExport() {
    const rows = leads.map((l) => ({
      Name: l.name,
      Company: l.company ?? "",
      Email: l.email ?? "",
      Phone: l.phone ?? "",
      Stage: l.stage,
      Tag: l.tag ?? "",
      "Last Interaction": l.last_interaction_at
        ? new Date(l.last_interaction_at).toLocaleDateString()
        : "",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={leads.length === 0}
      className="flex items-center gap-2 rounded-md border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-bg-card-hover disabled:opacity-40"
    >
      <Download size={14} />
      Export CSV
    </button>
  );
}