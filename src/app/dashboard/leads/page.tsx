import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { AddLeadForm } from "@/components/AddLeadForm";
import { LeadTableRow, type LeadRow } from "@/components/LeadTableRow";
import { ExportLeadsButton } from "@/components/ExportLeadsButton";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leads } = user
    ? await supabase
        .from("leads")
        .select("id, name, company, email, phone, stage, tag, last_interaction_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] as LeadRow[] };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="font-mono-label text-[11px] text-text-secondary">
            LEAD DATABASE
          </div>
          <h1 className="font-display mt-2 text-4xl font-bold text-text-primary">
            All Leads
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ExportLeadsButton leads={(leads as LeadRow[]) || []} />
          <AddLeadForm />
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        {!leads || leads.length === 0 ? (
          <div className="py-16 text-center text-text-secondary">
            No leads yet — add one, or import a CSV from Client Finder.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="font-mono-label border-b border-border-subtle text-left text-[10px] text-text-muted">
                <th className="pb-3">Name</th>
                <th className="pb-3">Company</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Stage</th>
                <th className="pb-3">Tag</th>
                <th className="pb-3">Last Interaction</th>
                <th className="pb-3"></th>
                <th className="pb-3"></th>
                <th className="pb-3"></th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {(leads as LeadRow[]).map((lead) => (
                <LeadTableRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}