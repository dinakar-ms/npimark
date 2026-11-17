import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { NodePage, nodeMetadata } from "@/components/NameDirectory";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";

/**
 * A later page of one prefix of the A-Z. Page 1 lives at the prefix itself, so `/1` redirects
 * there rather than publishing the same list twice; anything that is not a page number is a 404.
 * Pages are bounded: a leaf holds at most 1,000 names, five pages of 200.
 */
// Request-time, not a day. These are the two children of `/directory/[kind]`, and wrapping the
// landing without them left exactly six routes still answering HTTP 500 after the release that was
// meant to end that - every other family was 200. The comment on the parent applies here: the
// recovery page carries noindex, so neither Next's route cache nor a shared cache may keep it.
export const revalidate = 0;

type Props = { params: Promise<{ kind: string; prefix: string; page: string }> };

function pageNumber(value: string): number | null {
  return /^[1-9][0-9]{0,3}$/.test(value) ? Number(value) : null;
}

async function directoryNodeMetadata({ params }: Props): Promise<Metadata> {
  const { kind, prefix, page } = await params;
  const n = pageNumber(page);
  if (!n) return { title: "Not found", robots: { index: false } };
  return nodeMetadata(kind, prefix, n);
}

async function DirectoryNode({ params }: Props) {
  const { kind, prefix, page } = await params;
  const n = pageNumber(page);
  if (!n) notFound();
  if (n === 1) permanentRedirect(`/directory/${kind}/${prefix}`);
  return <NodePage kindParam={kind} slug={prefix} page={n} />;
}

// Same wrapper as the rest of the directory: Next's own redirect and notFound control flow is
// rethrown, anything else renders the recovery state rather than a 500.
export default withDirectoryFallback(DirectoryNode);
export const generateMetadata = withDirectoryMetadata(directoryNodeMetadata);
