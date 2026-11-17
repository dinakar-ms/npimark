import type { Metadata } from "next";
import { NodePage, nodeMetadata } from "@/components/NameDirectory";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";

/** One prefix of the A-Z, first page. The template lives in `components/NameDirectory`. */
// Request-time, not a day. These are the two children of `/directory/[kind]`, and wrapping the
// landing without them left exactly six routes still answering HTTP 500 after the release that was
// meant to end that - every other family was 200. The comment on the parent applies here: the
// recovery page carries noindex, so neither Next's route cache nor a shared cache may keep it.
export const revalidate = 0;

type Props = { params: Promise<{ kind: string; prefix: string }> };

async function directoryNodeMetadata({ params }: Props): Promise<Metadata> {
  const { kind, prefix } = await params;
  return nodeMetadata(kind, prefix);
}

async function DirectoryNode({ params }: Props) {
  const { kind, prefix } = await params;
  return <NodePage kindParam={kind} slug={prefix} />;
}

// Same wrapper as the rest of the directory: Next's own redirect and notFound control flow is
// rethrown, anything else renders the recovery state rather than a 500.
export default withDirectoryFallback(DirectoryNode);
export const generateMetadata = withDirectoryMetadata(directoryNodeMetadata);
