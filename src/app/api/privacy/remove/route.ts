import { NextResponse } from "next/server";
import { apiPost } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The removal form posts here; this forwards it to the API as the visitor (CSRF, and their real
 * address for the per-connection limit - see `apiPost`) and redirects back with a notice.
 *
 * Nothing typed goes into the redirect. A refusal names the fields to fix from the API's field
 * list, filtered to the names the page knows, and the page words the help itself.
 */

export const dynamic = "force-dynamic";

type Accepted = { status: "confirmation_sent" | "received"; reference: string | null };

const KNOWN_FIELDS = new Set([
  "npi",
  "full_name",
  "organization_name",
  "street_address",
  "zip_code",
  "phone_to_remove",
  "email_to_remove",
  "contact_email",
  "remove",
  "note",
]);

const SUBJECTS = new Set(["provider", "org_person", "contact"]);
const REQUEST_TYPES = new Set(["opt_out", "delete", "remove_fields"]);
/** The fields the form offers. Opting out and deleting cover the whole record and send none. */
const SCOPES = new Set(["email", "phone", "home"]);

function back(request: Request, params: Record<string, string>) {
  const url = new URL("/remove-my-information", redirectBase(request));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const text = (name: string, max: number) => {
    const value = String(form.get(name) ?? "").trim().slice(0, max);
    return value || null;
  };
  const subject = text("subject_type", 20) ?? "provider";
  const requestType = text("request_type", 20) ?? "opt_out";
  const remove = form
    .getAll("remove")
    .map((v) => String(v))
    .filter((v) => SCOPES.has(v));

  if (!SUBJECTS.has(subject)) return back(request, { error: "failed" });
  if (!REQUEST_TYPES.has(requestType)) return back(request, { error: "failed" });
  if (requestType === "remove_fields" && remove.length === 0) {
    return back(request, { error: "failed", fields: "remove" });
  }

  const result = await apiPost<Accepted>("/api/removal-requests", {
    subject_type: subject,
    request_type: requestType,
    remove: [...new Set(remove)],
    npi: text("npi", 20),
    full_name: text("full_name", 200),
    organization_name: text("organization_name", 200),
    street_address: text("street_address", 200),
    zip_code: text("zip_code", 10),
    email_to_remove: text("email_to_remove", 320),
    phone_to_remove: text("phone_to_remove", 40),
    contact_email: text("contact_email", 320) ?? "",
    note: text("note", 2000),
    // Cloudflare's widget puts its answer here; absent (and ignored) until Turnstile is on.
    turnstile_token: text("cf-turnstile-response", 4096),
  }).catch(() => null);

  if (result === null) return back(request, { error: "unavailable" });
  if (result.ok) {
    if (result.data.status === "received" && result.data.reference) {
      return back(request, { notice: "received", ref: result.data.reference });
    }
    return back(request, { notice: "sent" });
  }
  if (result.code === "rate_limited") return back(request, { error: "too-many" });
  if (result.code === "challenge_unavailable") return back(request, { error: "challenge-down" });
  if (result.code.startsWith("challenge_")) return back(request, { error: "challenge" });
  if (result.status >= 500) return back(request, { error: "unavailable" });
  // FastAPI's own 422s carry no `fields`; ours do. Either way only known names travel.
  const fields = Object.keys(result.fields ?? {}).filter((f) => KNOWN_FIELDS.has(f));
  return back(request, fields.length ? { error: "failed", fields: fields.join(",") } : { error: "failed" });
}
