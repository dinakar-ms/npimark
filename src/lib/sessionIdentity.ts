/** A failed identity service is not evidence that the customer's session expired. */
export async function readIdentity<T>(
  token: string | null,
  request: () => Promise<Response>,
): Promise<T | null> {
  if (!token) return null;
  const response = await request();
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Account verification is temporarily unavailable.");
  const identity = await response.json();
  if (!identity || typeof identity !== "object" || !identity.id || !identity.org?.id) {
    throw new Error("Account verification returned an invalid response.");
  }
  return identity as T;
}
