import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No HUNTER_API_KEY set. Add one from hunter.io (free tier: 25 searches/month) to .env.local to enable this.",
      },
      { status: 400 }
    );
  }

  const { domain } = await req.json();
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(
    domain
  )}&api_key=${apiKey}&limit=25`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: json?.errors?.[0]?.details ?? "Hunter.io request failed" },
      { status: res.status }
    );
  }

  const emails = (json.data?.emails ?? []) as Array<{
    value: string;
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    linkedin?: string | null;
  }>;

  const leads = emails.map((e) => ({
    name: [e.first_name, e.last_name].filter(Boolean).join(" ") || e.value,
    company: json.data?.organization ?? domain,
    title: e.position ?? undefined,
    website: `https://${domain}`,
    linkedin_url: e.linkedin ?? undefined,
    email: e.value,
  }));

  return NextResponse.json({ leads });
}
