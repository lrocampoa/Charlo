import Link from 'next/link';
import { CharloLogo } from '@/components/CharloLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Animated Blobs */}
      <div className="blob" style={{ top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(44,160,90,0.3) 0%, rgba(0,0,0,0) 70%)', animationDelay: '0s' }}></div>
      <div className="blob" style={{ bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(249,188,47,0.2) 0%, rgba(0,0,0,0) 70%)', animationDelay: '-5s' }}></div>
      <div className="blob" style={{ top: '40%', left: '50%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(242,109,33,0.15) 0%, rgba(0,0,0,0) 70%)', animationDelay: '-2s' }}></div>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", position: "fixed", top: 0, width: "100%", zIndex: 100, backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)" }}>
        <CharloLogo width={140} height={40} />
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link href="#pricing" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>Precios</Link>
          <Link href="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>Iniciar Sesión</Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Empieza Gratis</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '100px' }}>
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(44, 160, 90, 0.1)', border: '1px solid rgba(44, 160, 90, 0.2)', borderRadius: '99px', color: '#2CA05A', fontWeight: 600, fontSize: '0.85rem', marginBottom: '24px' }}>
            🇨🇷 Diseñado exclusivamente para PYMEs en Costa Rica
          </div>
          <h2 style={{ fontSize: "4.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
            Buscabas un chatbot.<br/>
            Lo que necesitas es un <span className="text-gradient">Empleado Digital.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", marginBottom: 40, maxWidth: 650, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Los chatbots tradicionales frustran a tus clientes. Charlo es la IA que atiende tu WhatsApp, entiende cómo hablamos en Costa Rica, y cierra ventas por ti mientras tú descansas.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
            <Link href="/signup" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>Prueba Charlo Gratis</Link>
            <Link href="#demo" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)' }}>Ver cómo funciona</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "80px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h3 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>No contrates un software. Contrata al mejor vendedor.</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Diseñado específicamente para las PYMEs de Costa Rica.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            
            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🚀</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Cero Programación</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Olvídate de los complejos "árboles de decisión". Sube tu información (catálogo, menú, FAQs), y Charlo en minutos está listo para vender.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>📲</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Nativo en WhatsApp</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Atiende a tus clientes en el canal que más utilizan, manteniendo conversaciones fluidas y naturales (entiende audios y el contexto).
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>💳</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>El Rey del SINPE Móvil</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Charlo sabe que en Costa Rica el pago se confirma con comprobante. Verifica el monto y fecha por ti usando IA para evitar estafas.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🤖</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>De Responder a Resolver</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Un chatbot tradicional manda un link. Charlo recomienda productos, calcula el envío, y cierra la venta directamente en el chat.
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
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "linear-gradient(90deg, var(--accent-color), var(--warning))" }}></div>
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
