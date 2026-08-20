"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateLeadStage, updateLeadTag, deleteLead } from "@/lib/actions/leads";
import ScheduleMeetingModal from "@/components/ScheduleMeetingModal";
import EditLeadModal from "@/components/EditLeadModal";
import LogTouchModal from "@/components/LogTouchModal";

const STAGES = ["new", "contacted", "replied", "meeting_scheduled", "client", "lost"];
const TAGS = ["hot", "warm", "cold", "follow_up", "client"];

const TAG_COLORS: Record<string, string> = {
  hot: "bg-accent-pink/15 text-accent-pink",
  warm: "bg-accent-amber/15 text-accent-amber",
  cold: "bg-accent-cyan/15 text-accent-cyan",
  follow_up: "bg-purple-400/15 text-purple-300",
  client: "bg-accent-green/15 text-accent-green",
};

export type LeadRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  tag: string | null;
  last_interaction_at: string | null;
};

export function LeadTableRow({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTouchModal, setShowTouchModal] = useState(false);

  const handleDelete = () => {
    if (!confirm(`Delete ${lead.name}? Their meetings and emails will be kept, but no longer linked to this lead.`)) {
      return;
    }
    setDeleting(true);
    startTransition(async () => {
      try {
        await deleteLead(lead.id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete lead.");
        setDeleting(false);
      }
    });
  };

  return (
    <>
      <tr className="border-b border-border-subtle text-sm">
        <td className="py-3 pr-4 text-text-primary">{lead.name}</td>
        <td className="py-3 pr-4 text-text-secondary">{lead.company || "—"}</td>
        <td className="py-3 pr-4 text-text-secondary">{lead.email || "—"}</td>
        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{lead.phone || "—"}</td>
        <td className="py-3 pr-4">
          <select
            defaultValue={lead.stage}
            disabled={isPending}
            onChange={(e) =>
              startTransition(async () => {
                await updateLeadStage(lead.id, e.target.value);
                router.refresh();
              })
            }
            className="rounded-md border border-border-subtle bg-bg-app px-2 py-1 text-xs text-text-secondary"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </td>
        <td className="py-3 pr-4">
          <select
            defaultValue={lead.tag ?? ""}
            disabled={isPending}
            onChange={(e) =>
              startTransition(async () => {
                await updateLeadTag(lead.id, e.target.value);
                router.refresh();
              })
            }
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              TAG_COLORS[lead.tag ?? ""] ?? "bg-bg-card-hover text-text-secondary"
            }`}
          >
            <option value="">No tag</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </td>
        <td className="py-3 pr-4 text-text-muted">
          {lead.last_interaction_at
            ? new Date(lead.last_interaction_at).toLocaleDateString()
            : "—"}
        </td>
        <td className="py-3 pr-4">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-card-hover"
          >
            Schedule
          </button>
        </td>
                <td className="py-3 pr-4">
          <button
            onClick={() => setShowTouchModal(true)}
            className="rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-card-hover"
          >
            Log Touch
          </button>
        </td>
        <td className="py-3 pr-4">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-card-hover"
          >
            Edit
          </button>
        </td>
        <td className="py-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-accent-pink/40 px-2.5 py-1 text-xs text-accent-pink hover:bg-accent-pink/10 disabled:opacity-50"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </td>
      </tr>

      {showScheduleModal && (
        <ScheduleMeetingModal
          leadId={lead.id}
          leadName={lead.name}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            router.refresh();
          }}
        />
      )}
      {showTouchModal && (
  <LogTouchModal
    leadId={lead.id}
    leadName={lead.name}
    onClose={() => setShowTouchModal(false)}
    onLogged={() => {
      router.refresh();
    }}
  />
)}

      {showEditModal && (
        <EditLeadModal
          leadId={lead.id}
          initialName={lead.name}
          initialCompany={lead.company}
          initialEmail={lead.email}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}