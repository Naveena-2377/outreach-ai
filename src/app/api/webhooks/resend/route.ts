import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: { type: string; data: { email_id: string } };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const messageId = event.data.email_id;
  const supabase = createAdminClient();

  const updates: Record<string, string> = {};
  switch (event.type) {
    case "email.delivered":
      updates.status = "sent";
      break;
    case "email.opened":
      updates.status = "opened";
      updates.opened_at = new Date().toISOString();
      break;
    case "email.bounced":
      updates.status = "bounced";
      updates.bounced_at = new Date().toISOString();
      break;
    default:
      return NextResponse.json({ ok: true, ignored: event.type });
  }

  await supabase
    .from("email_messages")
    .update(updates)
    .eq("provider_message_id", messageId);

  return NextResponse.json({ ok: true });
}