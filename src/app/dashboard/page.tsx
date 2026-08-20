import {
  Users,
  Send,
  MessageCircle,
  ThumbsUp,
  CalendarCheck,
  Trophy,
  TrendingUp,
  AlertTriangle,
  PhoneCall,
  Percent,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/data/dashboard";
import { StatCard } from "@/components/StatCard";
import { MonthlyActivityChart } from "@/components/MonthlyActivityChart";
import { PipelineBreakdown } from "@/components/PipelineBreakdown";
import { PageHeader } from "@/components/PageHeader";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = user
    ? await getDashboardStats(user.id)
    : {
        totalLeads: 0,
        emailsSent: 0,
        replyRate: 0,
        positiveReplies: 0,
        meetingsBooked: 0,
        bookingRate: 0,
        totalTouches: 0,
        clientsClosed: 0,
        conversionRate: 0,
        bounced: 0,
        monthlyActivity: [],
        pipeline: {},
      };

  const isDemoMode = !process.env.RESEND_API_KEY;

  return (
    <div>
      <PageHeader eyebrow="COMMAND DECK" title="Analytics Overview" demoMode={isDemoMode} />

      <div className="grid grid-cols-4 gap-5">
        <StatCard label="TOTAL LEADS" value={stats.totalLeads} icon={Users} />
        <StatCard label="EMAILS SENT" value={stats.emailsSent} icon={Send} />
        <StatCard label="REPLY RATE" value={stats.replyRate} suffix="%" icon={MessageCircle} />
        <StatCard label="POSITIVE REPLIES" value={stats.positiveReplies} icon={ThumbsUp} />
        <StatCard label="MEETINGS BOOKED" value={stats.meetingsBooked} icon={CalendarCheck} />
        <StatCard label="BOOKING RATE" value={stats.bookingRate} suffix="%" icon={Percent} />
        <StatCard label="TOTAL TOUCHES" value={stats.totalTouches} icon={PhoneCall} />
        <StatCard label="CLIENTS CLOSED" value={stats.clientsClosed} icon={Trophy} />
        <StatCard label="CONVERSION RATE" value={stats.conversionRate} suffix="%" icon={TrendingUp} />
        <StatCard label="BOUNCED" value={stats.bounced} icon={AlertTriangle} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <MonthlyActivityChart data={stats.monthlyActivity} />
        </div>
        <PipelineBreakdown counts={stats.pipeline} />
      </div>
    </div>
  );
}
