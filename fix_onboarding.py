import sys

with open("src/app/onboarding/page.tsx", "r") as f:
    content = f.read()

# 1. Insert State Variables
state_vars = """  const [websiteUrl, setWebsiteUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Asset Selection States
  const [availablePhones, setAvailablePhones] = useState<any[]>([]);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [showAssetSelection, setShowAssetSelection] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [tempMetaData, setTempMetaData] = useState<any>(null);"""

content = content.replace(
    "  const [websiteUrl, setWebsiteUrl] = useState('');\n  const fileInputRef = useRef<HTMLInputElement>(null);",
    state_vars
)

# 2. Insert Confirm Handler right before scrollToBottom
confirm_handler = """  const handleConfirmAssetSelection = () => {
    const data = tempMetaData;
    const chosenPhone = availablePhones.find(p => p.id === selectedPhoneId);
    const chosenPage = availablePages.find(p => p.id === selectedPageId);

    setMetaToken(data.accessToken);
    if (chosenPhone) {
      setPhoneId(chosenPhone.id);
      setHasPaymentMethod(chosenPhone.hasPaymentMethod);
    }
    if (chosenPage) setFacebookPageId(chosenPage.id);
    if (data.instagramAccountId) setInstagramAccountId(data.instagramAccountId);
    
    let finalProfile = { ...profile };
    if (chosenPage) {
      if (chosenPage.name) finalProfile.name = chosenPage.name;
      let kb = `ID de WhatsApp Business: ${chosenPhone?.wabaId || "Desconocido"}\\n`;
      if (chosenPage.phone) kb += `Teléfono FB: ${chosenPage.phone}\\n`;
      if (chosenPage.website) kb += `Sitio Web: ${chosenPage.website}\\n`;
      if (chosenPage.about) kb += `\\nSobre nosotros:\\n${chosenPage.about}`;
      finalProfile.knowledgeBase = kb;
    } else if (chosenPhone) {
       finalProfile.name = chosenPhone.verified_name || "Mi Negocio de WhatsApp";
       finalProfile.knowledgeBase = `ID de WhatsApp Business: ${chosenPhone.wabaId}\\n`;
    }

    setProfile(finalProfile);
    setExtractedProvider('Meta');
    setShowAssetSelection(false);
    setOnboardingStep(2);
  };

  const scrollToBottom = () => {"""

content = content.replace("  const scrollToBottom = () => {", confirm_handler)


# 3. Handle FB Response
old_fb_response = """              if (res.ok && data.success) {
                console.log("META DEBUG INFO:", data.debugLogs); // Output everything for debugging
                setMetaToken(data.accessToken);
                if (data.phoneId) setPhoneId(data.phoneId);
                if (data.facebookPageId) setFacebookPageId(data.facebookPageId);
                if (data.instagramAccountId) setInstagramAccountId(data.instagramAccountId);
                if (data.hasPaymentMethod !== undefined) setHasPaymentMethod(data.hasPaymentMethod);
                
                setProfile(prev => ({ ...prev, ...data.profileUpdate }));
                setExtractedProvider('Meta');
              } else {"""

new_fb_response = """              if (res.ok && data.success) {
                console.log("META DEBUG INFO:", data.debugLogs); 
                
                if ((data.availablePhones && data.availablePhones.length > 1) || 
                    (data.availablePages && data.availablePages.length > 1)) {
                  
                  setAvailablePhones(data.availablePhones || []);
                  setAvailablePages(data.availablePages || []);
                  setSelectedPhoneId(data.availablePhones?.[0]?.id || "");
                  setSelectedPageId(data.availablePages?.[0]?.id || "");
                  setTempMetaData(data);
                  setShowAssetSelection(true);
                  setIsExtracting(false);
                  return; 
                  
                } else {
                  const singlePhone = data.availablePhones?.[0];
                  const singlePage = data.availablePages?.[0];

                  setMetaToken(data.accessToken);
                  if (singlePhone) {
                    setPhoneId(singlePhone.id);
                    setHasPaymentMethod(singlePhone.hasPaymentMethod);
                  }
                  if (singlePage) setFacebookPageId(singlePage.id);
                  if (data.instagramAccountId) setInstagramAccountId(data.instagramAccountId);
                  
                  let finalProfile = { ...profile };
                  if (singlePage) {
                    if (singlePage.name) finalProfile.name = singlePage.name;
                    let kb = `ID de WhatsApp Business: ${singlePhone?.wabaId || "Desconocido"}\\n`;
                    if (singlePage.phone) kb += `Teléfono FB: ${singlePage.phone}\\n`;
                    if (singlePage.website) kb += `Sitio Web: ${singlePage.website}\\n`;
                    if (singlePage.about) kb += `\\nSobre nosotros:\\n${singlePage.about}`;
                    finalProfile.knowledgeBase = kb;
                  } else if (singlePhone) {
                     finalProfile.name = singlePhone.verified_name || "Mi Negocio de WhatsApp";
                     finalProfile.knowledgeBase = `ID de WhatsApp Business: ${singlePhone.wabaId}\\n`;
                  }

                  setProfile(finalProfile);
                  setExtractedProvider('Meta');
                }
              } else {"""

content = content.replace(old_fb_response, new_fb_response)

# Wait, `setOnboardingStep(2)` was in `finally`.
# We need to make sure we don't call it if `showAssetSelection` is true.
# The original code:
#             } finally {
#               setIsExtracting(false);
#               setOnboardingStep(2);
#             }
old_finally = """            } finally {
              setIsExtracting(false);
              setOnboardingStep(2);
            }"""

new_finally = """            } catch (e) {
              console.error("Backend exchange error:", e);
              alert("Error al comunicarse con el servidor.");
            }"""

# So we remove `finally` entirely, and put `setIsExtracting(false); setOnboardingStep(2);` in the success block and the error block.
# Actually let's just search for the try catch finally block.
import re
content = re.sub(
    r'\} finally \{\s+setIsExtracting\(false\);\s+setOnboardingStep\(2\);\s+\}',
    """} finally {
              // We only proceed if not showing the asset selection
            }""",
    content
)

# Add `setOnboardingStep(2)` to the single-asset branch in handleConnectFacebook.
content = content.replace("setExtractedProvider('Meta');\n                }", "setExtractedProvider('Meta');\n                  setIsExtracting(false);\n                  setOnboardingStep(2);\n                }")
# Add `setIsExtracting(false); setOnboardingStep(2);` to the `else` block of `res.ok && data.success`
content = content.replace("alert(\"No pudimos extraer la información. Continúa manual. Error: \" + (data.error || 'Unknown'));", "alert(\"No pudimos extraer la información. Continúa manual. Error: \" + (data.error || 'Unknown'));\n                setIsExtracting(false);\n                setOnboardingStep(2);")


# 4. Insert Modal UI right before the final `</div>`
modal_ui = """      {showAssetSelection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="panel-glass" style={{ width: '90%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Selecciona tus cuentas</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Has otorgado permisos a múltiples cuentas. Por favor selecciona cuáles quieres vincular a este negocio.
            </p>

            {availablePhones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Número de WhatsApp</label>
                <select 
                  className="input-field" 
                  value={selectedPhoneId} 
                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  {availablePhones.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.verified_name || p.display_phone_number} ({p.display_phone_number})</option>
                  ))}
                </select>
              </div>
            )}

            {availablePages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Página de Facebook</label>
                <select 
                  className="input-field" 
                  value={selectedPageId} 
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  {availablePages.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn-primary" onClick={handleConfirmAssetSelection} style={{ marginTop: '8px' }}>
              Confirmar Selección
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
"""

content = content.replace("    </div>\n  );\n}", modal_ui)

with open("src/app/onboarding/page.tsx", "w") as f:
    f.write(content)

