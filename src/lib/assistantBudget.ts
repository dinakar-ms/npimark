import { mkdir, open } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

/** Atomic reservation across processes sharing the persistent state volume. Failed calls count too. */
export async function reserveAssistantCall(root: string, orgId: string, now = new Date(), limit = 20): Promise<boolean> {
  const org = createHash("sha256").update(orgId).digest("hex");
  const dir = join(root, "assistant", now.toISOString().slice(0, 10), org);
  await mkdir(dir, {recursive: true});
  for (let i = 0; i < limit; i++) {
    try { const file = await open(join(dir, String(i)), "wx"); await file.close(); return true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  }
  return false;
}
