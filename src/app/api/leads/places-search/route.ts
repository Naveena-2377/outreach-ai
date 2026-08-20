import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function classifyLink(url?: string): { website?: string; social?: { platform: string; url: string } } {
  if (!url) return {};
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return { social: { platform: "Instagram", url } };
  if (lower.includes("facebook.com") || lower.includes("fb.com")) return { social: { platform: "Facebook", url } };
  return { website: url };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No GOOGLE_PLACES_API_KEY set. Add one to .env.local to enable this." },
      { status: 400 }
    );
  }

  const { category, city, region, pageToken } = await req.json();
  if (!category || (!city && !region)) {
    return NextResponse.json(
      { error: "category and at least city or region are required" },
      { status: 400 }
    );
  }

  const locationText = [city, region].filter(Boolean).join(", ");
  const textQuery = `${category} in ${locationText}`;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.id,nextPageToken",
    },
    body: JSON.stringify(
      pageToken ? { textQuery, pageSize: 20, pageToken } : { textQuery, pageSize: 20 }
    ),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: json?.error?.message ?? "Google Places request failed" },
      { status: res.status }
    );
  }

  type PlaceResult = {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
  };

  const places = (json.places ?? []) as PlaceResult[];

  const leads = places.map((p) => {
    const { website, social } = classifyLink(p.websiteUri);
    return {
      name: p.displayName?.text ?? "Unknown business",
      company: p.displayName?.text,
      location: p.formattedAddress,
      phone: p.internationalPhoneNumber,
      website,
      socialPlatform: social?.platform,
      socialUrl: social?.url,
      city: city || undefined,
      region: region || undefined,
      category,
      source: "google_places",
    };
  });

  return NextResponse.json({ leads, nextPageToken: json.nextPageToken ?? null });
}
