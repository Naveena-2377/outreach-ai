import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";

type MeetingRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  meeting_type: string;
  leads: {
    id: string;
    name: string;
    company: string | null;
  } | null;
};

export default async function MeetingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meetings } = user
    ? await supabase
        .from("meetings")
        .select(
          "id, scheduled_at, duration_minutes, status, notes, meeting_type, leads (id, name, company)"
        )
        .eq("owner_id", user.id)
        .order("scheduled_at", { ascending: true })
    : { data: [] as MeetingRow[] };

  const { data: googleToken } = user
    ? await supabase
        .from("google_tokens")
        .select("owner_id")
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  const isGoogleConnected = !!googleToken;

  const now = new Date();
  const allMeetings = (meetings as unknown as MeetingRow[]) || [];
  const upcoming = allMeetings.filter((m) => new Date(m.scheduled_at) >= now);
  const past = allMeetings
    .filter((m) => new Date(m.scheduled_at) < now)
    .reverse();

  return (
    <div>
      <div className="mb-2 flex items-start justify-between">
        <PageHeader eyebrow="SCHEDULING" title="Meeting Scheduler" />
        {isGoogleConnected ? (
          <div className="rounded-md border border-border-subtle bg-bg-card px-4 py-2 text-sm text-accent-green">
            Google Calendar connected
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-bg-app"
          >
            Connect Google Calendar
          </a>
        )}
      </div>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="font-mono-label mb-3 text-[11px] text-text-secondary">
            UPCOMING ({upcoming.length})
          </h2>
          <MeetingsTable meetings={upcoming} emptyText="No upcoming meetings scheduled." />
        </section>

        <section>
          <h2 className="font-mono-label mb-3 text-[11px] text-text-secondary">
            PAST ({past.length})
          </h2>
          <MeetingsTable meetings={past} emptyText="No past meetings yet." />
        </section>
      </div>
    </div>
  );
}

function MeetingsTable({
  meetings,
  emptyText,
}: {
  meetings: MeetingRow[];
  emptyText: string;
}) {
  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-8 text-center text-text-secondary">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <table className="w-full">
        <thead>
          <tr className="font-mono-label border-b border-border-subtle text-left text-[10px] text-text-muted">
            <th className="pb-3">Lead</th>
            <th className="pb-3">Company</th>
            <th className="pb-3">Date</th>
            <th className="pb-3">Time</th>
            <th className="pb-3">Duration</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Type</th>
            <th className="pb-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((m) => {
            const dt = new Date(m.scheduled_at);
            return (
              <tr key={m.id} className="border-b border-border-subtle text-sm">
                <td className="py-3 pr-4 text-text-primary">
                  {m.leads?.name ?? "—"}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {m.leads?.company ?? "—"}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {dt.toLocaleDateString()}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {m.duration_minutes} min
                </td>
                <td className="py-3 pr-4 text-text-secondary capitalize">
                  {m.status}
                </td>
                <td className="py-3 pr-4 text-text-secondary capitalize">
                  {m.meeting_type.replace("_", " ")}
                </td>
                <td className="py-3 pr-4 text-text-muted">
                  {m.notes || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
