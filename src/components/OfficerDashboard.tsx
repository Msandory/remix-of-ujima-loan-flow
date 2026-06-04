import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Clock, CheckCircle2, XCircle, BarChart3,
  ArrowUpRight, TrendingUp, Search, AlertTriangle, ShieldAlert,
} from "lucide-react";

type Nav = "overview" | "pending" | "approved" | "declined" | "analytics";

type PendingApp = {
  name: string; memberId: string; amount: number; purpose: string;
  score: number; county: string; hoursWaiting: number;
  priority?: "URGENT" | "HIGH" | "NORMAL";
};

type ApprovedApp = {
  name: string; memberId: string; amount: number; purpose: string;
  approver: string; when: string;
};

type DeclinedApp = {
  name: string; memberId: string; amount: number; purpose: string;
  reason: string; when: string;
};

const INITIAL_PENDING: PendingApp[] = [
  { name: "Grace Akinyi",  memberId: "UJ-2024-0091", amount: 28000, purpose: "School Fees",       score: 0.68, county: "Kakamega", hoursWaiting: 1.2, priority: "URGENT" },
  { name: "David Mwangi",  memberId: "UJ-2024-0034", amount: 52000, purpose: "Business Stock",    score: 0.61, county: "Nairobi",  hoursWaiting: 2.8, priority: "HIGH" },
  { name: "Fatuma Omar",   memberId: "UJ-2024-0156", amount: 19500, purpose: "Medical Emergency", score: 0.55, county: "Mombasa",  hoursWaiting: 0.5, priority: "NORMAL" },
  { name: "James Odhiambo",memberId: "UJ-2024-0078", amount: 35000, purpose: "Farm Input",        score: 0.67, county: "Kisumu",   hoursWaiting: 3.1 },
  { name: "Wanjiru Kamau", memberId: "UJ-2024-0203", amount: 41000, purpose: "Asset Purchase",    score: 0.58, county: "Nakuru",   hoursWaiting: 4.0 },
  { name: "Hassan Abdi",   memberId: "UJ-2024-0112", amount: 23500, purpose: "Business Stock",    score: 0.63, county: "Garissa",  hoursWaiting: 1.8 },
];

const INITIAL_APPROVED: ApprovedApp[] = [
  { name: "Grace Akinyi",    memberId: "UJ-2024-0042", amount: 28000, purpose: "School Fees",    approver: "Approved by KE-047",          when: "Today 09:14 EAT" },
  { name: "Amina Hassan",    memberId: "UJ-2024-0089", amount: 12000, purpose: "Business Stock", approver: "Auto-approved (Guardian)",    when: "Today 08:30 EAT" },
  { name: "Samuel Kipchoge", memberId: "UJ-2024-0067", amount: 9000,  purpose: "Farm Input",     approver: "Auto-approved (Guardian)",    when: "Today 07:55 EAT" },
  { name: "Mary Njeri",      memberId: "UJ-2024-0145", amount: 67000, purpose: "Asset Purchase", approver: "Approved by KE-047",          when: "Yesterday 16:20 EAT" },
  { name: "Thomas Mutua",    memberId: "UJ-2024-0033", amount: 31500, purpose: "Business Stock", approver: "Approved by KE-047",          when: "Yesterday 14:05 EAT" },
];

const INITIAL_DECLINED: DeclinedApp[] = [
  { name: "Peter Waweru",  memberId: "UJ-2024-0198", amount: 78000, purpose: "Asset Purchase", reason: "Loan-to-Income Ratio Too High", when: "Today 10:30 EAT" },
  { name: "Rose Adhiambo", memberId: "UJ-2024-0071", amount: 44000, purpose: "Business Stock", reason: "Active Loan Burden",            when: "Yesterday 11:15 EAT" },
  { name: "Ali Mwenda",    memberId: "UJ-2024-0234", amount: 29000, purpose: "Other",          reason: "Insufficient Guarantors",       when: "Yesterday 09:40 EAT" },
];

const DECLINE_REASONS = [
  "Insufficient Income",
  "Loan-to-Income Ratio Too High",
  "Insufficient Guarantors",
  "Active Loan Burden",
  "Incomplete Documentation",
];

const ACTIVITY = [
  { text: "Grace Akinyi — KES 28,000 APPROVED by you",                   when: "2 hrs ago", tone: "green" },
  { text: "John Otieno — KES 45,000 sent to Regional Review",            when: "3 hrs ago", tone: "amber" },
  { text: "Amina Hassan — KES 12,000 AUTO-APPROVED by Guardian",         when: "4 hrs ago", tone: "green" },
  { text: "Peter Waweru — KES 78,000 DECLINED",                          when: "5 hrs ago", tone: "red" },
  { text: "Faith Muthoni — KES 15,500 PENDING your review",              when: "6 hrs ago", tone: "amber" },
  { text: "Samuel Kipchoge — KES 9,000 AUTO-APPROVED by Guardian",       when: "8 hrs ago", tone: "green" },
];

const fmtKES = (n: number) => `KES ${n.toLocaleString()}`;

export default function OfficerDashboard({ onLogout }: { onLogout: () => void }) {
  const [nav, setNav] = useState<Nav>("overview");
  const [pending, setPending] = useState<PendingApp[]>(INITIAL_PENDING);
  const [approved, setApproved] = useState<ApprovedApp[]>(INITIAL_APPROVED);
  const [declined, setDeclined] = useState<DeclinedApp[]>(INITIAL_DECLINED);

  const [approveTarget, setApproveTarget] = useState<PendingApp | null>(null);
  const [declineTarget, setDeclineTarget] = useState<PendingApp | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [query, setQuery] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");

  const counties = useMemo(() => Array.from(new Set(pending.map(p => p.county))), [pending]);
  const purposes = useMemo(() => Array.from(new Set(pending.map(p => p.purpose))), [pending]);

  const filtered = pending.filter(p => {
    const q = query.trim().toLowerCase();
    if (q && !`${p.name} ${p.memberId}`.toLowerCase().includes(q)) return false;
    if (countyFilter && p.county !== countyFilter) return false;
    if (purposeFilter && p.purpose !== purposeFilter) return false;
    return true;
  });

  const approvedThisWeek = 23 - INITIAL_PENDING.length + pending.length;
  // KPIs reflect session activity
  const officerApprovedDelta = approved.length - INITIAL_APPROVED.length;
  const declinedDelta = declined.length - INITIAL_DECLINED.length;
  const kpiApprovedWeek = 23 + officerApprovedDelta;
  const kpiPending = pending.length;

  const confirmApprove = () => {
    if (!approveTarget) return;
    const t = approveTarget;
    setPending(p => p.filter(x => x.memberId !== t.memberId));
    setApproved(a => [{
      name: t.name, memberId: t.memberId, amount: t.amount, purpose: t.purpose,
      approver: "Approved by KE-047", when: "Just now EAT",
    }, ...a]);
    setApproveTarget(null);
    toast.success("Approved. Member will be notified via SMS.");
  };

  const confirmDecline = () => {
    if (!declineTarget || !declineReason) return;
    const t = declineTarget;
    setPending(p => p.filter(x => x.memberId !== t.memberId));
    setDeclined(d => [{
      name: t.name, memberId: t.memberId, amount: t.amount, purpose: t.purpose,
      reason: declineReason, when: "Just now EAT",
    }, ...d]);
    setDeclineTarget(null);
    setDeclineReason("");
    toast.error("Declined. Member will be notified with actionable feedback.");
  };

  const navItems: { id: Nav; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: "overview",  label: "Overview",       icon: LayoutDashboard },
    { id: "pending",   label: "Pending Review", icon: Clock, badge: pending.length },
    { id: "approved",  label: "Approved",       icon: CheckCircle2 },
    { id: "declined",  label: "Declined",       icon: XCircle },
    { id: "analytics", label: "Analytics",      icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r bg-card min-h-screen flex-col">
        <div className="px-5 py-5 border-b">
          <h1 className="text-base font-bold tracking-tight">UJIMA SACCO</h1>
          <div className="h-0.5 w-10 bg-scout mt-1.5 mb-1" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Officer Portal</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(n => {
            const Icon = n.icon;
            const active = nav === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setNav(n.id)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-left transition ${
                  active ? "bg-guardian text-guardian-foreground" : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {n.label}
                </span>
                {n.badge !== undefined && n.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-guardian-foreground/20" : "bg-guardian text-guardian-foreground"}`}>
                    {n.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t text-[11px] text-muted-foreground">
          Officer KE-047<br />Nairobi Central Branch
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card border-b px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm md:text-base font-semibold">UJIMA SACCO — Loan Officer Portal</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-muted-foreground">Officer KE-047 | Nairobi Central Branch</span>
            <span className="md:hidden bg-guardian text-guardian-foreground text-[10px] font-bold px-2 py-1 rounded-full">KE-047</span>
            <button onClick={onLogout} className="text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted">
              Logout
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden border-b bg-card overflow-x-auto">
          <div className="flex gap-1 px-3 py-2">
            {navItems.map(n => (
              <button
                key={n.id}
                onClick={() => setNav(n.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${
                  nav === n.id ? "bg-guardian text-guardian-foreground" : "bg-muted text-foreground"
                }`}
              >
                {n.label}{n.badge ? ` (${n.badge})` : ""}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          {nav === "overview"  && <Overview pending={pending} kpiPending={kpiPending} kpiApprovedWeek={kpiApprovedWeek} onReview={() => setNav("pending")} />}
          {nav === "pending"   && (
            <Pending
              rows={filtered}
              counties={counties}
              purposes={purposes}
              query={query} setQuery={setQuery}
              countyFilter={countyFilter} setCountyFilter={setCountyFilter}
              purposeFilter={purposeFilter} setPurposeFilter={setPurposeFilter}
              onApprove={setApproveTarget}
              onDecline={setDeclineTarget}
            />
          )}
          {nav === "approved"  && <Approved rows={approved} count={kpiApprovedWeek} />}
          {nav === "declined"  && <Declined rows={declined} />}
          {nav === "analytics" && <Analytics />}
        </main>
      </div>

      {/* Approve modal */}
      {approveTarget && (
        <Modal onClose={() => setApproveTarget(null)} title="Confirm Approval" accent="green">
          <p className="text-sm text-muted-foreground">
            You are approving <span className="font-semibold text-foreground">{fmtKES(approveTarget.amount)}</span> for{" "}
            <span className="font-semibold text-foreground">{approveTarget.name}</span>. This action will be logged under your officer ID <span className="font-mono">KE-047</span> and is irreversible.
          </p>
          <div className="flex gap-2 justify-end mt-5">
            <button onClick={() => setApproveTarget(null)} className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancel</button>
            <button onClick={confirmApprove} className="px-4 py-2 text-sm font-semibold rounded-md bg-scout text-scout-foreground hover:opacity-90">Confirm</button>
          </div>
        </Modal>
      )}

      {/* Decline modal */}
      {declineTarget && (
        <Modal onClose={() => { setDeclineTarget(null); setDeclineReason(""); }} title="Decline Application" accent="red">
          <p className="text-sm text-muted-foreground mb-3">
            Declining <span className="font-semibold text-foreground">{fmtKES(declineTarget.amount)}</span> for{" "}
            <span className="font-semibold text-foreground">{declineTarget.name}</span>. Select a reason — the member will receive actionable feedback.
          </p>
          <label className="text-xs font-medium">Decline Reason</label>
          <select
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Select a reason…</option>
            {DECLINE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-2 justify-end mt-5">
            <button onClick={() => { setDeclineTarget(null); setDeclineReason(""); }} className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancel</button>
            <button
              onClick={confirmDecline}
              disabled={!declineReason}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-guard text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm Decline
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===================== Overview ===================== */

function Overview({ pending, kpiPending, kpiApprovedWeek, onReview }: {
  pending: PendingApp[]; kpiPending: number; kpiApprovedWeek: number; onReview: () => void;
}) {
  const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 } as const;
  const priority = [...pending]
    .filter(p => p.priority)
    .sort((a, b) => priorityOrder[a.priority!] - priorityOrder[b.priority!])
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Overview</h3>
        <p className="text-sm text-muted-foreground">Daily snapshot — Nairobi Central Branch</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Kpi label="Applications Today" value="14" tone="neutral" trailing={
          <span className="flex items-center gap-1 text-xs font-medium text-scout"><ArrowUpRight className="w-3 h-3" />+3 vs yesterday</span>
        } />
        <Kpi label="Pending Your Review" value={String(kpiPending)} tone="amber" trailing={
          <span className="flex items-center gap-1 text-xs font-medium text-guardian">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-guardian opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-guardian" /></span>
            Action needed
          </span>
        } />
        <Kpi label="Approved This Week" value={String(kpiApprovedWeek)} tone="green" trailing={
          <span className="flex items-center gap-1 text-xs font-medium text-scout"><TrendingUp className="w-3 h-3" />Disbursing</span>
        } />
        <Kpi label="Average Processing Time" value="2.4 hrs" tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Priority Queue">
          {priority.length === 0 && <p className="text-sm text-muted-foreground">No urgent applications. Queue clear.</p>}
          <div className="space-y-3">
            {priority.map(p => (
              <div key={p.memberId} className="border rounded-lg p-3 bg-background flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={p.priority!} />
                    <span className="text-xs text-muted-foreground">{p.hoursWaiting} hrs waiting</span>
                  </div>
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{fmtKES(p.amount)} · {p.purpose}</p>
                </div>
                <button onClick={onReview} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-guardian text-guardian-foreground hover:opacity-90 shrink-0">
                  Review Now
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Activity Feed">
          <ul className="space-y-3">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex gap-3 items-start text-sm">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  a.tone === "green" ? "bg-scout" : a.tone === "amber" ? "bg-guardian" : "bg-guard"
                }`} />
                <div className="min-w-0">
                  <p className="leading-snug">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone, trailing }: { label: string; value: string; tone: "neutral" | "amber" | "green" | "blue"; trailing?: React.ReactNode }) {
  const toneClass =
    tone === "amber" ? "text-guardian" :
    tone === "green" ? "text-scout" :
    tone === "blue"  ? "text-hunter"  : "text-foreground";
  return (
    <div className="bg-card border rounded-xl p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-3xl md:text-4xl font-bold mt-2 ${toneClass}`}>{value}</p>
      {trailing && <div className="mt-2">{trailing}</div>}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "URGENT" | "HIGH" | "NORMAL" }) {
  const cls =
    priority === "URGENT" ? "bg-guard text-white" :
    priority === "HIGH"   ? "bg-guardian text-guardian-foreground" :
                            "bg-scout text-scout-foreground";
  return <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded ${cls}`}>{priority}</span>;
}

/* ===================== Pending ===================== */

function Pending({
  rows, counties, purposes, query, setQuery, countyFilter, setCountyFilter,
  purposeFilter, setPurposeFilter, onApprove, onDecline,
}: {
  rows: PendingApp[]; counties: string[]; purposes: string[];
  query: string; setQuery: (s: string) => void;
  countyFilter: string; setCountyFilter: (s: string) => void;
  purposeFilter: string; setPurposeFilter: (s: string) => void;
  onApprove: (a: PendingApp) => void; onDecline: (a: PendingApp) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">Pending Review</h3>
        <p className="text-sm text-muted-foreground">Applications flagged AMBER by Guardian — officer judgment required.</p>
      </div>

      <div className="bg-card border rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name or member ID…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background"
          />
        </div>
        <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-md bg-background">
          <option value="">All counties</option>
          {counties.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)} className="px-3 py-2 text-sm border rounded-md bg-background">
          <option value="">All purposes</option>
          {purposes.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Applicant</th>
              <th className="text-left px-4 py-3 font-semibold">Member ID</th>
              <th className="text-left px-4 py-3 font-semibold">Amount</th>
              <th className="text-left px-4 py-3 font-semibold">Purpose</th>
              <th className="text-left px-4 py-3 font-semibold">Score</th>
              <th className="text-left px-4 py-3 font-semibold">County</th>
              <th className="text-left px-4 py-3 font-semibold">Waiting</th>
              <th className="text-right px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No applications match these filters.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.memberId} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.memberId}</td>
                <td className="px-4 py-3">{fmtKES(r.amount)}</td>
                <td className="px-4 py-3">{r.purpose}</td>
                <td className="px-4 py-3"><ScoreBadge score={r.score} /></td>
                <td className="px-4 py-3">{r.county}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.hoursWaiting} hrs</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onApprove(r)} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-scout text-scout-foreground hover:opacity-90">Approve</button>
                    <button onClick={() => onDecline(r)} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-guard text-white hover:opacity-90">Decline</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return <span className="bg-guardian text-guardian-foreground text-xs font-semibold px-2 py-0.5 rounded">{score.toFixed(2)}</span>;
}

/* ===================== Approved ===================== */

function Approved({ rows, count }: { rows: ApprovedApp[]; count: number }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const weeklyTotal = 847500 + (rows.length - INITIAL_APPROVED.length) * 0; // banner uses fixed mock + session approvals
  const bannerValue = 847500 + rows
    .filter(r => r.approver === "Approved by KE-047" && r.when.startsWith("Just now"))
    .reduce((s, r) => s + r.amount, 0);
  void total; void weeklyTotal;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">Approved Applications</h3>
        <p className="text-sm text-muted-foreground">Disbursement queue and approval audit trail.</p>
      </div>
      <div className="bg-scout/10 border border-scout/30 rounded-xl p-4 text-sm">
        <span className="font-semibold text-scout">{count} applications approved this week.</span>{" "}
        <span className="text-muted-foreground">Total value disbursed: <span className="text-foreground font-semibold">{fmtKES(bannerValue)}</span></span>
      </div>
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Applicant</th>
              <th className="text-left px-4 py-3 font-semibold">Member ID</th>
              <th className="text-left px-4 py-3 font-semibold">Amount</th>
              <th className="text-left px-4 py-3 font-semibold">Purpose</th>
              <th className="text-left px-4 py-3 font-semibold">Approved By</th>
              <th className="text-left px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.memberId + r.when} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.memberId}</td>
                <td className="px-4 py-3">{fmtKES(r.amount)}</td>
                <td className="px-4 py-3">{r.purpose}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.approver.includes("Auto") ? "bg-hunter/10 text-hunter" : "bg-scout/10 text-scout"}`}>
                    {r.approver}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===================== Declined ===================== */

function Declined({ rows }: { rows: DeclinedApp[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">Declined Applications</h3>
        <p className="text-sm text-muted-foreground">All declines include actionable reasons logged for audit.</p>
      </div>
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Applicant</th>
              <th className="text-left px-4 py-3 font-semibold">Member ID</th>
              <th className="text-left px-4 py-3 font-semibold">Amount</th>
              <th className="text-left px-4 py-3 font-semibold">Purpose</th>
              <th className="text-left px-4 py-3 font-semibold">Reason</th>
              <th className="text-left px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.memberId + r.when} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.memberId}</td>
                <td className="px-4 py-3">{fmtKES(r.amount)}</td>
                <td className="px-4 py-3">{r.purpose}</td>
                <td className="px-4 py-3"><span className="text-xs font-medium bg-guard/10 text-guard px-2 py-0.5 rounded">{r.reason}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-l-4 border-guardian bg-guardian/5 rounded-md p-4 text-sm text-muted-foreground">
        All declined members have been notified with actionable feedback per <span className="font-semibold text-foreground">PRIDE Loop Interpretability</span> standards. Members may appeal via USSD <span className="font-mono text-foreground">3842#</span> or visit any branch.
      </div>
    </div>
  );
}

/* ===================== Analytics ===================== */

function Analytics() {
  const daily = [
    { day: "Mon", value: 11 }, { day: "Tue", value: 9 }, { day: "Wed", value: 14 },
    { day: "Thu", value: 17 }, { day: "Fri", value: 8 },
  ];
  const maxDaily = Math.max(...daily.map(d => d.value));
  const todayIdx = 4;

  const outcomes = [
    { label: "Auto-Approved (Guardian)", value: 41, color: "var(--hunter)" },
    { label: "Officer Approved",          value: 27, color: "var(--scout)" },
    { label: "Pending Review",            value: 19, color: "var(--guardian)" },
    { label: "Declined",                  value: 13, color: "var(--guard)" },
  ];
  let acc = 0;
  const donutSegs = outcomes.map(o => {
    const start = acc;
    acc += o.value;
    return { ...o, start, end: acc };
  });

  const purposes = [
    { label: "Business Stock",    value: 34 },
    { label: "School Fees",       value: 28 },
    { label: "Farm Input",        value: 18 },
    { label: "Medical Emergency", value: 12 },
    { label: "Asset Purchase",    value: 8 },
  ];

  const countyRates = [
    { county: "Nairobi",  rate: 78, status: "green" },
    { county: "Mombasa",  rate: 74, status: "green" },
    { county: "Kisumu",   rate: 71, status: "green" },
    { county: "Nakuru",   rate: 72, status: "green" },
    { county: "Kakamega", rate: 69, status: "green" },
    { county: "Garissa",  rate: 57, status: "amber" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Analytics</h3>
        <p className="text-sm text-muted-foreground">Operational performance and fairness monitoring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Daily Applications This Week">
          <div className="flex items-end justify-between gap-3 h-48 px-2">
            {daily.map((d, i) => {
              const h = (d.value / maxDaily) * 100;
              const today = i === todayIdx;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold">{d.value}</span>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${h}%`, backgroundColor: today ? "var(--guardian)" : "var(--scout)",
                  }} />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Application Outcomes This Week">
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--muted)" strokeWidth="4" />
              {donutSegs.map((s, i) => (
                <circle key={i} cx="18" cy="18" r="15.915" fill="transparent"
                  stroke={s.color} strokeWidth="4"
                  strokeDasharray={`${s.value} ${100 - s.value}`}
                  strokeDashoffset={-s.start}
                />
              ))}
            </svg>
            <ul className="space-y-2 text-sm flex-1">
              {outcomes.map(o => (
                <li key={o.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: o.color }} /> {o.label}</span>
                  <span className="font-semibold">{o.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Loan Purpose Breakdown">
        <ul className="space-y-3">
          {purposes.map(p => (
            <li key={p.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{p.label}</span>
                <span className="font-semibold">{p.value}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-hunter" style={{ width: `${p.value * 2.5}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {/* TRACK Bias Monitor */}
      <div className="bg-card border-2 border-guard rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-guard" />
          <h4 className="font-bold text-guard">TRACK Bias Monitor</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Ethical AI governance layer — county-level approval rate fairness audit.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">County</th>
                <th className="text-left px-3 py-2 font-semibold">Approval Rate</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {countyRates.map(c => (
                <tr key={c.county} className="border-t">
                  <td className="px-3 py-2 font-medium">{c.county}</td>
                  <td className="px-3 py-2">{c.rate}%</td>
                  <td className="px-3 py-2">
                    {c.status === "green" ? (
                      <span className="text-xs font-semibold bg-scout/10 text-scout px-2 py-0.5 rounded">Within baseline</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-guardian/15 text-guardian px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-guardian mt-3 leading-snug">
          <span className="font-semibold">Garissa County:</span> Approval rate 12% below national baseline — flagged for quarterly fairness audit per TRACK protocol.
        </p>
      </div>
    </div>
  );
}

/* ===================== Modal ===================== */

function Modal({ title, accent, onClose, children }: { title: string; accent: "green" | "red"; onClose: () => void; children: React.ReactNode }) {
  const bar = accent === "green" ? "bg-scout" : "bg-guard";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-1 ${bar}`} />
        <div className="p-5">
          <h3 className="font-bold mb-2">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}
