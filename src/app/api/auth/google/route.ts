import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // needed to get a refresh_token
    prompt: "consent",      // forces refresh_token on every connect, not just the first time
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });

  return NextResponse.redirect(url);
}