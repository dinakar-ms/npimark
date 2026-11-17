import { mcpOAuthProxy } from "@/lib/mcpOAuthProxy";
export const dynamic = "force-dynamic";
export async function GET(): Promise<Response> { return mcpOAuthProxy("metadata"); }
