import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Connect NPIMARK to AI assistants" };
export default function MCPGuide() {
  return <main className="wrap"><h1>NPIMARK in your AI assistant</h1>
    <p>The read-only connector is a pilot. Ask your account contact to enable it and provide the approved MCP server URL and OAuth client ID for your assistant.</p>
    <ol><li>Sign in to NPIMARK in your browser.</li>
      <li>Add the supplied remote MCP URL in Claude, ChatGPT or a compatible client using its custom connector settings.</li>
      <li>Choose OAuth and the supplied registered client ID. Review the NPIMARK organization, permissions and API allowance notice before approving.</li>
      <li>Try “Find cardiologists in Texas” or “Check my NPIMARK allowance.”</li></ol>
    <p>The pilot searches provider and organization NPI records, retrieves one provider and reads account usage. Available results can include employer and EHR data; missing data is not inferred.</p>
    <p>It does not reveal email addresses or phone numbers, create exports, send messages or write to CRM tools. Use the website to review those actions.</p>
    <p>Each data call uses your existing API allowance. Connections last one hour and require reconnecting after expiry. They can be disconnected sooner in <Link href="/app/ai">AI connections</Link>.</p>
    <p>Never paste a password, API key or verification code into an AI conversation. A client that cannot support the registered OAuth flow is not supported by this pilot.</p>
  </main>;
}
