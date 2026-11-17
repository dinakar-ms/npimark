/**
 * IndexNow: telling the engines that take it what changed, instead of waiting to be crawled.
 *
 * Bing, Yandex, Seznam and Naver share one endpoint. A submission is only believed if the host
 * can prove it owns the key, which it does by serving a text file named after the key at its
 * own root and containing the key. That file is served by `src/proxy.ts`; this module is the one
 * place that decides what a usable key looks like, so the file and the submitter can never
 * disagree about it.
 *
 * No key means the feature is off - not broken, off. A site without a key serves no key file and
 * submits nothing, which is the right behaviour on a preview host and on any build before the
 * owner has been to Bing Webmaster Tools.
 */

/** The shared endpoint. One POST reaches every participating engine. */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** What the endpoint takes in one request. Anything longer is sent as several requests. */
export const INDEXNOW_MAX_URLS = 10_000;

/**
 * The protocol's own rule for a key: 8 to 128 characters, letters, digits and dashes. Checked
 * rather than trusted, because a key with a stray quote or newline in it would be served in the
 * key file exactly as typed and then never match what we submit - a failure that looks like the
 * engines ignoring us.
 */
const KEY_SHAPE = /^[A-Za-z0-9-]{8,128}$/;

/** The configured key, or null when there is none - which is how the feature is turned off. */
export function indexNowKey(): string | null {
  const key = (process.env.INDEXNOW_KEY ?? "").trim();
  return KEY_SHAPE.test(key) ? key : null;
}

/** Where the key file lives. The protocol fixes this: the root, named for the key, `.txt`. */
export function indexNowKeyPath(key: string): string {
  return `/${key}.txt`;
}
