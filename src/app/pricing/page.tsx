import React from 'react';
import styles from './pricing.module.css';

export const metadata = {
  title: 'Precios - Charlo',
  description: 'Planes de automatización de WhatsApp con IA y verificación de SINPE Móvil para negocios en Costa Rica.',
};

export default function PricingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.glowBackground}></div>
      
      <header className={styles.header}>
        <div className={styles.pillBadge}>Precios Transparentes</div>
        <h1 className={styles.title}>Planes a la medida de tu negocio</h1>
        <p className={styles.subtitle}>
          Deja de perder tiempo verificando <strong>SINPE Móvil</strong> y respondiendo mensajes manuales. 
          Automatiza tu WhatsApp con la IA de Charlo y enfócate en crecer.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Plan Emprendedor */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>Emprendedor</h2>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>$</span>
              <span className={styles.price}>49</span>
              <span className={styles.period}>/mes</span>
            </div>
            <p className={styles.targetAudience}>Ideal para independientes y negocios emergentes.</p>
          </div>
          <ul className={styles.featureList}>
            <li><span className={styles.check}>✓</span> Hasta 300 conversaciones / mes</li>
            <li><span className={styles.check}>✓</span> Auto-respuesta IA básica</li>
            <li><span className={styles.check}>✓</span> 1 Asiento Humano (Bandeja Omnicanal)</li>
            <li><span className={styles.check}>✓</span> Agenda automática básica</li>
          </ul>
          <button className={styles.secondaryButton}>Empezar ahora</button>
        </div>

        {/* Plan Pyme (Highlighted) */}
        <div className={`${styles.card} ${styles.highlighted}`}>
          <div className={styles.popularBadge}>Más Popular en Costa Rica</div>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>Pyme</h2>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>$</span>
              <span className={styles.price}>99</span>
              <span className={styles.period}>/mes</span>
            </div>
            <p className={styles.targetAudience}>Para negocios que procesan pagos y citas diariamente.</p>
          </div>
          <ul className={styles.featureList}>
            <li className={styles.highlightFeature}>
              <span className={styles.checkHighlight}>✓</span> 
              <strong>Extracción Inteligente de SINPE Móvil</strong>
            </li>
            <li><span className={styles.check}>✓</span> Hasta 800 conversaciones / mes</li>
            <li><span className={styles.check}>✓</span> IA Avanzada (Caché de SOPs)</li>
            <li><span className={styles.check}>✓</span> Mejora Continua Proactiva</li>
            <li><span className={styles.check}>✓</span> 3 Asientos Humanos</li>
          </ul>
          <button className={styles.primaryButton}>Probar 14 días gratis</button>
        </div>

        {/* Plan Empresarial */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>Empresarial</h2>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>$</span>
              <span className={styles.price}>199</span>
              <span className={styles.period}>/mes</span>
            </div>
            <p className={styles.targetAudience}>Para academias, clínicas y restaurantes de alto tráfico.</p>
          </div>
          <ul className={styles.featureList}>
            <li><span className={styles.check}>✓</span> Hasta 2,000 conversaciones / mes</li>
            <li><span className={styles.check}>✓</span> <strong>CRM y Mensajería Masiva</strong></li>
            <li><span className={styles.check}>✓</span> Múltiples Agentes de IA</li>
            <li><span className={styles.check}>✓</span> Bases de conocimiento ilimitadas</li>
            <li><span className={styles.check}>✓</span> 5+ Asientos Humanos</li>
          </ul>
          <button className={styles.secondaryButton}>Contactar Ventas</button>
        </div>
      </div>

      <section className={styles.addonsSection}>
        <h3 className={styles.addonsTitle}>Complementos Opcionales</h3>
        <p className={styles.addonsSubtitle}>Personaliza tu plan según las necesidades de tu empresa.</p>
        
        <div className={styles.addonsGrid}>
          <div className={styles.addonCard}>
            <div className={styles.addonIcon}>🚀</div>
            <div className={styles.addonContent}>
              <h4 className={styles.addonName}>Paquete de Mensajes Masivos</h4>
              <p className={styles.addonDesc}>250 mensajes de marketing o recordatorios para enviar a tu base de datos de WhatsApp.</p>
            </div>
            <div className={styles.addonPriceTag}>+$15<span className={styles.addonPricePeriod}>/mes</span></div>
          </div>
          
          <div className={styles.addonCard}>
            <div className={styles.addonIcon}>✨</div>
            <div className={styles.addonContent}>
              <h4 className={styles.addonName}>Configuración Express (Setup)</h4>
              <p className={styles.addonDesc}>Nos encargamos de entrenar tu IA y subir tu catálogo completo para que arranques sin esfuerzo.</p>
            </div>
            <div className={styles.addonPriceTag}>$99<span className={styles.addonPricePeriod}> pago único</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
