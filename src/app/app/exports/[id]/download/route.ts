import { exportFileResponse } from "@/lib/session";
import { downloadResponse } from "@/lib/downloadResponse";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Hand a finished export to the browser.
 *
 * The file sits behind the API and the browser holds no credential for it, so the bytes pass
 * through here. The body is streamed rather than read into memory first: an export can be
 * hundreds of megabytes, and buffering one would mean falling over on exactly the biggest file
 * a customer ever asks for.
 *
 * Nothing here decides who may download. The API does, from the session that is forwarded -
 * a job's own creator or an admin - so this route cannot accidentally be the weaker check.
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await exportFileResponse(id).catch(() => new Response(null, { status: 503 }));
  return downloadResponse(upstream, id, redirectBase(request), new URL(request.url).searchParams.get("from"));
}
