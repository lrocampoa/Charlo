import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px 24px", position: "relative" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Charlo</h1>
          <nav>
            <Link href="/login" className="btn-secondary" style={{ marginRight: 12, textDecoration: 'none' }}>Login</Link>
            <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Sign up</Link>
          </nav>
        </header>

        <section className="glass-panel" style={{ textAlign: "center", padding: "60px 24px", marginTop: 40 }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: 16, background: "linear-gradient(to right, var(--accent-color), #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            The AI Agent Team for LATAM Businesses
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: 32, maxWidth: 600, margin: "0 auto 32px" }}>
            Automate customer service, generate leads, and handle bookings on WhatsApp, Instagram, and the web.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
            <Link href="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>View Demo</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
