import { NextResponse } from "next/server";
import { startAppend } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The append form's handler: take the uploaded list, pass it to the API, redirect back.
 *
 * The file is held in memory for the length of one request on its way through, so this route
 * caps it well below what the API itself accepts (512 MB). A list worth appending is thousands
 * of rows, not millions; anything bigger belongs on the API directly, where it streams.
 *
 * The API makes every decision that matters - who may append, whether the plan covers the rows,
 * whether the address has been proved. This route only refuses what it can see without asking:
 * no file, the wrong kind of file, or one too big to carry.
 */

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = /\.(csv|tsv|txt|xlsx)$/i;

/**
 * The field sets offered on the form, by id. Unknown ids fall back to the first.
 *
 * `organization_website` is out of `full` while the API returns it empty. Counsel ruled on
 * 2026-09-27 that the data is ours to resell, so this is not a prohibition - the change that
 * refills the column is blocked on a permission, not on any licence. Asking for it meanwhile
 * puts a blank column in every "full" file. Put it back when the API fills it, together with
 * its entry in `@/lib/fields`: the catalogue and this set have to agree, or a customer gets a
 * column the page does not document.
 */
const FIELD_SETS: Record<string, string[]> = {
  email: ["npi", "name", "work_email"],
  contact: ["npi", "name", "credentials", "work_email", "phone", "address_line", "city", "state", "postal_code"],
  full: [
    "npi", "name", "credentials", "specialty", "taxonomy_code", "work_email", "all_emails", "phone",
    "address_line", "city", "state", "postal_code", "employer_name", "ehr_system",
  ],
};

export async function POST(request: Request): Promise<Response> {
  const back = new URL("/app/append", redirectBase(request));
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    back.searchParams.set("error", "no_file");
    return NextResponse.redirect(back, 303);
  }
  if (!ACCEPTED.test(file.name)) {
    back.searchParams.set("error", "file_type");
    return NextResponse.redirect(back, 303);
  }
  if (file.size > MAX_BYTES) {
    back.searchParams.set("error", "too_big");
    return NextResponse.redirect(back, 303);
  }

  const fields = FIELD_SETS[String(form.get("fields") ?? "")] ?? FIELD_SETS.email;
  const outcome = await startAppend(file, fields);
  if (!outcome.ok) {
    back.searchParams.set("error", outcome.code);
    return NextResponse.redirect(back, 303);
  }
  back.searchParams.set("queued", "1");
  return NextResponse.redirect(back, 303);
}
