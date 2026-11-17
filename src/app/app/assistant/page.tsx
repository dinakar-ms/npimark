import type { Metadata } from "next";
import HelpChat from "@/components/HelpChat";
import SearchAssistant from "@/components/SearchAssistant";
import "./assistant.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title: "AI search assistant", robots: {index: false, follow: false}};
export default function AssistantPage() {
  const enabled = process.env.NPI_AI_ENABLED === "true" && !!process.env.OPENAI_API_KEY && !!process.env.NPI_AI_MODEL && !!process.env.NPI_AI_STATE_DIR;
  return <main className="wrap section"><p className="eyebrow">NPImark workspace</p><h1>A simpler start to your next search.</h1><p className="lead">Tell us who you need. Review the filters. Work with the results.</p><SearchAssistant enabled={enabled}/><HelpChat enabled={process.env.NPI_HELP_AI_ENABLED === "true" && !!process.env.OPENAI_API_KEY && !!process.env.NPI_AI_MODEL && !!process.env.NPI_AI_STATE_DIR}/></main>;
}
