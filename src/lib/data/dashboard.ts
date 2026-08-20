import { createClient } from "@/lib/supabase/server";
import type { MonthlyPoint } from "@/components/MonthlyActivityChart";

export type DashboardStats = {
  totalLeads: number;
  emailsSent: number;
  replyRate: number;
  positiveReplies: number;
  meetingsBooked: number;
  bookingRate: number;
  totalTouches: number;
  clientsClosed: number;
  conversionRate: number;
  bounced: number;
  monthlyActivity: MonthlyPoint[];
  pipeline: Record<string, number>;
};

const EMPTY_STATS: DashboardStats = {
  totalLeads: 0,
  emailsSent: 0,
  replyRate: 0,
  positiveReplies: 0,
  meetingsBooked: 0,
  bookingRate: 0,
  totalTouches: 0,
  clientsClosed: 0,
  conversionRate: 0,
  bounced: 0,
  monthlyActivity: [],
  pipeline: {},
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ data: leads }, { data: emails }, { data: meetings }, { data: touches }] =
    await Promise.all([
      supabase.from("leads").select("id, stage, created_at").eq("owner_id", userId),
      supabase
        .from("email_messages")
        .select("id, status, sent_at")
        .eq("owner_id", userId),
      supabase.from("meetings").select("id, scheduled_at").eq("owner_id", userId),
      supabase.from("lead_touches").select("id").eq("owner_id", userId),
    ]);

  if (!leads) return EMPTY_STATS;

  const totalLeads = leads.length;
  const emailsSent = (emails ?? []).filter((e) => e.status !== "draft").length;
  const replied = (emails ?? []).filter((e) => e.status === "replied").length;
  const bounced = (emails ?? []).filter((e) => e.status === "bounced").length;
  const clientsClosed = leads.filter((l) => l.stage === "client").length;
  const meetingsBooked = meetings?.length ?? 0;
  const totalTouches = touches?.length ?? 0;

  const replyRate = emailsSent > 0 ? Math.round((replied / emailsSent) * 100) : 0;
  const bookingRate = replied > 0 ? Math.round((meetingsBooked / replied) * 100) : 0;
  const conversionRate =
    totalLeads > 0 ? Math.round((clientsClosed / totalLeads) * 100) : 0;

  const pipeline: Record<string, number> = {};
  for (const lead of leads) {
    pipeline[lead.stage] = (pipeline[lead.stage] ?? 0) + 1;
  }

  const monthlyActivity = buildMonthlyActivity(leads, emails ?? [], meetings ?? []);

  return {
    totalLeads,
    emailsSent,
    replyRate,
    positiveReplies: replied,
    meetingsBooked,
    bookingRate,
    totalTouches,
    clientsClosed,
    conversionRate,
    bounced,
    monthlyActivity,
    pipeline,
  };
}

function buildMonthlyActivity(
  leads: { created_at: string }[],
  emails: { sent_at: string | null }[],
  meetings: { scheduled_at: string }[]
): MonthlyPoint[] {
  const now = new Date();
  const months: MonthlyPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;

    const emailsInMonth = emails.filter(
      (e) => e.sent_at && monthKeyOf(new Date(e.sent_at)) === monthKey
    ).length;
    const leadsInMonth = leads.filter(
      (l) => monthKeyOf(new Date(l.created_at)) === monthKey
    ).length;
    const meetingsInMonth = meetings.filter(
      (m) => monthKeyOf(new Date(m.scheduled_at)) === monthKey
    ).length;

    months.push({ month: label, emails: emailsInMonth, leads: leadsInMonth, meetings: meetingsInMonth });
  }

  return months;
}

function monthKeyOf(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}
