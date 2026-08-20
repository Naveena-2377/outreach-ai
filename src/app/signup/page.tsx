import Link from "next/link";
import { Zap } from "lucide-react";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-2 bg-bg-app">
      <div className="relative flex flex-col justify-between overflow-hidden px-16 py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(41,211,238,0.16), transparent 55%), radial-gradient(circle at 70% 70%, rgba(239,77,132,0.10), transparent 50%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-cyan">
            <Zap size={18} className="text-bg-app" fill="currentColor" />
          </div>
          <span className="font-display text-lg font-bold tracking-wide text-text-primary">
            OUTREACH AI
          </span>
        </div>
        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl font-bold leading-[1.1] text-text-primary">
            Find clients. Personalize. Close deals on autopilot.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-text-secondary">
            An AI command deck for freelancers — prospecting, cold outreach,
            follow-ups and meetings in one place.
          </p>
        </div>
        <div className="font-mono-label relative text-[10px] text-text-muted">
          v1.0 · tactical outreach engine
        </div>
      </div>

      <div className="flex items-center justify-center border-l border-border-subtle px-16">
        <div className="w-full max-w-sm">
          <div className="font-mono-label text-[11px] text-text-secondary">
            GET STARTED
          </div>
          <h2 className="font-display mt-2 text-3xl font-bold text-text-primary">
            Create your deck
          </h2>

          <SignupForm />

          <p className="mt-5 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-accent-cyan hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
