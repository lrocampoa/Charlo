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
          <li>Mantener y mejorar la seguridad de nuestra plataforma.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>4. Compartir con Terceros</h2>
        <p>No vendemos ni comercializamos tus datos personales. Sin embargo, para que Charlo funcione, la información se comparte de forma segura con los siguientes proveedores de infraestructura:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <li><strong>Meta Platforms, Inc:</strong> Para la recepción y envío de mensajes a través de la API oficial de WhatsApp Cloud.</li>
          <li><strong>Google (Gemini AI / Firebase):</strong> Los mensajes entrantes se procesan a través de los servidores de Google para generar las respuestas de IA. La información se almacena de forma segura en las bases de datos de Firebase.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>5. Retención y Eliminación de Datos</h2>
        <p>
          Mantenemos tus datos y el historial de chats solo mientras tu cuenta esté activa. Puedes solicitar la eliminación total 
          de tu cuenta, tokens de Meta y bases de datos en cualquier momento enviando una solicitud. Al desvincular tu cuenta 
          desde la configuración de Meta, revocaremos inmediatamente los tokens de acceso y Charlo dejará de tener acceso a tu WhatsApp.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>6. Contacto</h2>
        <p>
          Si tienes preguntas sobre esta Política de Privacidad o sobre cómo manejamos tus datos y los de la API de Meta, 
          por favor contáctanos a <strong>soporte@charlo.com</strong>.
        </p>
      </section>
    </div>
  );
}
