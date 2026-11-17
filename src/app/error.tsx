"use client";

export default function PageError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="wrap section">
    <div className="notice warn" role="alert">
      <h1>We couldn’t load this page.</h1>
      <p>This may be a temporary service problem. Try again; you do not need to create another account.</p>
      <button className="btn primary" onClick={() => retry()}>Try again</button>
      <p><a href="/app">Return to your workspace</a> · <a href="/contact">Contact support</a></p>
    </div>
  </main>;
}
