import { NextResponse } from "next/server";
import {
  changePassword,
  disableMfa,
  enableMfa,
  replaceRecoveryCodes,
  revokeOtherSessions,
  startMfaSetup,
  type ApiResult,
} from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The account's own security settings: password, and two-step sign-in.
 *
 * Every action is a plain form post answered with a redirect back to /app/security carrying a
 * notice or error code, never what was typed - except the two that produce recovery codes.
 *
 * Why recovery codes are the response itself
 * ------------------------------------------
 * They exist in plain text exactly once, in the API's answer, and each one is a way past the
 * phone. Carrying them through a redirect would mean parking them somewhere first - a query
 * string (history, logs, Referer), or a cookie (on disk in the browser for as long as it lives).
 * So this handler answers that one post with the page that shows them, marked no-store, and
 * keeps nothing. Refreshing it asks the browser to post again; turning on twice is refused, and
 * replacing again simply issues another set, which is the correct result of asking twice.
 */

export const dynamic = "force-dynamic";

const PAGE = "/app/security";

function back(request: Request, params: Record<string, string>, hash = "") {
  const url = new URL(PAGE, redirectBase(request));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.hash = hash;
  return NextResponse.redirect(url, 303);
}

function signedOut(request: Request) {
  return NextResponse.redirect(new URL("/sign-in?error=signed-out", redirectBase(request)), 303);
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** The one page that shows recovery codes. Self-contained, because nothing may be stored to render it later. */
function recoveryCodesPage(title: string, lead: string, codes: string[]): Response {
  const items = codes.map((code) => `<li>${escape(code)}</li>`).join("");
  const html = `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escape(title)} · NPI Mark</title>
<style>
:root{--paper:#f4f6fa;--surface:#fff;--ink:#0d1524;--muted:#5a6779;--line:#d3dbe8;--accent:#1b44c8;--on-accent:#fff;--warn:#8f5300;--warn-soft:#f6ead7}
@media (prefers-color-scheme:dark){:root{--paper:#070c15;--surface:#0e1626;--ink:#e7edf8;--muted:#94a3ba;--line:#22304a;--accent:#7fa1ff;--on-accent:#06112e;--warn:#e0a75a;--warn-soft:#2b2113}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:560px;margin:0 auto;padding:48px 16px}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:28px}
h1{font-size:1.6rem;margin:0 0 8px}
p{margin:0 0 14px}
.fine{color:var(--muted);font-size:.9rem}
.notice{background:var(--warn-soft);color:var(--warn);border-radius:8px;padding:12px 14px;margin:0 0 18px;font-size:.95rem}
ol{columns:2;gap:24px;margin:0 0 20px;padding:18px 18px 18px 40px;border:1px dashed var(--line);border-radius:8px;font:1.05rem/2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
a.btn{display:inline-block;background:var(--accent);color:var(--on-accent);text-decoration:none;border-radius:8px;padding:10px 18px;font-weight:600}
@media (max-width:420px){ol{columns:1}}
@media print{a.btn,.notice{display:none}body{background:#fff;color:#000}}
</style>
</head>
<body>
<main>
<div class="panel">
<h1>${escape(title)}</h1>
<p>${escape(lead)}</p>
<div class="notice" role="alert"><b>Save these now - they are shown once.</b> We keep only a fingerprint of each code, so this page cannot be shown again. Print it, or copy the codes into a password manager.</div>
<ol>${items}</ol>
<p class="fine">Each code signs you in once, in place of the 6-digit code from your app. Use one if you lose your phone, then set up two-step sign-in again. Anyone holding these and your password can sign in as you, so keep them somewhere only you can reach.</p>
<p><a class="btn" href="${PAGE}?notice=codes-saved">I have saved them</a></p>
</div>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function refused<T>(result: ApiResult<T>): result is Extract<ApiResult<T>, { ok: false }> {
  return !result.ok;
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const text = (name: string) => String(form.get(name) ?? "");

  if (action === "password") {
    const current = text("current_password");
    const next = text("new_password");
    // The API never sees the second box, so the match is checked here.
    if (next !== text("confirm_password")) return back(request, { error: "password-mismatch" }, "password");
    const result = await changePassword(current, next);
    if (!refused(result)) return back(request, { notice: "password-changed" }, "password");
    if (result.status === 401) return signedOut(request);
    if (result.fields?.current_password) return back(request, { error: "wrong-password" }, "password");
    if (result.fields?.new_password?.includes("different")) {
      return back(request, { error: "password-same" }, "password");
    }
    if (result.fields?.new_password) return back(request, { error: "password-weak" }, "password");
    return back(request, { error: "failed" }, "password");
  }

  if (action === "sign-out-others") {
    const result = await revokeOtherSessions();
    if (!refused(result)) {
      // The count decides which sentence, and stays out of the URL: "nothing else was signed in"
      // is a different and more reassuring answer than "we signed the others out".
      const notice = result.data.revoked > 0 ? "others-signed-out" : "only-this-browser";
      return back(request, { notice }, "sessions");
    }
    if (result.status === 401) return signedOut(request);
    return back(request, { error: "failed" }, "sessions");
  }

  if (action === "mfa-setup") {
    const result = await startMfaSetup();
    if (!refused(result)) return back(request, { step: "confirm" }, "two-step");
    if (result.status === 401) return signedOut(request);
    if (result.code === "mfa_already_enabled") return back(request, { notice: "mfa-already-on" }, "two-step");
    return back(request, { error: "failed" }, "two-step");
  }

  if (action === "mfa-enable") {
    const result = await enableMfa(text("code").trim());
    if (!refused(result)) {
      return recoveryCodesPage(
        "Two-step sign-in is on",
        "From now on, signing in asks for the code from your authenticator app as well as your password. Every other device that was signed in has been signed out. These are your recovery codes:",
        result.data.recovery_codes,
      );
    }
    if (result.status === 401) return signedOut(request);
    if (result.code === "mfa_already_enabled") return back(request, { notice: "mfa-already-on" }, "two-step");
    if (result.fields?.code?.startsWith("Start")) return back(request, { error: "setup-missing" }, "two-step");
    if (result.status === 422) return back(request, { error: "bad-code", step: "confirm" }, "two-step");
    return back(request, { error: "failed" }, "two-step");
  }

  if (action === "recovery-codes") {
    const result = await replaceRecoveryCodes(text("password"));
    if (!refused(result)) {
      return recoveryCodesPage(
        "New recovery codes",
        "Your old recovery codes have stopped working. These replace them:",
        result.data.recovery_codes,
      );
    }
    if (result.status === 401) return signedOut(request);
    if (result.code === "mfa_not_enabled") return back(request, { error: "mfa-off" }, "two-step");
    if (result.fields?.password) return back(request, { error: "wrong-password-codes" }, "two-step");
    return back(request, { error: "failed" }, "two-step");
  }

  if (action === "mfa-disable") {
    const result = await disableMfa(text("password"));
    if (!refused(result)) return back(request, { notice: "mfa-off" }, "two-step");
    if (result.status === 401) return signedOut(request);
    if (result.fields?.password) return back(request, { error: "wrong-password-mfa" }, "two-step");
    return back(request, { error: "failed" }, "two-step");
  }

  return new NextResponse("Not found", { status: 404 });
}
