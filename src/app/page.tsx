import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Animated Blobs */}
      <div className="blob" style={{ top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)', animationDelay: '0s' }}></div>
      <div className="blob" style={{ bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,0,0,0) 70%)', animationDelay: '-5s' }}></div>
      <div className="blob" style={{ top: '40%', left: '50%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)', animationDelay: '-2s' }}></div>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", position: "fixed", top: 0, width: "100%", zIndex: 100, backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, background: "linear-gradient(135deg, #fff 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Charlo B2B</h1>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="#pricing" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>Precios</Link>
          <Link href="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>Iniciar Sesión</Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Empieza Gratis</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '100px' }}>
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '99px', color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem', marginBottom: '24px' }}>
            🇨🇷 Diseñado exclusivamente para PYMEs en Costa Rica
          </div>
          <h2 style={{ fontSize: "4.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
            Atendé a tus clientes <br/>
            <span className="text-gradient">24/7 por WhatsApp.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", marginBottom: 40, maxWidth: 650, margin: "0 auto 40px", lineHeight: 1.6 }}>
            El primer asistente de Inteligencia Artificial que responde consultas, agenda citas, y <strong>verifica comprobantes de SINPE Móvil automáticamente.</strong>
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
            <Link href="/signup" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>Crear mi Bot</Link>
            <Link href="#demo" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)' }}>Ver Demo</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "80px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h3 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>Todo lo que ocupás para vender más</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Charlo se encarga del trabajo pesado para que vos te enfoqués en crecer.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            
            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>💳</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>SINPE Móvil Automático</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Tu cliente envía la foto del comprobante y Charlo lee el monto y la referencia usando Gemini Vision IA. Adiós a las capturas falsas.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🧠</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Aprende de tu Negocio</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Sube tu menú, PDFs o manuales. Charlo memoriza hasta 2 millones de palabras para responder exactamente como tú lo harías.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>📢</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Campañas y Retargeting</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Envía promociones masivas a todos los clientes que te han escrito en el pasado, cumpliendo 100% con las reglas de Meta.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>📊</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Dashboard Analítico</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Revisa cuántas conversaciones atendió el bot, cuántos comprobantes de SINPE ingresaron y cuántas horas de trabajo te ahorró.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: "80px 24px", position: "relative", zIndex: 10, background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.05) 100%)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>Precios simples, sin sorpresas</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: 48 }}>Invierte en tecnología que se paga sola desde la primera semana.</p>

          <div className="glass-panel feature-card" style={{ maxWidth: 400, margin: "0 auto", padding: "40px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "linear-gradient(90deg, var(--accent-color), #a855f7)" }}></div>
            <h4 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8 }}>Plan PYME</h4>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--text-primary)" }}>₡45,000</span>
              <span style={{ color: "var(--text-secondary)" }}>/mes</span>
            </div>
            
            <ul style={{ listStyle: "none", textAlign: "left", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ display: "flex", gap: 12 }}><span style={{ color: "var(--success)" }}>✓</span> <span>Chats ilimitados</span></li>
              <li style={{ display: "flex", gap: 12 }}><span style={{ color: "var(--success)" }}>✓</span> <span>Verificación de SINPE por IA</span></li>
              <li style={{ display: "flex", gap: 12 }}><span style={{ color: "var(--success)" }}>✓</span> <span>Dashboard Analítico y CRM</span></li>
              <li style={{ display: "flex", gap: 12 }}><span style={{ color: "var(--success)" }}>✓</span> <span>Conexión directa a WhatsApp API</span></li>
            </ul>

            <Link href="/signup" className="btn-primary" style={{ display: "block", width: "100%", padding: "14px 0", fontSize: "1.1rem" }}>Comenzar Ahora</Link>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 16 }}>Prueba gratuita de 7 días. Cancela cuando querrás.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid var(--border-color)", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>© {new Date().getFullYear()} Charlo B2B. Hecho con ❤️ para Costa Rica.</p>
      </footer>
    </main>
  );
}
