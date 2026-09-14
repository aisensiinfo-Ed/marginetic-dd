"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);
  const router = useRouter();

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
      });
    } catch (e) {
      // Supabase client creation itself can throw synchronously (e.g.
      // missing env vars) -- without this catch, that crashes with
      // Next.js's raw dev error overlay instead of failing gracefully.
      setConfigError(e.message);
      setLoading(false);
    }
  }, [router]);

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
          <button style={styles.newScanBtn}>New scan</button>
        </div>

        <main style={styles.main}>
          <div className="serif" style={styles.pageTitle}>Scans</div>
          <div style={styles.pageSubtitle}>Technical due diligence reports for your repositories.</div>

          {/* Genuine empty state -- no backend connection exists yet in
              this phase. The populated state (stat row + colored-border
              list, matching the PDF report) is confirmed and ready for
              Phase 3, once real scan data exists. */}
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No scans yet</p>
            <p style={styles.emptySubtitle}>Run your first scan to see a technical due diligence report here.</p>
          </div>
        </main>
      </div>
    </div>
  );
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
    width: 232,
    background: "var(--bg)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
    flexShrink: 0,
  },
  wordmark: { fontSize: 17, fontWeight: 600, padding: "4px 8px 24px" },
  navLabel: { fontSize: 11, color: "var(--muted)", padding: "0 8px 8px", marginTop: 8, opacity: 0.7 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 6,
    color: "var(--muted)",
    fontSize: 13.5,
    marginBottom: 2,
    cursor: "pointer",
  },
  navItemActive: { background: "var(--surface)", color: "var(--text)" },
  navDot: { width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 },
  sidebarFooter: { marginTop: "auto", padding: "12px 10px", borderTop: "1px solid var(--border)" },
  workspaceName: { fontSize: 13, fontWeight: 500 },
  workspacePlan: { fontSize: 12, color: "var(--muted)", opacity: 0.7 },
  mainWrap: { flex: 1 },
  topbar: {
    borderBottom: "1px solid var(--border)",
    padding: "16px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breadcrumb: { color: "var(--muted)", fontSize: 13 },
  newScanBtn: {
    background: "var(--text)",
    color: "var(--bg)",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  main: { maxWidth: 880, margin: "0 auto", padding: 40 },
  pageTitle: { fontSize: 26, fontWeight: 400, marginBottom: 4 },
  pageSubtitle: { color: "var(--muted)", fontSize: 14, marginBottom: 32 },
  emptyState: {
    border: "1px dashed var(--border)",
    borderRadius: 8,
    padding: 48,
    textAlign: "center",
  },
  emptyTitle: { fontWeight: 500, marginBottom: 6 },
  emptySubtitle: { color: "var(--muted)", fontSize: 13.5 },
  configErrorPage: { padding: 48, maxWidth: 500, margin: "80px auto", textAlign: "center" },
  configErrorTitle: { fontWeight: 500, marginBottom: 8, color: "#F87171" },
  configErrorBody: { color: "var(--muted)", fontSize: 13.5, fontFamily: "monospace" },
};
