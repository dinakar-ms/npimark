import { NextResponse } from "next/server";
import { apiPost } from "@/lib/session";
import { LIST_TEST_PATH } from "@/lib/listTest";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The «test it on your own list» form posts here; this forwards it to the API as the visitor -
 * CSRF, and their real address, so the API's per-identifier limit counts the person rather than
 * this container - and redirects to the result, which is a page of its own at a token.
 *
 * Why the redirect rather than rendering the answer here
 * ------------------------------------------------------
 * Because the answer has to be something a buyer can send to their manager. A result rendered into
 * the response of a POST exists once, in one browser; a result at its own URL is a link. It also
 * means reloading the page re-reads the saved counts instead of re-running the list, so a refresh
 * costs nobody anything.
 *
 * Nothing typed comes back in a URL
 * ---------------------------------
 * A refusal redirects to the form with a fixed error name and no echo of what was pasted - the same
 * rule the removal form keeps. The form comes back empty and says what to fix in its own words.
 *
 * The file is read here, not sent as an upload
 * --------------------------------------------
 * The API takes text: a public endpoint has no business accepting a binary upload, and the CSV
 * column is found by the platform (the same detection a paid append runs) rather than by anything
 * in this file. All this does is decode the bytes and cap them.
 */

export const dynamic = "force-dynamic";

type Accepted = { status: "measured"; token: string; expires_at: string };

/** The cap here is the API's own; a larger file is refused before it crosses the wire. */
const MAX_FILE_BYTES = 64 * 1024;
const MAX_PASTE_CHARS = 4_000;

/** Every refusal the page has words for. Anything else falls through to `failed`. */
const CODES: Record<string, string> = {
  list_too_short: "too-short",
  list_too_long: "too-long",
  no_npi_column: "no-column",
  rate_limited: "too-many",
  payload_too_large: "too-large",
  challenge_unavailable: "challenge-down",
};

function back(request: Request, error: string) {
  const url = new URL(LIST_TEST_PATH, redirectBase(request));
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, "too-large");
  }

  const paste = String(form.get("list") ?? "").trim().slice(0, MAX_PASTE_CHARS) || null;
  const upload = form.get("file");
  let fileText: string | null = null;
  if (upload instanceof File && upload.size > 0) {
    if (upload.size > MAX_FILE_BYTES) return back(request, "too-large");
    // Decoded as UTF-8 with replacement, like every other file this platform reads: a stray byte
    // in one cell must not stop a list of a hundred identifiers being counted.
    fileText = new TextDecoder("utf-8").decode(await upload.arrayBuffer());
  }
  if (!paste && !fileText) return back(request, "empty");

  const result = await apiPost<Accepted>("/api/list-test", {
    // A file wins when both arrive: somebody who chose a file meant the file.
    list: fileText ? null : paste,
    file_text: fileText,
    // Cloudflare's widget puts its answer here; absent, and ignored, until Turnstile is on.
    turnstile_token: String(form.get("cf-turnstile-response") ?? "") || null,
  }).catch(() => null);

  if (result === null) return back(request, "unavailable");
  if (result.ok) {
    return NextResponse.redirect(
      new URL(`${LIST_TEST_PATH}/${result.data.token}`, redirectBase(request)),
      303,
    );
  }
  if (result.code.startsWith("challenge_") && result.code !== "challenge_unavailable") {
    return back(request, "challenge");
  }
  if (result.code in CODES) return back(request, CODES[result.code]);
  if (result.status >= 500) return back(request, "unavailable");
  return back(request, "failed");
}
