"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NewLead = {
  name: string;
  company?: string;
  title?: string;
  website?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  location?: string;
  category?: string;
  industry?: string;
  notes?: string;
  tag?: "hot" | "warm" | "cold" | "follow_up" | "client";
};

export async function createLead(input: NewLead) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("leads").insert({
    owner_id: user.id,
    ...input,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function createLeadsBulk(rows: NewLead[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // de-duplicate by email within this batch, then let the DB be the source of truth
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    const key = (r.email || r.linkedin_url || r.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { error, count } = await supabase
    .from("leads")
    .insert(deduped.map((r) => ({ owner_id: user.id, source: "csv_import", ...r })), {
      count: "exact",
    });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  return count ?? deduped.length;
}

export async function updateLeadStage(leadId: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ stage, last_interaction_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function updateLeadTag(leadId: string, tag: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ tag }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
}
export type LeadEditInput = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export async function updateLead(leadId: string, input: LeadEditInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("leads")
    .update(input)
    .eq("id", leadId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/meetings");
  revalidatePath("/dashboard/email-automation");
}
export async function createLeadTouch(input: {
  leadId: string;
  channel: "linkedin" | "instagram" | "whatsapp" | "email" | "other";
  note?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("lead_touches").insert({
    owner_id: user.id,
    lead_id: input.leadId,
    channel: input.channel,
    note: input.note || null,
  });

  if (error) throw new Error(error.message);

  // Also bump last_interaction_at on the lead, same as other contact actions
  await supabase
    .from("leads")
    .update({ last_interaction_at: new Date().toISOString() })
    .eq("id", input.leadId)
    .eq("owner_id", user.id);

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}