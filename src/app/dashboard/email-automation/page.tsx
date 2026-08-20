import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmailAutomationList } from "@/components/EmailAutomationList";

export default async function EmailAutomationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: emails } = user
    ? await supabase
        .from("email_messages")
        .select("id, subject, body, status, sequence_step, sent_at, created_at, lead_id, leads(name, company, email)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const isDemoMode = !process.env.RESEND_API_KEY;

  return (
    <div>
      <PageHeader eyebrow="EMAIL AUTOMATION" title="Email Automation" demoMode={isDemoMode} />
      <EmailAutomationList emails={emails ?? []} />
    </div>
  );
}