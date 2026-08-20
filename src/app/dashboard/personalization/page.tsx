import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PersonalizationStudio } from "@/components/PersonalizationStudio";

export default async function PersonalizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leads } = user
    ? await supabase
        .from("leads")
        .select("id, name, company, website")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <PageHeader eyebrow="AI PERSONALIZATION" title="Personalization Studio" />
      <PersonalizationStudio leads={leads ?? []} />
    </div>
  );
}
