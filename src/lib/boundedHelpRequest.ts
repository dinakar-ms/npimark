export class HelpRequestError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

/** Byte and time limits apply even if Content-Length is absent or dishonest. */
export async function readHelpPrompt(request: Request, timeoutMs = 5000): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new HelpRequestError(400, "Enter a help question.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new HelpRequestError(408, "The request took too long. Try again.")); }, timeoutMs);
  });
  const read = async () => {
    let raw = ""; let bytes = 0; const decoder = new TextDecoder();
    while (true) {
      const {value, done} = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 8000) { void reader.cancel().catch(() => {}); throw new HelpRequestError(413, "Keep your question under 1,500 characters."); }
      raw += decoder.decode(value, {stream: true});
    }
    raw += decoder.decode();
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new HelpRequestError(400, "Send a valid help question."); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HelpRequestError(400, "Enter a help question.");
    const prompt = (body as Record<string, unknown>).prompt;
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 1500) throw new HelpRequestError(400, "Enter a question of 1–1,500 characters.");
    return prompt.trim();
  };
  try { return await Promise.race([read(), expired]); }
  finally { clearTimeout(timer); }
}
