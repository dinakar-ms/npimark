import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main>
      <section className="wrap auth" style={{ maxWidth: 560 }}>
        <div className="eyebrow rule">404</div>
        <h1>Nothing at this address.</h1>
        <p className="lede">
          If you were looking for a provider, the NPI may be mistyped: it is ten digits and the
          last one is a check digit.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Link href="/search" className="btn primary">
            Search providers
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
