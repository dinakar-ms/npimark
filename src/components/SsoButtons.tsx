import type { SsoProvider } from "@/lib/session";

/**
 * "Sign in with Google / Microsoft", one small form per switched-on provider.
 *
 * Forms rather than links: starting an attempt writes a row on the API, and a POST is something a
 * crawler or a mail scanner will not do for us. Renders nothing at all when no provider is
 * configured, which is the default, so the sign-in page is then exactly what it was before.
 */
export default function SsoButtons({ providers }: { providers: SsoProvider[] }) {
  if (providers.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {providers.map((provider) => (
        <form
          key={provider.name}
          method="post"
          action={`/api/auth/sso/${provider.name}/start`}
          style={{ marginBottom: 10 }}
        >
          <button type="submit" className="btn ghost block lg">
            Sign in with {provider.label}
          </button>
        </form>
      ))}
      <p className="fine" style={{ textAlign: "center", marginTop: 14 }}>
        or with your email and password
      </p>
    </div>
  );
}
