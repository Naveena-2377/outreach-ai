"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";

interface ScheduleMeetingModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
  onScheduled: () => void;
}

export default function ScheduleMeetingModal({
  leadId,
  leadName,
  onClose,
  onScheduled,
}: ScheduleMeetingModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState("discovery_call");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!date || !time) {
      setError("Pick a date and time.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not signed in.");
      setSaving(false);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("meetings")
      .insert({
        lead_id: leadId,
        owner_id: user.id,
        title: `Call with ${leadName}`,
        notes,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        meeting_type: meetingType,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setSaving(false);
      setError(insertError?.message ?? "Failed to save meeting.");
      return;
    }

    try {
      await fetch("/api/meetings/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: inserted.id }),
      });
    } catch {
      // Calendar sync failure shouldn't block the booking itself
    }

    try {
      const { sendMeetingConfirmation } = await import("@/lib/actions/emails");
      await sendMeetingConfirmation(inserted.id);
    } catch {
      // Email failure shouldn't block the booking itself
    }

    setSaving(false);
    onScheduled();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border-subtle bg-bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Schedule Meeting — {leadName}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono-label text-[11px] text-text-secondary">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="font-mono-label text-[11px] text-text-secondary">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Duration (minutes)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
          </select>
        </div>

        <div>
          <label className="font-mono-label text-[11px] text-text-secondary">
            Meeting Type
          </label>
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-subtle bg-bg-app px-2 py-1.5 text-sm text-text-primary"
          >
            <option value="discovery_call">Discovery Call</option>
            <option value="follow_up">Follow-up</option>
            <option value="project_review">Project Review</option>
            <option value="other">Other</option>
          </select>
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
            {saving ? "Booking..." : "Book Meeting"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}