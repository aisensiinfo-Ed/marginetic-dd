"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e) {
      setLoading(false);
      setError(`Configuration error: ${e.message}`);
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { agency_name: agencyName } },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setMode("check-email");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={styles.page}>
      <div style={styles.brandPanel}>
        <div className="serif" style={styles.wordmark}>
          Marginetic<span style={{ color: "var(--high)" }}>DD</span>
        </div>

        <div>
          <p className="serif" style={styles.brandQuote}>
            "Cross-model AI review caught what a free security scanner missed four times in a row."
          </p>
          <div style={styles.miniFinding}>
            <span style={styles.miniBadge}>HIGH</span>
            <span>Budget enforcement logic has zero test coverage</span>
          </div>
        </div>

        <div style={styles.brandFooter}>Technical due diligence, run on demand.</div>
      </div>

      <div style={styles.formPanel}>
        <div style={styles.card}>
          {mode === "check-email" ? (
            <>
              <h1 className="serif" style={styles.h1}>Check your email</h1>
              <p style={styles.subtitle}>
                We sent a confirmation link to {email}. Click it, then come back and sign in.
              </p>
            </>
          ) : (
            <>
              <h1 className="serif" style={styles.h1}>
                {mode === "signin" ? "Sign in" : "Create an account"}
              </h1>
              <p style={styles.subtitle}>{mode === "signin" ? "Welcome back." : "Start your first scan in minutes."}</p>

              <form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <>
                    <label style={styles.label} htmlFor="agency">Agency name</label>
                    <input
                      id="agency"
                      style={styles.input}
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="Your agency"
                      required
                    />
                  </>
                )}

                <label style={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  required
                />

                <label style={styles.label} htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  minLength={6}
                />

                {error && <p style={styles.error}>{error}</p>}

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              <p style={styles.footerLink}>
                {mode === "signin" ? (
                  <>New here? <a style={styles.link} href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); }}>Create one.</a></>
                ) : (
                  <>Already have an account? <a style={styles.link} href="#" onClick={(e) => { e.preventDefault(); setMode("signin"); }}>Sign in.</a></>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh" },
  brandPanel: {
    width: "46%",
    background: "var(--bg)",
    borderRight: "1px solid var(--border)",
    padding: 56,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  wordmark: { fontSize: 18, fontWeight: 600 },
  brandQuote: { fontSize: 26, lineHeight: 1.4, maxWidth: 420, fontWeight: 400 },
  miniFinding: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--high)",
    borderRadius: 6,
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--muted)",
    maxWidth: 380,
    marginTop: 28,
  },
  miniBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 7px",
    borderRadius: 3,
    background: "rgba(234,88,12,0.15)",
    color: "#FB923C",
    flexShrink: 0,
  },
  brandFooter: { fontSize: 12.5, color: "var(--muted)" },
  formPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  card: { width: 360 },
  h1: { fontSize: 26, fontWeight: 400, marginBottom: 8 },
  subtitle: { color: "var(--muted)", fontSize: 14, marginBottom: 32 },
  label: { display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 },
  input: {
    width: "100%",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "11px 12px",
    color: "var(--text)",
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    marginBottom: 18,
  },
  button: {
    width: "100%",
    background: "var(--text)",
    color: "var(--bg)",
    border: "none",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 6,
  },
  error: { color: "#F87171", fontSize: 13, marginBottom: 16 },
  footerLink: { textAlign: "center", marginTop: 22, fontSize: 13, color: "var(--muted)" },
  link: { color: "var(--text)", textDecoration: "none", borderBottom: "1px solid var(--border)" },
};
