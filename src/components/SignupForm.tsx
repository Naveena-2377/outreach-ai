"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setNotice("Check your inbox to confirm your email, then sign in.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="text-sm text-text-secondary">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm text-text-secondary">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="mt-2 w-full rounded-md border border-border-strong bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-accent-pink">{error}</p>}
      {notice && <p className="text-sm text-accent-green">{notice}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-accent-cyan py-3 text-sm font-semibold text-bg-app transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create account"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
