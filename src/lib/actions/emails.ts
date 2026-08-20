"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function saveEmailDraft(input: {
  leadId: string;
  subject: string;
  body: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("email_messages").insert({
    owner_id: user.id,
    lead_id: input.leadId,
    subject: input.subject,
    body: input.body,
    sequence_step: 0,
    status: "draft",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/email-automation");
}

export async function sendEmail(emailId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("No RESEND_API_KEY set. Add one from resend.com to .env.local to enable sending.");
  }

  const { data: email, error: fetchError } = await supabase
    .from("email_messages")
    .select("*, leads(email, name)")
    .eq("id", emailId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !email) throw new Error("Email not found");
  const lead = Array.isArray(email.leads) ? email.leads[0] : email.leads;
  if (!lead?.email) throw new Error("This lead has no email address on file");

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "Outreach AI <onboarding@resend.dev>";

  const { data: sendResult, error: sendError } = await resend.emails.send({
    from: fromAddress,
    to: lead.email,
    subject: email.subject ?? "(no subject)",
    text: email.body,
  });

  if (sendError) throw new Error(sendError.message);

  const { error: updateError } = await supabase
    .from("email_messages")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: sendResult?.id,
    })
    .eq("id", emailId);

  if (updateError) throw new Error(updateError.message);

  await supabase
    .from("leads")
    .update({ stage: "contacted", last_interaction_at: new Date().toISOString() })
    .eq("id", email.lead_id);

  revalidatePath("/dashboard/email-automation");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function markEmailReplied(emailId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: email, error: fetchError } = await supabase
    .from("email_messages")
    .select("lead_id")
    .eq("id", emailId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !email) throw new Error("Email not found");

  const { error } = await supabase
    .from("email_messages")
    .update({ status: "replied", replied_at: new Date().toISOString() })
    .eq("id", emailId);
  if (error) throw new Error(error.message);

  await supabase
    .from("leads")
    .update({ stage: "replied", last_interaction_at: new Date().toISOString() })
    .eq("id", email.lead_id);

  revalidatePath("/dashboard/email-automation");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function sendMeetingConfirmation(meetingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured — booking shouldn't fail because of this

  const { data: meeting, error: fetchError } = await supabase
    .from("meetings")
    .select("scheduled_at, duration_minutes, leads(email, name)")
    .eq("id", meetingId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !meeting) return;
  const lead = Array.isArray(meeting.leads) ? meeting.leads[0] : meeting.leads;
  if (!lead?.email) return; // no email on file, nothing to send

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "Outreach AI <onboarding@resend.dev>";
  const when = new Date(meeting.scheduled_at).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await resend.emails.send({
    from: fromAddress,
    to: lead.email,
    subject: "Meeting Confirmed",
    text: `Hi ${lead.name},\n\nYour meeting is confirmed for ${when} (${meeting.duration_minutes} minutes).\n\nLooking forward to speaking with you.`,
  });
}