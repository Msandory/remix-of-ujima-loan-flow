import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  name: z.string(),
  loanAmount: z.number(),
  purpose: z.string(),
  county: z.string(),
  monthlyIncome: z.number(),
  contributionMonths: z.number(),
  activeLoans: z.number(),
  children: z.number().default(0),
  topFactors: z.array(z.string()).max(5),
});

const SYSTEM_PROMPT =
  "You are a senior loan analyst for Ujima SACCO in Kenya. Write a 3-sentence officer briefing for a human loan officer reviewing this application. Be specific about the applicant's financial context, the optimal repayment window based on their county and loan purpose, and one cross-sell opportunity. Write in a warm professional tone. Keep it under 80 words.";

export const generateOfficerBriefing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userMsg = `Applicant: ${data.name}
Loan Amount: KES ${data.loanAmount.toLocaleString()}
Purpose: ${data.purpose}
County: ${data.county}
Monthly Income: KES ${data.monthlyIncome.toLocaleString()}
SACCO Contribution: ${data.contributionMonths} months
Active Loans: ${data.activeLoans}
Number of Children: ${data.children}
Top SHAP Factors: ${data.topFactors.slice(0, 2).join(", ") || "n/a"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const briefing: string = json?.choices?.[0]?.message?.content ?? "";
    return { briefing: briefing.trim() };
  });
