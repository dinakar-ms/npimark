export function downloadResponse(upstream: Response | null, id: string, origin: string, from: string | null): Response {
  const redirect = (path: string) => new Response(null, { status: 303, headers: { Location: new URL(path, origin).toString(), "Cache-Control": "private, no-store" } });
  if (!upstream || upstream.status === 401) return redirect("/sign-in?error=signed-out");
  if (!upstream.ok || !upstream.body) {
    const error = upstream.status === 429 || upstream.status >= 500 ? "download-retry" : "download-unavailable";
    return redirect(`/app/${from === "append" ? "append" : "exports"}?error=${error}`);
  }
  const type = upstream.headers.get("content-type") || "application/octet-stream";
  const extension = type.includes("spreadsheetml") ? "xlsx" : type.includes("csv") ? "csv" : type.includes("zip") ? "zip" : "bin";
  const disposition = upstream.headers.get("content-disposition");
  const headers = new Headers({
    "Content-Type": type,
    "Content-Disposition": disposition?.toLowerCase().startsWith("attachment;") ? disposition : `attachment; filename="npimark-${id}.${extension}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  // Fetch may decompress the body; do not forward the upstream compressed Content-Length.
  return new Response(upstream.body, { status: 200, headers });
}
