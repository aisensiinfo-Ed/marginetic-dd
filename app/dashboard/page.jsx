"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const BACKEND_URL = "https://marginetic-dd-backend-275543442201.us-central1.run.app";
const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [scans, setScans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({ repoUrl: "", targetName: "", githubToken: "", tier: "small" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const router = useRouter();

  const fetchScans = useCallback(async (userId) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setScans(data);
  }, []);

  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data, error }) => {
        if (error || !data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        setLoading(false);
        fetchScans(data.user.id);
      });
    } catch (e) {
      setConfigError(e.message);
      setLoading(false);
    }
  }, [router, fetchScans]);

  // Poll any scan that's still pending/running -- the backend takes
  // several minutes for a real scan, so the UI needs to keep checking
  // rather than expect an instant result.
  useEffect(() => {
    const activeScan = scans.find((s) => s.status === "pending" || s.status === "running");
    if (!activeScan) return;

    const interval = setInterval(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from("scans").select("*").eq("id", activeScan.id).single();
      if (data && data.status !== activeScan.status) {
        setScans((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      }
    }, 10000); // check every 10s -- frequent enough to feel responsive,
               // not so frequent it hammers Supabase during a multi-minute scan

    return () => clearInterval(interval);
  }, [scans]);

  async function handleSubmitScan(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const resp = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          repo_url: formState.repoUrl,
          target_name: formState.targetName,
          github_token: formState.githubToken,
          tier: formState.tier,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Backend returned ${resp.status}`);
      }

      const result = await resp.json();
      setScans((prev) => [
        {
          id: result.scan_id,
          repo_url: formState.repoUrl,
          target_name: formState.targetName,
          status: "pending",
          findings: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowForm(false);
      setFormState({ repoUrl: "", targetName: "", githubToken: "", tier: "small" });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (configError) {
    return (
      <div style={styles.configErrorPage}>
        <p style={styles.configErrorTitle}>Configuration error</p>
        <p style={styles.configErrorBody}>{configError}</p>
      </div>
    );
  }

  if (loading) return null;

  const agencyName = user?.user_metadata?.agency_name || "Your workspace";

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div className="serif" style={styles.wordmark}>
          Marginetic<span style={{ color: "var(--high)" }}>DD</span>
        </div>

        <div style={styles.navLabel}>WORKSPACE</div>
        <NavItem label="Scans" active />
        <NavItem label="Team" />
        <NavItem label="Billing" />
        <NavItem label="Settings" />

        <div style={styles.sidebarFooter}>
          <div style={styles.workspaceName}>{agencyName}</div>
          <div style={styles.workspacePlan}>Agency plan</div>
        </div>
      </aside>

      <div style={styles.mainWrap}>
        <div style={styles.topbar}>
          <div style={styles.breadcrumb}>Workspace / Scans</div>
          <button style={styles.newScanBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New scan"}
          </button>
        </div>

        <main style={styles.main}>
          <div className="serif" style={styles.pageTitle}>Scans</div>
          <div style={styles.pageSubtitle}>Technical due diligence reports for your repositories.</div>

          {showForm && (
            <form onSubmit={handleSubmitScan} style={styles.form}>
              <label style={styles.label}>Repository URL</label>
              <input
                style={styles.input}
                placeholder="https://github.com/owner/repo.git"
                value={formState.repoUrl}
                onChange={(e) => setFormState({ ...formState, repoUrl: e.target.value })}
                required
              />
              <label style={styles.label}>Target name</label>
              <input
                style={styles.input}
                placeholder="Client Repo Name"
                value={formState.targetName}
                onChange={(e) => setFormState({ ...formState, targetName: e.target.value })}
                required
              />
              <label style={styles.label}>GitHub token (with repo access)</label>
              <input
                style={styles.input}
                type="password"
                placeholder="ghp_..."
                value={formState.githubToken}
                onChange={(e) => setFormState({ ...formState, githubToken: e.target.value })}
                required
              />
              <label style={styles.label}>Repository size</label>
              <select
                style={styles.input}
                value={formState.tier}
                onChange={(e) => setFormState({ ...formState, tier: e.target.value })}
              >
                <option value="small">Small \u2014 typical repos, up to ~tens of thousands of lines</option>
                <option value="medium">Medium \u2014 larger codebases, more memory and time allotted</option>
                <option value="large">Large \u2014 genuinely large monorepos</option>
              </select>
              {submitError && <p style={styles.formError}>{submitError}</p>}
              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? "Starting scan..." : "Start scan"}
              </button>
            </form>
          )}

          {scans.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>No scans yet</p>
              <p style={styles.emptySubtitle}>Run your first scan to see a technical due diligence report here.</p>
            </div>
          ) : (
            <div style={styles.scanList}>
              {scans.map((scan) => (
                <ScanRow key={scan.id} scan={scan} backendUrl={BACKEND_URL} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ScanRow({ scan, backendUrl }) {
  const severity = computeOverallSeverity(scan.findings);
  const borderColor = severityColor(severity);

  return (
    <div style={{ ...styles.scanRow, borderLeftColor: borderColor }}>
      <div style={styles.scanRepo}>
        <div style={styles.scanRepoName}>{scan.target_name}</div>
        <div style={styles.scanMeta}>
          {scan.status === "complete"
            ? `Completed \u00b7 ${scan.findings?.length || 0} findings`
            : scan.status === "failed"
            ? `Failed: ${scan.error_message || "unknown error"}`
            : scan.status === "running"
            ? "Running..."
            : "Pending..."}
        </div>
      </div>
      {scan.status === "complete" && (
        <>
          <div style={{ ...styles.riskBadge, color: borderColor, background: `${borderColor}22` }}>
            {severity.toUpperCase()}
          </div>
          <a
            href={`${backendUrl}/scan/${scan.id}/report`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.downloadLink}
          >
            Download report
          </a>
        </>
      )}
    </div>
  );
}

function computeOverallSeverity(findings) {
  if (!findings || findings.length === 0) return "low";
  for (const sev of SEVERITY_ORDER) {
    if (findings.some((f) => f.severity === sev)) return sev;
  }
  return "low";
}

function severityColor(severity) {
  return { critical: "#B91C1C", high: "#EA580C", medium: "#B45309", low: "#6B7280" }[severity] || "#6B7280";
}

function NavItem({ label, active }) {
  return (
    <div style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
      <span style={styles.navDot} />
      {label}
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 232, background: "var(--bg)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", padding: "20px 16px", flexShrink: 0,
  },
  wordmark: { fontSize: 17, fontWeight: 600, padding: "4px 8px 24px" },
  navLabel: { fontSize: 11, color: "var(--muted)", padding: "0 8px 8px", marginTop: 8, opacity: 0.7 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6,
    color: "var(--muted)", fontSize: 13.5, marginBottom: 2, cursor: "pointer",
  },
  navItemActive: { background: "var(--surface)", color: "var(--text)" },
  navDot: { width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 },
  sidebarFooter: { marginTop: "auto", padding: "12px 10px", borderTop: "1px solid var(--border)" },
  workspaceName: { fontSize: 13, fontWeight: 500 },
  workspacePlan: { fontSize: 12, color: "var(--muted)", opacity: 0.7 },
  mainWrap: { flex: 1 },
  topbar: {
    borderBottom: "1px solid var(--border)", padding: "16px 40px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  breadcrumb: { color: "var(--muted)", fontSize: 13 },
  newScanBtn: {
    background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 6,
    padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
  },
  main: { maxWidth: 880, margin: "0 auto", padding: 40 },
  pageTitle: { fontSize: 26, fontWeight: 400, marginBottom: 4 },
  pageSubtitle: { color: "var(--muted)", fontSize: 14, marginBottom: 32 },
  form: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
    padding: 24, marginBottom: 32,
  },
  label: { display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6, marginTop: 14 },
  input: {
    width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "10px 12px", color: "var(--text)", fontFamily: "Inter, sans-serif", fontSize: 14,
  },
  formError: { color: "#F87171", fontSize: 13, marginTop: 12 },
  submitBtn: {
    background: "var(--high)", color: "#fff", border: "none", borderRadius: 6,
    padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 18,
  },
  emptyState: { border: "1px dashed var(--border)", borderRadius: 8, padding: 48, textAlign: "center" },
  emptyTitle: { fontWeight: 500, marginBottom: 6 },
  emptySubtitle: { color: "var(--muted)", fontSize: 13.5 },
  scanList: { borderTop: "1px solid var(--border)" },
  scanRow: {
    display: "flex", alignItems: "center", gap: 16, padding: "16px 16px",
    borderBottom: "1px solid var(--border)", borderLeft: "3px solid transparent", marginLeft: -3,
  },
  scanRepo: { flex: 1 },
  scanRepoName: { fontWeight: 500, marginBottom: 3 },
  scanMeta: { color: "var(--muted)", fontSize: 12.5 },
  riskBadge: { fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", padding: "4px 10px", borderRadius: 4 },
  downloadLink: { color: "var(--high)", fontSize: 13, textDecoration: "none" },
  configErrorPage: { padding: 48, maxWidth: 500, margin: "80px auto", textAlign: "center" },
  configErrorTitle: { fontWeight: 500, marginBottom: 8, color: "#F87171" },
  configErrorBody: { color: "var(--muted)", fontSize: 13.5, fontFamily: "monospace" },
};
