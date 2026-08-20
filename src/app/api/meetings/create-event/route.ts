import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { meetingId } = await request.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Get the meeting + lead info
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id, scheduled_at, duration_minutes, notes, leads (name)")
    .eq("id", meetingId)
    .eq("owner_id", user.id)
    .single();

  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Get stored Google tokens
  const { data: tokenRow, error: tokenError } = await supabase
    .from("google_tokens")
    .select("access_token, refresh_token, expiry_date")
    .eq("owner_id", user.id)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json(
      { error: "Google Calendar not connected" },
      { status: 400 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expiry_date,
  });

  // Auto-refresh and persist new tokens if they change
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await supabase
        .from("google_tokens")
        .update({
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);
    }
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const startTime = new Date(meeting.scheduled_at);
  const endTime = new Date(
    startTime.getTime() + meeting.duration_minutes * 60000
  );

  const leadName = (meeting.leads as unknown as { name: string } | null)?.name ?? "Lead";

  try {
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `Call with ${leadName}`,
        description: meeting.notes || undefined,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      },
    });

    await supabase
      .from("meetings")
      .update({
        google_event_id: event.data.id,
        google_event_link: event.data.htmlLink,
      })
      .eq("id", meetingId);

    return NextResponse.json({ success: true, eventLink: event.data.htmlLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}