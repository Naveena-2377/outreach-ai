import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function fetchWebsiteSnippet(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 2000);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No GEMINI_API_KEY set. Get a free key at aistudio.google.com/apikey and add it to .env.local." },
      { status: 400 }
    );
  }

  const { leadId, notes, senderContext, tone } = await req.json();
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("owner_id", user.id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const websiteSnippet = lead.website ? await fetchWebsiteSnippet(lead.website) : null;

  const prompt = `You are helping a freelancer write a short, genuinely personalized cold outreach email.

Lead details:
- Name: ${lead.name}
- Company: ${lead.company ?? "unknown"}
- Title: ${lead.title ?? "unknown"}
- Industry: ${lead.industry ?? "unknown"}
${websiteSnippet ? `- Website content snippet: ${websiteSnippet}` : ""}
${notes ? `- Notes the sender provided about this lead: ${notes}` : ""}

Sender context (who is sending this email, what they offer):
${senderContext || "A freelance web developer / AI automation consultant."}

Write a short cold email (under 120 words) in a ${tone || "friendly"} tone that:
- Opens with something specific to this lead/company (not generic flattery)
- Briefly states the value the sender offers
- Ends with a low-friction call to action (e.g. "worth a quick chat?")
- No subject line filler like "Re:" or clickbait

Respond ONLY with valid JSON in this exact shape, no markdown fences:
{"subject": "...", "body": "..."}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return NextResponse.json({ error: `AI request failed: ${errText}` }, { status: 500 });
  }

  const data = await geminiRes.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  let parsed: { subject: string; body: string };
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }

  return NextResponse.json({ draft: parsed, usedWebsiteContext: Boolean(websiteSnippet) });
}