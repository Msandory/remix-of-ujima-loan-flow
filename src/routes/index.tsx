import { createFileRoute } from "@tanstack/react-router";
import UjimaApp from "@/components/UjimaApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ujima SACCO — AI Loan Approval Agent Simulator" },
      { name: "description", content: "Simulator for Ujima SACCO's three-agent ethical AI loan approval pipeline: Scout, Guardian, Hunter." },
      { property: "og:title", content: "Ujima SACCO — AI Loan Approval Agent Simulator" },
      { property: "og:description", content: "Three-agent ethical AI loan approval pipeline for a Kenyan SACCO." },
    ],
  }),
  component: UjimaApp,
});
