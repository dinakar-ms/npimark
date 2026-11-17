/**
 * Liveness only: is this Node process answering?
 *
 * The container's health check used to fetch `/`, which renders the homepage server-side and
 * calls the provider API to do it. That made the check a test of the whole stack on a 3-second
 * timeout, and on 21 October it took the site down: crawlers pushed page renders to 60-125
 * seconds, every check timed out, Docker marked the container unhealthy and the edge stopped
 * routing to it - so a slow site became a 502 for everybody, including the sign-in page, which
 * renders in 7 milliseconds.
 *
 * A liveness check must answer one question: should this container be replaced? A slow upstream
 * is not a reason to replace it, and neither is a saturated API. So this route touches nothing -
 * no API call, no database, no render - and is deliberately static.
 *
 * Readiness, if it is ever wanted, is a different endpoint and a different decision. It is not
 * this one, because tying "keep serving traffic" to "the API is quick today" is what caused the
 * outage.
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Never cached: a cached 200 would keep reporting health after the process stopped
      // being able to produce one.
      "cache-control": "no-store",
    },
  });
}
