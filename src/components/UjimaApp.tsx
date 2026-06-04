import { useEffect, useState } from "react";
import { Check, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ArrowRight, Smartphone } from "lucide-react";
import {
  FormData, emptyForm, COUNTY_RISK, computeFeatures, rankBoundaries,
  dataQualityScore, computeScoring, tierFrom, nowEAT,
} from "@/lib/ujima";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Member Application", color: "bg-foreground" },
  { id: 2, label: "SCOUT (RANK)", color: "bg-scout" },
  { id: 3, label: "GUARDIAN (HUNT + GUARD)", color: "bg-guardian" },
  { id: 4, label: "HUNTER (CYCLE)", color: "bg-hunter" },
  { id: 5, label: "Audit Complete", color: "bg-trail" },
] as const;

const PURPOSES = ["Business Stock", "School Fees", "Medical Emergency", "Farm Input", "Asset Purchase", "Other"];
const CHANNELS = ["USSD", "WhatsApp", "Branch Walk-in"];
const COUNTIES = Object.keys(COUNTY_RISK);
const GUARANTORS = ["0", "1", "2", "3+"];

export default function UjimaApp() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [handoff, setHandoff] = useState<null | { color: string }>(null);
  const [timestamps, setTimestamps] = useState<Record<Step, string>>({} as any);

  const reset = () => {
    setStep(1);
    setForm(emptyForm);
    setErrors({});
    setHandoff(null);
    setTimestamps({} as any);
  };

  const startHandoff = (color: string, next: Step) => {
    setHandoff({ color });
    setTimeout(() => {
      setTimestamps(t => ({ ...t, [next]: nowEAT() }));
      setStep(next);
      setHandoff(null);
    }, 1500);
  };

  useEffect(() => {
    if (step === 1 && !timestamps[1]) setTimestamps(t => ({ ...t, 1: nowEAT() }));
  }, [step, timestamps]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile progress */}
      <div className="md:hidden sticky top-0 z-30 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ${done || active ? s.color : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-medium text-muted-foreground">Step {step}: {STEPS[step - 1].label}</p>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 shrink-0 border-r bg-card min-h-screen p-6 flex-col gap-1">
          <div className="mb-6">
            <h1 className="text-lg font-bold tracking-tight">Ujima SACCO</h1>
            <p className="text-xs text-muted-foreground">AI Loan Approval Pipeline</p>
          </div>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <li key={s.id} className="relative">
                  <div className={`flex items-start gap-3 rounded-md p-3 transition-colors ${active ? "bg-muted" : ""}`}>
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 ${done || active ? s.color : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${active ? "" : done ? "" : "text-muted-foreground"}`}>{s.label}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <div className="absolute left-7 top-11 w-px h-3 bg-border" />}
                </li>
              );
            })}
          </ol>
          <div className="mt-auto pt-6 text-xs text-muted-foreground">
            <p>Kenya DPA 2022 · SASRA</p>
            <p>Model v2.1 · Cape Town region</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {handoff ? (
            <Handoff color={handoff.color} />
          ) : step === 1 ? (
            <ApplicationForm
              form={form} setForm={setForm} errors={errors} setErrors={setErrors}
              onSubmit={() => startHandoff("bg-scout", 2)}
            />
          ) : step === 2 ? (
            <ScoutPanel form={form} onNext={() => startHandoff("bg-guardian", 3)} timestamp={timestamps[2]} />
          ) : step === 3 ? (
            <GuardianPanel form={form} onNext={() => startHandoff("bg-hunter", 4)} timestamp={timestamps[3]} prevTs={timestamps[2]} />
          ) : step === 4 ? (
            <HunterPanel form={form} onNext={() => { setTimestamps(t => ({ ...t, 5: nowEAT() })); setStep(5); }} />
          ) : (
            <AuditPanel form={form} timestamps={timestamps} onReset={reset} />
          )}
        </main>
      </div>
    </div>
  );
}

function Handoff({ color }: { color: string }) {
  return (
    <div className={`${color} rounded-xl min-h-[60vh] flex flex-col items-center justify-center text-white animate-in fade-in`}>
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="text-xl font-semibold">Handoff in progress...</p>
    </div>
  );
}

/* ---------------- STEP 1 ---------------- */
function ApplicationForm({
  form, setForm, errors, setErrors, onSubmit,
}: {
  form: FormData; setForm: (f: FormData) => void;
  errors: Partial<Record<keyof FormData, string>>;
  setErrors: (e: Partial<Record<keyof FormData, string>>) => void;
  onSubmit: () => void;
}) {
  const update = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm({ ...form, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const submit = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.memberName) e.memberName = "Member name is required";
    if (!form.memberId) e.memberId = "Member ID is required";
    if (!form.loanAmount || form.loanAmount < 5000 || form.loanAmount > 500000) e.loanAmount = "Enter amount between 5,000 and 500,000";
    if (!form.loanPurpose) e.loanPurpose = "Select loan purpose";
    if (!form.monthlyIncome || form.monthlyIncome <= 0) e.monthlyIncome = "Enter monthly income";
    if (!form.contributionMonths || form.contributionMonths < 1 || form.contributionMonths > 120) e.contributionMonths = "Enter 1–120 months";
    if (form.activeLoans < 0 || form.activeLoans > 5) e.activeLoans = "Enter 0–5";
    if (!form.guarantors) e.guarantors = "Select guarantors";
    if (!form.channel) e.channel = "Select application channel";
    if (!form.county) e.county = "Select county";
    setErrors(e);
    if (Object.keys(e).length === 0) onSubmit();
  };

  const fieldCls = (k: keyof FormData) =>
    `w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-scout/30 ${errors[k] ? "border-destructive" : "border-border"}`;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold">Ujima SACCO — Loan Application</h2>
        <p className="text-sm text-muted-foreground mt-1">Complete the form to begin AI-assisted loan review.</p>
      </header>

      <div className="bg-card border rounded-xl p-6 grid md:grid-cols-2 gap-5">
        <Field label="Member Name" error={errors.memberName}>
          <input className={fieldCls("memberName")} value={form.memberName} onChange={e => update("memberName", e.target.value)} />
        </Field>
        <Field label="Member ID" error={errors.memberId}>
          <input placeholder="UJ-2024-XXXX" className={fieldCls("memberId")} value={form.memberId} onChange={e => update("memberId", e.target.value)} />
        </Field>
        <Field label="Loan Amount Requested (KES)" error={errors.loanAmount}>
          <input type="number" min={5000} max={500000} className={fieldCls("loanAmount")} value={form.loanAmount || ""} onChange={e => update("loanAmount", Number(e.target.value))} />
        </Field>
        <Field label="Loan Purpose" error={errors.loanPurpose}>
          <select className={fieldCls("loanPurpose")} value={form.loanPurpose} onChange={e => update("loanPurpose", e.target.value)}>
            <option value="">Select…</option>
            {PURPOSES.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Monthly Income (KES)" error={errors.monthlyIncome}>
          <input type="number" className={fieldCls("monthlyIncome")} value={form.monthlyIncome || ""} onChange={e => update("monthlyIncome", Number(e.target.value))} />
        </Field>
        <Field label="SACCO Contribution History (months)" error={errors.contributionMonths}>
          <input type="number" min={1} max={120} className={fieldCls("contributionMonths")} value={form.contributionMonths || ""} onChange={e => update("contributionMonths", Number(e.target.value))} />
        </Field>
        <Field label="Number of Active Loans" error={errors.activeLoans}>
          <input type="number" min={0} max={5} className={fieldCls("activeLoans")} value={form.activeLoans} onChange={e => update("activeLoans", Number(e.target.value))} />
        </Field>
        <Field label="Guarantors Available" error={errors.guarantors}>
          <select className={fieldCls("guarantors")} value={form.guarantors} onChange={e => update("guarantors", e.target.value)}>
            <option value="">Select…</option>
            {GUARANTORS.map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Application Channel" error={errors.channel}>
          <select className={fieldCls("channel")} value={form.channel} onChange={e => update("channel", e.target.value)}>
            <option value="">Select…</option>
            {CHANNELS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="County" error={errors.county}>
          <select className={fieldCls("county")} value={form.county} onChange={e => update("county", e.target.value)}>
            <option value="">Select…</option>
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={submit} className="bg-scout text-scout-foreground font-semibold rounded-md px-6 py-3 hover:opacity-90 transition w-full md:w-auto">
          Submit Application
        </button>
        <p className="text-xs text-muted-foreground">
          All data governed under Kenya DPA 2022. Your consent was captured at onboarding via USSD *3849#
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive mt-1">{error}</span>}
    </label>
  );
}

/* ---------------- Sequential reveal hook ---------------- */
function useReveal(count: number, delay: number) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    setRevealed(0);
    const timers: any[] = [];
    for (let i = 1; i <= count; i++) {
      timers.push(setTimeout(() => setRevealed(i), i * delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [count, delay]);
  return revealed;
}

/* ---------------- STEP 2 SCOUT ---------------- */
function ScoutPanel({ form, onNext, timestamp }: { form: FormData; onNext: () => void; timestamp?: string }) {
  const feats = computeFeatures(form);
  const { checks, flagged } = rankBoundaries(form);
  const quality = dataQualityScore(form);
  const revealed = useReveal(4, 600);

  const steps = [
    {
      letter: "R", title: "RETRIEVE",
      log: ["Pulling member records from Postgres DB...", "Fetching M-Pesa transaction history (consent verified)...", "Checking SACCO contribution register..."],
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <DataCard label="Member ID" value={form.memberId} />
          <DataCard label="Contribution Months" value={String(form.contributionMonths)} />
          <DataCard label="Active Loans" value={String(form.activeLoans)} />
          <DataCard label="Monthly Income" value={`KES ${form.monthlyIncome.toLocaleString()}`} />
        </div>
      ),
    },
    {
      letter: "A", title: "AUTHENTICATE",
      log: ["Verifying identity against SACCO register...", "KYC status check...", "Consent record verified..."],
      content: (
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <Badge tone="green">KYC Status: VERIFIED</Badge>
          <Badge tone="green">Consent Status: ACTIVE</Badge>
          <Badge tone="muted">Data Source: SACCO Register + M-Pesa API</Badge>
        </div>
      ),
    },
    {
      letter: "N", title: "NORMALISE",
      log: ["Transforming raw inputs to model-ready features...", "Handling missing value checks...", "Calculating derived features..."],
      content: (
        <div className="mt-3 overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              <FeatureRow label="Loan-to-Income Ratio" value={feats.loanToIncome.toFixed(2)} />
              <FeatureRow label="Contribution Score" value={`${feats.contributionScore.toFixed(1)}%`} />
              <FeatureRow label="Debt Burden" value={feats.debtBurden.toFixed(2)} />
              <FeatureRow label="Guarantor Strength" value={feats.guarantorStrength} />
            </tbody>
          </table>
        </div>
      ),
    },
    {
      letter: "K", title: "KNOW CONTEXT",
      log: ["Appending contextual metadata..."],
      content: (
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <Badge tone="muted">Season: Long Rains (April–June)</Badge>
          <Badge tone={COUNTY_RISK[form.county] === "High" ? "red" : COUNTY_RISK[form.county] === "Medium" ? "amber" : "green"}>
            County Risk ({form.county}): {COUNTY_RISK[form.county]}
          </Badge>
          <Badge tone="muted">Agricultural Flag: {form.loanPurpose === "Farm Input" ? "Yes" : "No"}</Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="border-l-4 border-scout pl-4">
        <p className="text-xs font-semibold text-scout uppercase tracking-wider">Scout Agent</p>
        <h2 className="text-2xl md:text-3xl font-bold">Data Intelligence and Profiling</h2>
      </header>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <RankStep key={s.letter} step={s} active={revealed > i} loading={revealed === i} color="scout" />
        ))}
      </div>

      {revealed >= 4 && (
        <>
          <div className="border-2 border-scout rounded-xl p-5 bg-scout/5 animate-in fade-in">
            <h3 className="font-semibold text-scout mb-3">RANK BOUNDARY CHECK</h3>
            <ul className="space-y-2">
              {checks.map(c => (
                <li key={c.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span>{c.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${c.pass ? "bg-scout text-scout-foreground" : "bg-destructive text-destructive-foreground"}`}>
                    {c.pass ? "PASS" : "FLAG"}
                  </span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 p-3 rounded text-sm font-medium ${flagged ? "bg-guardian/20 text-foreground border border-guardian" : "bg-scout/15 text-scout border border-scout"}`}>
              {flagged ? "⚠ Scout has flagged this application. Guardian will apply additional scrutiny."
                       : "✓ All RANK boundaries satisfied. Clean payload ready for Guardian."}
            </div>
          </div>

          <TrailLog text={`Scout completed. Data quality score: ${quality}. Payload dispatched to Guardian.`} timestamp={timestamp || nowEAT()} />

          <button onClick={onNext} className="bg-scout text-scout-foreground font-semibold rounded-md px-6 py-3 hover:opacity-90 inline-flex items-center gap-2">
            Dispatch to Guardian <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

function RankStep({ step, active, loading, color }: { step: any; active: boolean; loading: boolean; color: "scout" | "guardian" }) {
  const bg = color === "scout" ? "bg-scout" : "bg-guardian";
  const text = color === "scout" ? "text-scout" : "text-guardian";
  return (
    <div className={`border rounded-xl p-4 transition-all ${active ? "bg-card" : "bg-muted/30 opacity-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${bg}`}>
          {step.letter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{step.title}</h4>
            {active && !loading && <Check className={`w-4 h-4 ${text}`} />}
            {loading && <Loader2 className={`w-4 h-4 animate-spin ${text}`} />}
          </div>
          <ul className="mt-2 text-xs text-muted-foreground font-mono space-y-0.5">
            {step.log.map((l: string) => <li key={l}>› {l}</li>)}
          </ul>
          {active && step.content}
        </div>
      </div>
    </div>
  );
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-md p-3 border">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm font-semibold mt-1 truncate">{value}</p>
    </div>
  );
}
function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-2 text-muted-foreground">{label}</td>
      <td className="px-3 py-2 text-right font-mono font-semibold">{value}</td>
    </tr>
  );
}
function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "red" | "muted" }) {
  const cls = {
    green: "bg-scout text-scout-foreground",
    amber: "bg-guardian text-guardian-foreground",
    red: "bg-destructive text-destructive-foreground",
    muted: "bg-muted text-foreground border",
  }[tone];
  return <span className={`px-2 py-1 rounded font-medium ${cls}`}>{children}</span>;
}
function TrailLog({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="rounded-md p-3 text-xs font-mono" style={{ background: "color-mix(in oklab, var(--trail) 12%, transparent)", border: "1px solid var(--trail)", color: "var(--trail)" }}>
      <span className="font-bold">TRAIL LOG — [{timestamp}]</span> {text}
    </div>
  );
}

/* ---------------- STEP 3 GUARDIAN ---------------- */
function GuardianPanel({ form, onNext, timestamp, prevTs }: { form: FormData; onNext: () => void; timestamp?: string; prevTs?: string }) {
  const { score, topFactors } = computeScoring(form);
  const quality = dataQualityScore(form);
  const tier = tierFrom(score);
  const feats = computeFeatures(form);
  const revealed = useReveal(4, 800);
  const [progressVal, setProgressVal] = useState(0);

  useEffect(() => {
    if (revealed >= 1) {
      const t = setTimeout(() => setProgressVal(score * 100), 100);
      return () => clearTimeout(t);
    }
  }, [revealed, score]);

  const guardChecks = [
    { name: "Governed (SASRA loan-to-income limit)", pass: feats.loanToIncome < 5 },
    { name: "Understood (plain language explanation)", pass: true },
    { name: "Auditable (full audit record to Postgres)", pass: true },
    { name: "Rights-Checked (consent active and unexpired)", pass: true },
    { name: "Documented (Model v2.1 — Primary / Ollama llama3.2:3b — Fallback)", pass: true },
  ];

  return (
    <div className="space-y-6">
      <header className="border-l-4 border-guardian pl-4">
        <p className="text-xs font-semibold text-guardian uppercase tracking-wider">Guardian Agent</p>
        <h2 className="text-2xl md:text-3xl font-bold">Risk Assessment and Ethics Compliance</h2>
      </header>

      {/* HUNT handoff */}
      <div className="rounded-xl border-4 border-guardian bg-guardian/10 p-5 animate-pulse-border">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-guardian" />
          <h3 className="font-bold text-guardian">HUNT HANDOFF RECEIVED</h3>
        </div>
        <p className="text-sm">
          Validated feature payload from Scout. Timestamp: <span className="font-mono font-semibold">{timestamp || nowEAT()}</span> ·
          Data quality score: <span className="font-mono font-semibold">{quality}</span>. Initiating risk assessment…
        </p>
      </div>

      {/* H */}
      <SectionBlock active={revealed >= 1} loading={revealed === 0} color="guardian" letter="H" title="HYPOTHESISE">
        <p className="text-sm text-muted-foreground mb-3">Computing repayment probability from feature payload…</p>
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-medium">Repayment Probability Score</span>
          <span className="font-mono font-bold text-lg">{(score * 100).toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-guardian transition-all duration-1000 ease-out" style={{ width: `${progressVal}%` }} />
        </div>
      </SectionBlock>

      {/* U */}
      <SectionBlock active={revealed >= 2} loading={revealed === 1} color="guardian" letter="U" title="UNPACK SHAP VALUES">
        <p className="text-sm text-muted-foreground mb-3">Top 3 factors contributing to the score:</p>
        <div className="space-y-2">
          {topFactors.length === 0 && <p className="text-sm">No significant adjustments — baseline 0.50</p>}
          {topFactors.map(f => {
            const mag = Math.abs(f.delta);
            const pct = Math.min(100, (mag / 0.15) * 100);
            const positive = f.delta > 0;
            return (
              <div key={f.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{f.name}</span>
                  <span className={`font-mono ${positive ? "text-scout" : "text-destructive"}`}>
                    {positive ? "+" : ""}{f.delta.toFixed(2)}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded">
                  <div className={`h-full rounded transition-all duration-700 ${positive ? "bg-scout" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionBlock>

      {/* N */}
      <SectionBlock active={revealed >= 3} loading={revealed === 2} color="guardian" letter="N" title="NULLIFY BIAS">
        <ul className="text-xs text-muted-foreground font-mono space-y-0.5 mb-3">
          <li>› Running demographic parity check...</li>
          <li>› Checking protected characteristic proxies...</li>
          <li>› Verifying no county-based discrimination...</li>
        </ul>
        <Badge tone="green">Bias Check Status: PASSED</Badge>
        <p className="text-sm mt-2">No demographic parity violations detected. Score reflects financial behaviour only.</p>
      </SectionBlock>

      {/* T */}
      <SectionBlock active={revealed >= 4} loading={revealed === 3} color="guardian" letter="T" title="TIER ASSIGNMENT">
        <TierBadge tier={tier} />
        {tier === "AMBER" && (
          <div className="mt-4 rounded-xl border-4 border-guardian bg-guardian/15 p-4 animate-pulse-border">
            <p className="font-bold text-guardian">HUNT HANDOFF TRIGGER ACTIVATED</p>
            <p className="text-sm mt-1">This application requires human review before proceeding. Routing to Loan Officer queue…</p>
          </div>
        )}
      </SectionBlock>

      {revealed >= 4 && (
        <>
          <div className="border-2 rounded-xl p-5" style={{ borderColor: "var(--guard)", background: "color-mix(in oklab, var(--guard) 6%, transparent)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5" style={{ color: "var(--guard)" }} />
              <h3 className="font-bold" style={{ color: "var(--guard)" }}>GUARD SAFETY RAIL</h3>
            </div>
            <ul className="space-y-2">
              {guardChecks.map(c => (
                <li key={c.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span>{c.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${c.pass ? "bg-scout text-scout-foreground" : "bg-destructive text-destructive-foreground"}`}>
                    {c.pass ? "PASS" : "FAIL"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={onNext} className="bg-hunter text-hunter-foreground font-semibold rounded-md px-6 py-3 hover:opacity-90 inline-flex items-center gap-2">
            Dispatch to Hunter <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

function SectionBlock({ active, loading, color, letter, title, children }: { active: boolean; loading: boolean; color: "scout" | "guardian" | "hunter"; letter: string; title: string; children: React.ReactNode }) {
  const bg = color === "scout" ? "bg-scout" : color === "guardian" ? "bg-guardian" : "bg-hunter";
  const text = color === "scout" ? "text-scout" : color === "guardian" ? "text-guardian" : "text-hunter";
  return (
    <div className={`border rounded-xl p-5 transition-all ${active ? "bg-card" : "bg-muted/30 opacity-50"}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${bg}`}>{letter}</div>
        <h4 className="font-semibold">{title}</h4>
        {active && <Check className={`w-4 h-4 ${text}`} />}
        {loading && <Loader2 className={`w-4 h-4 animate-spin ${text}`} />}
      </div>
      {active && <div>{children}</div>}
    </div>
  );
}

function TierBadge({ tier }: { tier: "GREEN" | "AMBER" | "RED" }) {
  const config = {
    GREEN: { bg: "bg-scout", text: "text-scout-foreground", label: "GREEN TIER", desc: "Auto-approve eligible — strong repayment profile." },
    AMBER: { bg: "bg-guardian", text: "text-guardian-foreground", label: "AMBER TIER", desc: "Officer review required — borderline risk profile." },
    RED:   { bg: "bg-destructive", text: "text-destructive-foreground", label: "RED TIER", desc: "Decline eligible — high risk of default." },
  }[tier];
  return (
    <div className={`${config.bg} ${config.text} rounded-xl p-6 text-center`}>
      <p className="text-3xl md:text-4xl font-bold tracking-tight">{config.label}</p>
      <p className="mt-2 text-sm opacity-90">{config.desc}</p>
    </div>
  );
}

/* ---------------- STEP 4 HUNTER ---------------- */
function HunterPanel({ form, onNext }: { form: FormData; onNext: () => void }) {
  const { score, topFactors } = computeScoring(form);
  const tier = tierFrom(score);
  const revealed = useReveal(5, 700);

  const positiveFactors = topFactors.filter(f => f.delta > 0).slice(0, 2).map(f => f.name);
  const negativeFactors = topFactors.filter(f => f.delta < 0).slice(0, 2).map(f => f.name);
  const pos = positiveFactors.length ? positiveFactors.join(", ") : "Steady contributions";
  const neg = negativeFactors.length ? negativeFactors.join(", ") : "Insufficient repayment capacity";

  const sms = tier === "GREEN"
    ? `Ujima SACCO: Habari ${form.memberName}! Your loan application of KES ${form.loanAmount.toLocaleString()} has been APPROVED (subject to officer sign-off). Main factors: ${pos}. Please visit your branch to sign your loan agreement. Ref: ${form.memberId}`
    : tier === "AMBER"
    ? `Ujima SACCO: Habari ${form.memberName}! Your application of KES ${form.loanAmount.toLocaleString()} is under review by our loan officer. You will hear from us within 4 hours. Ref: ${form.memberId}`
    : `Ujima SACCO: Habari ${form.memberName}! Your application of KES ${form.loanAmount.toLocaleString()} could not be approved at this time. Main reasons: ${neg}. You may reapply in 90 days. Visit any branch for guidance. Ref: ${form.memberId}`;

  const decision = tier === "GREEN" ? "APPROVED — Subject to officer acknowledgment"
                  : tier === "AMBER" ? "PENDING OFFICER REVIEW"
                  : "DECLINED — Member may reapply in 90 days";

  return (
    <div className="space-y-4">
      <header className="border-l-4 border-hunter pl-4">
        <p className="text-xs font-semibold text-hunter uppercase tracking-wider">Hunter Agent</p>
        <h2 className="text-2xl md:text-3xl font-bold">Decision Execution and Communication</h2>
      </header>

      <SectionBlock active={revealed >= 1} loading={revealed === 0} color="hunter" letter="C" title="CHANNEL SELECTION">
        <p className="text-sm">Delivering via <span className="font-semibold">{form.channel}</span></p>
      </SectionBlock>

      <SectionBlock active={revealed >= 2} loading={revealed === 1} color="hunter" letter="Y" title="YIELD TO HUMAN">
        {tier === "AMBER"
          ? <p className="text-sm">Loan Officer assigned: <span className="font-semibold">Officer KE-047 — Nairobi Central Branch</span>. Notification sent via WhatsApp. Awaiting acknowledgment… <span className="text-muted-foreground">(4 hour response window)</span></p>
          : <p className="text-sm">Officer acknowledgment requested (one-tap confirm). No full review required.</p>
        }
      </SectionBlock>

      <SectionBlock active={revealed >= 3} loading={revealed === 2} color="hunter" letter="C" title="CONFIRM DECISION">
        <div className={`rounded-md p-4 font-semibold text-center ${tier === "GREEN" ? "bg-scout text-scout-foreground" : tier === "AMBER" ? "bg-guardian text-guardian-foreground" : "bg-destructive text-destructive-foreground"}`}>
          {decision}
        </div>
      </SectionBlock>

      <SectionBlock active={revealed >= 4} loading={revealed === 3} color="hunter" letter="L" title="LOCATE ESCALATION PATH">
        <p className="text-sm">Escalation path logged: <span className="font-mono">Branch Manager → Regional Supervisor → Head Office</span>. Member will receive SMS updates at each escalation if officer is unreachable.</p>
      </SectionBlock>

      <SectionBlock active={revealed >= 5} loading={revealed === 4} color="hunter" letter="E" title="EXECUTE AND NOTIFY">
        <div className="flex justify-center pt-2">
          <PhoneFrame sms={sms} memberName={form.memberName} />
        </div>
      </SectionBlock>

      {revealed >= 5 && (
        <button onClick={onNext} className="bg-hunter text-hunter-foreground font-semibold rounded-md px-6 py-3 hover:opacity-90 inline-flex items-center gap-2">
          View Audit Trail <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function PhoneFrame({ sms }: { sms: string; memberName?: string }) {
  return (
    <div className="w-[300px] rounded-[2rem] bg-foreground p-3 shadow-xl">
      <div className="rounded-[1.5rem] bg-background min-h-[420px] p-4 flex flex-col">
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
          <span>9:41</span>
          <Smartphone className="w-4 h-4" />
          <span>5G</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-scout text-scout-foreground flex items-center justify-center text-xs font-bold">U</div>
          <div>
            <p className="text-sm font-semibold">Ujima SACCO</p>
            <p className="text-[10px] text-muted-foreground">SMS · now</p>
          </div>
        </div>
        <div className="mt-3 bg-muted rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed">
          {sms}
        </div>
      </div>
    </div>
  );
}

/* ---------------- STEP 5 AUDIT ---------------- */
function AuditPanel({ form, timestamps, onReset }: { form: FormData; timestamps: Record<Step, string>; onReset: () => void }) {
  const { score } = computeScoring(form);
  const tier = tierFrom(score);
  const quality = dataQualityScore(form);
  const decision = tier === "GREEN" ? "APPROVED" : tier === "AMBER" ? "PENDING REVIEW" : "DECLINED";

  const events = [
    { ts: timestamps[1], label: "Application submitted", agent: "Member", color: "bg-foreground" },
    { ts: timestamps[2], label: "Scout (RANK) complete", agent: "Scout", color: "bg-scout" },
    { ts: timestamps[3], label: "Guardian (HUNT + GUARD) complete", agent: "Guardian", color: "bg-guardian" },
    { ts: timestamps[4] || nowEAT(), label: "Hunter (CYCLE) complete", agent: "Hunter", color: "bg-hunter" },
    { ts: timestamps[5], label: "Audit record sealed", agent: "Trail", color: "bg-trail" },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-xl p-5 text-white" style={{ background: "var(--trail)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Trail Audit</p>
        <h2 className="text-2xl md:text-3xl font-bold">Complete Decision Record</h2>
      </header>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Pipeline Timeline</h3>
        <ol className="space-y-3">
          {events.map((e, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${e.color}`} />
              <div className="flex-1 flex justify-between items-baseline gap-3">
                <div>
                  <p className="font-medium text-sm">{e.label}</p>
                  <p className="text-xs text-muted-foreground">{e.agent}</p>
                </div>
                <span className="font-mono text-xs">{e.ts}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <DataCard label="Data Quality Score" value={String(quality)} />
        <DataCard label="Repayment Probability" value={`${(score * 100).toFixed(1)}%`} />
        <DataCard label="Final Tier" value={tier} />
        <DataCard label="Decision" value={decision} />
        <DataCard label="Channel Used" value={form.channel} />
        <DataCard label="Member ID" value={form.memberId} />
      </div>

      <div className="rounded-md p-4 text-xs" style={{ background: "color-mix(in oklab, var(--trail) 10%, transparent)", border: "1px solid var(--trail)", color: "var(--trail)" }}>
        <ShieldCheck className="inline w-4 h-4 mr-1" />
        This record is stored in Postgres on AWS Africa (Cape Town) region. Retention period: 7 years per SASRA Prudential Guidelines.
        Member may request full export via USSD *3847#.
      </div>

      <button onClick={onReset} className="bg-foreground text-background font-semibold rounded-md px-6 py-3 hover:opacity-90">
        Start New Application
      </button>
    </div>
  );
}
