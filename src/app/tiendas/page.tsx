import Link from 'next/link';
import { CharloLogo } from '@/components/CharloLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Charlo | Chatbot de Ventas para Tiendas y Boutiques en Costa Rica",
  description: "Vende 24/7 por Instagram y WhatsApp. Charlo recomienda productos, muestra tu catálogo y cierra ventas por SINPE Móvil.",
};

export default function Tiendas() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Animated Blobs */}
      <div className="blob" style={{ top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(44,160,90,0.3) 0%, rgba(0,0,0,0) 70%)', animationDelay: '0s' }}></div>
      <div className="blob" style={{ bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(249,188,47,0.2) 0%, rgba(0,0,0,0) 70%)', animationDelay: '-5s' }}></div>
      <div className="blob" style={{ top: '40%', left: '50%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(242,109,33,0.15) 0%, rgba(0,0,0,0) 70%)', animationDelay: '-2s' }}></div>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", position: "fixed", top: 0, width: "100%", zIndex: 100, backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)" }}>
        <Link href="/">
          <CharloLogo width={140} height={40} />
        </Link>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ThemeToggle />
          <Link href="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>Iniciar Sesión</Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>Empieza Gratis</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '100px' }}>
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(44, 160, 90, 0.1)', border: '1px solid rgba(44, 160, 90, 0.2)', borderRadius: '99px', color: '#2CA05A', fontWeight: 600, fontSize: '0.85rem', marginBottom: '24px' }}>
            👗 Empleado Digital para Tiendas y Boutiques
          </div>
          <h2 style={{ fontSize: "4.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
            Tu boutique abierta y vendiendo <span className="text-gradient">las 24 horas del día.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", marginBottom: 40, maxWidth: 650, margin: "0 auto 40px", lineHeight: 1.6 }}>
            No pierdas más ventas en la madrugada. Charlo atiende a tus clientes, les muestra tallas, y cierra la compra por WhatsApp e Instagram.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
            <Link href="/signup" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>Automatizar mi tienda</Link>
            <Link href="#demo" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)' }}>Agenda una Llamada</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "80px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h3 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>El Agente que conoce tu inventario.</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>El agotamiento de responder "¿Precio?" todo el día se acabó.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🛍️</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Ventas Consultivas Reales</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Si el cliente pide "un vestido rojo para boda", Charlo busca en tu información y manda las mejores opciones disponibles.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>💬</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Gestión de Dudas</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Responde al instante sobre políticas de cambio, ubicación física y tiempos de entrega de Correos de Costa Rica.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>💳</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Cierre de Ventas Eficaz</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Calcula envío, recibe y verifica el SINPE, y recopila los datos del cliente. Tú solo imprimes la guía de envío.
              </p>
            </div>

            <div className="glass-panel feature-card">
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>⭐</div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>Vende mientras duermes</h4>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                "Mi celular no paraba de sonar. Charlo ahora atiende curiosos y solo me pasa a los que ya enviaron el comprobante." - Carlos, Tienda en Heredia.
              </p>
            </div>
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
