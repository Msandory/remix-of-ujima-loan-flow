export type FormData = {
  memberName: string;
  memberId: string;
  loanAmount: number;
  loanPurpose: string;
  monthlyIncome: number;
  contributionMonths: number;
  activeLoans: number;
  guarantors: string; // "0" | "1" | "2" | "3+"
  channel: string;
  county: string;
};

export const emptyForm: FormData = {
  memberName: "",
  memberId: "",
  loanAmount: 0,
  loanPurpose: "",
  monthlyIncome: 0,
  contributionMonths: 0,
  activeLoans: 0,
  guarantors: "",
  channel: "",
  county: "",
};

export const COUNTY_RISK: Record<string, "Low" | "Medium" | "High"> = {
  Nairobi: "Low", Mombasa: "Low", Kisumu: "Medium", Nakuru: "Medium",
  Eldoret: "Medium", Machakos: "Medium", Meru: "Medium", Kakamega: "Medium",
  Garissa: "High", Kisii: "Medium",
};

export const guarantorsNum = (g: string) => (g === "3+" ? 3 : parseInt(g || "0", 10));

export function nowEAT() {
  const d = new Date();
  const eat = new Date(d.getTime() + (d.getTimezoneOffset() + 180) * 60000);
  const hh = String(eat.getHours()).padStart(2, "0");
  const mm = String(eat.getMinutes()).padStart(2, "0");
  const ss = String(eat.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} EAT`;
}

export function computeFeatures(f: FormData) {
  const loanToIncome = f.monthlyIncome > 0 ? f.loanAmount / f.monthlyIncome : 0;
  const contributionScore = (f.contributionMonths / 120) * 100;
  const debtBurden = f.monthlyIncome > 0 ? (f.activeLoans * 15000) / f.monthlyIncome : 0;
  const gN = guarantorsNum(f.guarantors);
  const guarantorStrength = gN === 0 ? "Low" : gN === 1 ? "Medium" : "Strong";
  return { loanToIncome, contributionScore, debtBurden, guarantorStrength, guarantorsNum: gN };
}

export function rankBoundaries(f: FormData) {
  const feats = computeFeatures(f);
  const checks = [
    { name: "Missing features", pass: Object.values(f).every(v => v !== "" && v !== 0 || typeof v === "number") },
    { name: "Loan-to-Income Ratio < 5.0", pass: feats.loanToIncome < 5.0 },
    { name: "Active Loans ≤ 3", pass: f.activeLoans <= 3 },
    { name: "Contribution History ≥ 6 months", pass: f.contributionMonths >= 6 },
    { name: "Guarantors ≥ 1", pass: feats.guarantorsNum >= 1 },
  ];
  // recompute missing features more strictly
  checks[0].pass = !!(f.memberName && f.memberId && f.loanAmount && f.loanPurpose && f.monthlyIncome && f.contributionMonths && f.guarantors && f.channel && f.county);
  const flagged = checks.some(c => !c.pass);
  return { checks, flagged };
}

export function dataQualityScore(f: FormData) {
  const { flagged } = rankBoundaries(f);
  const gN = guarantorsNum(f.guarantors);
  let score = 85;
  if (gN >= 2) score += 5;
  if (flagged) score -= 10;
  return score;
}

export type Factor = { name: string; delta: number };

export function computeScoring(f: FormData) {
  const feats = computeFeatures(f);
  const factors: Factor[] = [];
  let score = 0.5;

  // Contribution History
  let cDelta = 0;
  if (f.contributionMonths >= 24) cDelta = 0.15;
  else if (f.contributionMonths >= 12) cDelta = 0.08;
  score += cDelta;
  factors.push({ name: "Contribution History", delta: cDelta });

  // Active Loans
  let aDelta = 0;
  if (f.activeLoans >= 3) aDelta = -0.10;
  else if (f.activeLoans === 2) aDelta = -0.05;
  score += aDelta;
  factors.push({ name: "Active Loan Burden", delta: aDelta });

  // Loan to Income
  let lDelta = 0;
  if (feats.loanToIncome < 2.0) lDelta = 0.10;
  else if (feats.loanToIncome > 4.0) lDelta = -0.12;
  score += lDelta;
  factors.push({ name: "Loan-to-Income Ratio", delta: lDelta });

  // Guarantors
  let gDelta = 0;
  if (feats.guarantorsNum >= 2) gDelta = 0.08;
  else if (feats.guarantorsNum === 0) gDelta = -0.08;
  score += gDelta;
  factors.push({ name: "Guarantor Strength", delta: gDelta });

  // Income
  let iDelta = 0;
  if (f.monthlyIncome > 50000) iDelta = 0.05;
  else if (f.monthlyIncome < 15000) iDelta = -0.05;
  score += iDelta;
  factors.push({ name: "Income Level", delta: iDelta });

  score = Math.max(0.15, Math.min(0.95, score));
  const topFactors = [...factors].filter(x => x.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  return { score, factors, topFactors };
}

export function tierFrom(score: number): "GREEN" | "AMBER" | "RED" {
  if (score >= 0.72) return "GREEN";
  if (score >= 0.45) return "AMBER";
  return "RED";
}
