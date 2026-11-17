import { NextResponse } from "next/server";
import { resetColleagueMfa, setTwoStepPolicy } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Things an admin does from the team page: switching off two-step sign-in for a colleague who has
 * lost their phone and their recovery codes, and setting whether the whole team has to use it.
 *
 * The API decides whether this person may do it (their own organisation, `users.manage`, never
 * their own account); this handler only turns the answer into a notice.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const back = new URL("/app/team", redirectBase(request));
  const action = String(form.get("action") ?? "");

  if (action === "reset-mfa") {
    const result = await resetColleagueMfa(String(form.get("id") ?? ""));
    if (result.ok) {
      back.searchParams.set("mfa_reset", "1");
    } else if (result.status === 401) {
      return NextResponse.redirect(new URL("/sign-in?error=signed-out", redirectBase(request)), 303);
    } else {
      back.searchParams.set("error", result.code === "forbidden" ? "forbidden" : "mfa-reset-failed");
    }
    return NextResponse.redirect(back, 303);
  }

  if (action === "two-step") {
    const result = await setTwoStepPolicy(form.get("required") === "on");
    if (result.ok) {
      back.searchParams.set("two_step", result.data.required ? "on" : "off");
    } else if (result.status === 401) {
      return NextResponse.redirect(new URL("/sign-in?error=signed-out", redirectBase(request)), 303);
    } else {
      // `mfa_setup_yourself_first` is the one worth naming: it is not a failure, it is the next
      // thing to do, and sending it back as a generic error would hide the only actionable part.
      back.searchParams.set(
        "error",
        result.code === "mfa_setup_yourself_first"
          ? "two-step-yourself-first"
          : result.code === "forbidden"
            ? "forbidden"
            : "two-step-failed",
      );
    }
    return NextResponse.redirect(back, 303);
  }

  return new NextResponse("Not found", { status: 404 });
}
