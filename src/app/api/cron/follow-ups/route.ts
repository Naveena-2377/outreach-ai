import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const THRESHOLDS = [
  { step: 1, days: 3 },
  { step: 2, days: 7 },
  { step: 3, days: 14 },
] as const;

function followUpContent(step: number, originalSubject: string | null) {
  const subject = `Re: ${originalSubject ?? "quick note"}`;
  const bodies: Record<number, string> = {
    1: "Just floating this back to the top of your inbox in case it got buried. Still happy to chat whenever works for you.",
    2: "Checking in one more time. If now isn't the right moment, no worries at all. Just let me know and I will leave it there.",
    3: "Last note from me on this. If anything changes down the line and this becomes relevant, feel free to reach out.",
  };
  return { subject, body: bodies[step] ?? bodies[1] };
}

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

  const { data: originals, error } = await supabase
    .from("email_messages")
    .select("id, owner_id, lead_id, subject, sent_at, status, leads(email)")
    .eq("sequence_step", 0)
    .in("status", ["sent", "opened"])
    .not("sent_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sentCount = 0;
  const results: string[] = [];

  for (const original of originals ?? []) {
    const lead = Array.isArray(original.leads) ? original.leads[0] : original.leads;
    if (!lead?.email) continue;

    const daysElapsed =
      (Date.now() - new Date(original.sent_at as string).getTime()) / (1000 * 60 * 60 * 24);

    const { data: existing } = await supabase
      .from("email_messages")
      .select("sequence_step, status")
      .eq("lead_id", original.lead_id)
      .order("sequence_step", { ascending: false })
      .limit(1);

    const latest = existing?.[0];
    if (latest?.status === "replied" || latest?.status === "bounced") continue;
    const maxStepSent = latest?.sequence_step ?? 0;

    const due = THRESHOLDS.find((t) => daysElapsed >= t.days && maxStepSent < t.step);
    if (!due) continue;

    const { subject, body } = followUpContent(due.step, original.subject);

    const { data: sendResult, error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: lead.email,
      subject,
      text: body,
    });
    if (sendError) {
      results.push(`Failed for lead ${original.lead_id}: ${sendError.message}`);
      continue;
    }

    await supabase.from("email_messages").insert({
      owner_id: original.owner_id,
      lead_id: original.lead_id,
      subject,
      body,
      sequence_step: due.step,
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: sendResult?.id,
    });

    sentCount += 1;
    results.push(`Sent step ${due.step} follow-up for lead ${original.lead_id}`);
  }

  return NextResponse.json({ ok: true, sentCount, results });
}