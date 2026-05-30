import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--text-primary)', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#fff' }}>Política de Privacidad</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Última actualización: {new Date().toLocaleDateString()}</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>1. Introducción</h2>
        <p>
          Bienvenido a <strong>Charlo</strong>. Nos tomamos muy en serio la privacidad de tus datos y los de tus clientes. 
          Esta Política de Privacidad describe cómo recopilamos, usamos, procesamos y protegemos la información personal 
          cuando utilizas nuestra plataforma de agentes de inteligencia artificial y nuestras integraciones con servicios 
          de terceros como Meta (Facebook y WhatsApp).
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>2. Información que Recopilamos</h2>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Información de la Cuenta:</strong> Nombre, correo electrónico y datos de autenticación provistos por Firebase o proveedores OAuth (Google, Meta).</li>
          <li><strong>Datos de Integración (Meta):</strong> Al conectar tu cuenta de Facebook o WhatsApp Business, recopilamos los tokens de acceso temporales o de larga duración, el ID de tu página de Facebook, el ID de tu cuenta de WhatsApp Business (WABA) y tu Phone Number ID necesarios para enviar y recibir mensajes en tu nombre.</li>
          <li><strong>Datos de Chat:</strong> Historial de mensajes de texto, audios e imágenes enviados por los clientes a tu número de WhatsApp conectado, estrictamente para que la Inteligencia Artificial pueda procesarlos y generar una respuesta.</li>
          <li><strong>Información del Negocio:</strong> Catálogos de productos, horarios y políticas que nos proporcionas durante el proceso de Onboarding para entrenar a tu agente.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>3. Cómo Usamos la Información</h2>
        <p>Utilizamos tu información exclusivamente para los siguientes propósitos:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <li>Brindar el servicio principal de respuestas automáticas a través de WhatsApp.</li>
          <li>Procesar los mensajes entrantes utilizando grandes modelos de lenguaje (LLMs como Google Gemini) para generar respuestas precisas.</li>
          <li>Mantener, depurar y mejorar la seguridad de nuestra plataforma.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>4. Procesamiento de IA y Compartir con Terceros</h2>
        <p>No vendemos ni comercializamos tus datos personales. Para que Charlo funcione, la información se comparte de forma segura con los siguientes proveedores de infraestructura:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <li><strong>Meta Platforms, Inc:</strong> Para la recepción y envío de mensajes a través de la API oficial de WhatsApp Cloud.</li>
          <li><strong>Proveedores de Inteligencia Artificial (Google Gemini, etc.):</strong> Los mensajes entrantes se envían a través de API a proveedores de LLMs para generar respuestas. <strong>Nota importante:</strong> Utilizamos APIs de nivel empresarial, lo que significa que los proveedores de IA no utilizan los datos de tus chats para entrenar sus modelos públicos.</li>
          <li><strong>Google (Firebase / Google Cloud):</strong> Utilizamos infraestructura de Google para el alojamiento seguro y almacenamiento cifrado de bases de datos.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>5. Seguridad de los Datos</h2>
        <p>
          Implementamos medidas de seguridad estándar de la industria para proteger tu información. Todos los datos transmitidos 
          entre tu navegador, nuestros servidores y la API de Meta están encriptados mediante SSL/TLS (HTTPS). Los datos almacenados 
          (bases de datos y tokens de acceso) están encriptados en reposo utilizando las medidas de seguridad de Google Cloud y Firebase.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>6. Derechos de los Usuarios (GDPR / CCPA)</h2>
        <p>
          Dependiendo de tu ubicación, tienes derecho a acceder, rectificar, portar o solicitar la eliminación de tu información 
          personal. Para ejercer estos derechos, por favor contáctanos al correo especificado al final de este documento.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>7. Retención y Eliminación de Datos (Data Deletion Instructions)</h2>
        <p>
          Mantenemos tus datos solo mientras tu cuenta esté activa para proveer el servicio.
        </p>
        <p style={{ marginTop: '8px' }}>
          <strong>¿Cómo solicitar la eliminación de tus datos?</strong><br />
          Puedes solicitar la eliminación total de tu cuenta, tokens de Meta y el historial de bases de datos en cualquier momento 
          enviando un correo electrónico a <strong>soporte@charlo.com</strong> con el asunto "Solicitud de Eliminación de Datos". 
          Procesaremos tu solicitud y eliminaremos todos los registros asociados en un plazo máximo de 30 días.
        </p>
        <p style={{ marginTop: '8px' }}>
          Asimismo, si desvinculas nuestra aplicación desde la configuración de "Integraciones de Negocios" en tu cuenta de Facebook/Meta, 
          revocaremos inmediatamente los tokens de acceso y Charlo dejará de tener acceso a tu WhatsApp.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>8. Contacto</h2>
        <p>
          Si tienes preguntas sobre esta Política de Privacidad o sobre cómo manejamos tus datos y los de la API de Meta, 
          por favor contáctanos a <strong>soporte@charlo.com</strong>.
        </p>
      </section>
    </div>
  );
}
