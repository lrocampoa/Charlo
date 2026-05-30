import React from 'react';

export default function TermsAndConditions() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--text-primary)', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#fff' }}>Términos y Condiciones de Servicio</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Última actualización: {new Date().toLocaleDateString()}</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>1. Aceptación de los Términos</h2>
        <p>
          Al acceder y utilizar <strong>Charlo</strong>, aceptas cumplir y estar sujeto a estos Términos y Condiciones. 
          Si no estás de acuerdo con alguna parte de los términos, no debes utilizar nuestra plataforma ni conectar 
          tus servicios de Meta (Facebook/WhatsApp).
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>2. Descripción del Servicio</h2>
        <p>
          Charlo es una plataforma que permite a los negocios conectar agentes de inteligencia artificial a sus canales 
          de comunicación (como WhatsApp) utilizando la API de Meta. Proporcionamos la infraestructura tecnológica para 
          recibir mensajes de tus clientes, procesarlos mediante IA y enviar respuestas automatizadas en tu nombre.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>3. Uso Aceptable (Acceptable Use Policy) y Cumplimiento con Meta</h2>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Debes cumplir en todo momento con las Políticas de WhatsApp Business, las Condiciones del Servicio de WhatsApp Business y las Políticas de la Plataforma de Meta.</li>
          <li><strong>Prohibiciones:</strong> Queda estrictamente prohibido utilizar Charlo para enviar spam, material ilegal, contenido para adultos, fomentar el odio, o vender productos restringidos por las políticas comerciales de Meta (ej. armas, drogas, suplementos no aprobados).</li>
          <li>Eres responsable del contenido de los mensajes enviados a través de nuestro servicio y de contar con el consentimiento explícito (opt-in) de tus clientes para comunicarte con ellos a través de WhatsApp.</li>
          <li>Charlo no se hace responsable por suspensiones o bloqueos de tu cuenta de WhatsApp o Facebook por parte de Meta debido al incumplimiento de sus políticas.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>4. Cuentas y Seguridad</h2>
        <p>
          Eres responsable de mantener la confidencialidad de tus credenciales de inicio de sesión y de cualquier 
          token de acceso generado para la integración con Meta. Debes notificarnos inmediatamente sobre cualquier 
          uso no autorizado de tu cuenta.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>5. Propiedad Intelectual</h2>
        <p>
          <strong>Tus Datos:</strong> Tú mantienes la propiedad de todos los datos de tu negocio, los catálogos y la información que proporciones para entrenar a tu agente.
        </p>
        <p style={{ marginTop: '8px' }}>
          <strong>Plataforma Charlo:</strong> Charlo retiene todos los derechos, títulos e intereses sobre la plataforma, el software subyacente, el diseño de la interfaz y la arquitectura de los agentes de IA. No puedes copiar, modificar ni realizar ingeniería inversa de nuestra tecnología.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>6. Limitación de Responsabilidad y "Alucinaciones" de la IA</h2>
        <p>
          Nuestros agentes están impulsados por grandes modelos de lenguaje (LLMs) de terceros. Aunque nos esforzamos por 
          ofrecer respuestas precisas basadas en la información que proporcionas, <strong>la Inteligencia Artificial puede 
          generar información incorrecta, incompleta o engañosa ("alucinaciones").</strong>
        </p>
        <p style={{ marginTop: '8px' }}>
          Tú aceptas que eres el único responsable de revisar el comportamiento de tu agente. Charlo no será responsable 
          bajo ninguna circunstancia de pérdidas, daños o reclamos resultantes de información incorrecta proporcionada por 
          el agente a tus clientes (ej. cotizaciones erróneas, políticas mal explicadas).
        </p>
        <p style={{ marginTop: '8px' }}>
          El servicio se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio será ininterrumpido 
          o estará libre de errores.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>7. Indemnización</h2>
        <p>
          Aceptas indemnizar, defender y eximir de responsabilidad a Charlo, sus directores, empleados y afiliados de 
          y contra cualquier reclamo, demanda, daño, obligación, pérdida o gasto (incluyendo honorarios de abogados) 
          que surja de: (i) tu uso de la plataforma; (ii) tu violación de estos Términos; (iii) la violación de los 
          derechos de terceros, incluidos los clientes; o (iv) violaciones a las políticas de Meta Platforms, Inc.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>8. Cancelación y Terminación</h2>
        <p>
          Puedes cancelar tu cuenta y revocar los accesos de Charlo a tu cuenta de Meta en cualquier momento. 
          Nos reservamos el derecho de suspender o cancelar tu acceso al servicio sin previo aviso si determinamos 
          que has violado estos Términos (especialmente la Política de Uso Aceptable) o las políticas de nuestros 
          proveedores asociados.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>9. Modificaciones de los Términos</h2>
        <p>
          Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te notificaremos sobre cambios 
          significativos a través de nuestra plataforma o por correo electrónico. El uso continuado del servicio 
          después de dichos cambios constituye tu aceptación de los nuevos Términos.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>10. Contacto</h2>
        <p>
          Si tienes alguna duda sobre estos Términos y Condiciones, por favor contáctanos a <strong>soporte@charlo.com</strong>.
        </p>
      </section>
    </div>
  );
}
