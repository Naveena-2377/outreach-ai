import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(resendKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "Outreach AI <onboarding@resend.dev>";

  // Meetings happening in the next 20-28 hours that haven't had a reminder sent yet
  const now = Date.now();
  const windowStart = new Date(now + 20 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 28 * 60 * 60 * 1000).toISOString();

  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("id, scheduled_at, duration_minutes, status, reminder_sent, leads(email, name)")
    .eq("status", "scheduled")
    .eq("reminder_sent", false)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sentCount = 0;
  const results: string[] = [];

  for (const meeting of meetings ?? []) {
    const lead = Array.isArray(meeting.leads) ? meeting.leads[0] : meeting.leads;
    if (!lead?.email) continue;

    const when = new Date(meeting.scheduled_at).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: lead.email,
      subject: "Meeting Reminder — Tomorrow",
      text: `Hi ${lead.name},\n\nJust a reminder about our meeting tomorrow, ${when} (${meeting.duration_minutes} minutes).\n\nLooking forward to it.`,
    });

    if (sendError) {
      results.push(`Failed for meeting ${meeting.id}: ${sendError.message}`);
      continue;
    }

    await supabase
      .from("meetings")
      .update({ reminder_sent: true })
      .eq("id", meeting.id);

    sentCount += 1;
    results.push(`Sent reminder for meeting ${meeting.id}`);
  }

  return NextResponse.json({ ok: true, sentCount, results });
}