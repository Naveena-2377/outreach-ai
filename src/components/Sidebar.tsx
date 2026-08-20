"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LineChart,
  Search,
  Users,
  Sparkles,
  Send,
  CalendarCheck2,
  LogOut,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Analytics", icon: LineChart },
  { href: "/dashboard/client-finder", label: "Client Finder", icon: Search },
  { href: "/dashboard/leads", label: "Lead Database", icon: Users },
  { href: "/dashboard/personalization", label: "AI Personalization", icon: Sparkles },
  { href: "/dashboard/email-automation", label: "Email Automation", icon: Send },
  { href: "/dashboard/meetings", label: "Meeting Scheduler", icon: CalendarCheck2 },
];

export function Sidebar({
  userEmail,
  onSignOut,
}: {
  userEmail: string;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar">
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-cyan">
          <Zap size={18} className="text-bg-app" fill="currentColor" />
        </div>
        <div>
          <div className="font-display text-[15px] font-bold leading-none tracking-wide text-text-primary">
            OUTREACH
          </div>
          <div className="font-mono-label mt-1 text-[9px] text-text-muted">
            AI COMMAND DECK
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-accent-cyan bg-accent-cyan-dim text-accent-cyan"
                  : "border-transparent text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-border-subtle px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card-hover text-sm font-semibold text-text-secondary">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-text-primary">Admin</div>
          <div className="truncate text-xs text-text-muted">{userEmail}</div>
        </div>
        <button
          onClick={onSignOut}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
