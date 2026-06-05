import sys
import re

with open("src/app/onboarding/page.tsx", "r") as f:
    content = f.read()

# 1. State Variables
state_vars = """  const [selectedPageId, setSelectedPageId] = useState("");
  const [tempMetaData, setTempMetaData] = useState<any>(null);

  // Products Review States
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('CRC');
  const [syncToMeta, setSyncToMeta] = useState(true);
  const [showProductReview, setShowProductReview] = useState(false);"""

content = content.replace(
    """  const [selectedPageId, setSelectedPageId] = useState("");
  const [tempMetaData, setTempMetaData] = useState<any>(null);""",
    state_vars
)

# 2. Update handleScrapeUrl
old_scrape = """      if (res.ok && data.profileUpdate) {
        setProfile(prev => ({ ...prev, ...data.profileUpdate }));
        setExtractedProvider('Website');
      } else {"""

new_scrape = """      if (res.ok && data.profileUpdate) {
        setProfile(prev => ({ ...prev, ...data.profileUpdate }));
        setExtractedProvider('Website');
        if (data.extractedProducts && data.extractedProducts.length > 0) {
          setExtractedProducts(data.extractedProducts);
          setShowProductReview(true);
        }
      } else {"""

content = content.replace(old_scrape, new_scrape)

# 3. Update handleFileUpload
old_upload = """      if (res.ok && data.profileUpdate) {
        setProfile(prev => ({ ...prev, ...data.profileUpdate }));
        setExtractedProvider('Documento');
      } else {"""

new_upload = """      if (res.ok && data.profileUpdate) {
        setProfile(prev => ({ ...prev, ...data.profileUpdate }));
        setExtractedProvider('Documento');
        if (data.extractedProducts && data.extractedProducts.length > 0) {
          setExtractedProducts(data.extractedProducts);
          setShowProductReview(true);
        }
      } else {"""

content = content.replace(old_upload, new_upload)

# 4. Final Submit - include extractedProducts and syncToMeta
old_final_submit = """        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          knowledgeBase: profile.knowledgeBase,
          productsCatalog: profile.productsCatalog,
          calendlyLink: profile.calendlyLink,
          persona: profile.persona,
          whatsappPhoneNumberId: phoneId,
          metaToken: metaToken,
          facebookPageId: facebookPageId,
          instagramAccountId: instagramAccountId,
          userId: user.uid
        })"""

new_final_submit = """        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          knowledgeBase: profile.knowledgeBase,
          productsCatalog: profile.productsCatalog,
          calendlyLink: profile.calendlyLink,
          persona: profile.persona,
          whatsappPhoneNumberId: phoneId,
          metaToken: metaToken,
          facebookPageId: facebookPageId,
          instagramAccountId: instagramAccountId,
          userId: user.uid,
          extractedProducts: extractedProducts,
          syncToMeta: syncToMeta
        })"""

content = content.replace(old_final_submit, new_final_submit)

# 5. Product Review Modal UI
product_ui = """      {showProductReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="panel-glass" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Productos Encontrados</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Hemos extraído {extractedProducts.length} productos/servicios. Confirma la moneda base para tus precios.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Moneda Principal</label>
              <select 
                className="input-field" 
                value={baseCurrency} 
                onChange={(e) => setBaseCurrency(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="CRC">Colones Costarricenses (CRC)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="MXN">Pesos Mexicanos (MXN)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '12px' }}>Vista Previa</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {extractedProducts.slice(0, 3).map((p, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <span>{p.name}</span>
                    <strong>{p.price ? `${p.price} ${p.currency || baseCurrency}` : 'Consultar'}</strong>
                  </li>
                ))}
                {extractedProducts.length > 3 && (
                  <li style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '8px' }}>
                    y {extractedProducts.length - 3} productos más...
                  </li>
                )}
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px', padding: '16px', backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)', borderRadius: '8px', border: '1px solid var(--primary-color)' }}>
              <input 
                type="checkbox" 
                id="syncMetaToggle"
                checked={syncToMeta}
                onChange={(e) => setSyncToMeta(e.target.checked)}
                style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
              />
              <label htmlFor="syncMetaToggle" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong>Sincronizar catálogo con Meta</strong><br/>
                <span style={{ color: 'var(--text-secondary)' }}>Opcional (Requiere Plan Starter o superior). Crearemos un catálogo automáticamente en Facebook, Instagram y WhatsApp con estos productos.</span>
              </label>
            </div>

            <button className="btn-primary" onClick={() => {
              // Update all products to use the selected base currency if none was provided
              setExtractedProducts(prev => prev.map(p => ({...p, currency: p.currency || baseCurrency})));
              setShowProductReview(false);
            }} style={{ marginTop: '8px' }}>
              Confirmar y Continuar
            </button>
          </div>
        </div>
      )}"""

# Replace right before the end of the return statement
content = content.replace("    </div>\n  );\n}", product_ui + "\n    </div>\n  );\n}")

with open("src/app/onboarding/page.tsx", "w") as f:
    f.write(content)

