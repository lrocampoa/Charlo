const fs = require('fs');
const filePath = './src/app/dashboard/campaigns/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add state and helper
if (!content.includes('const [feedbackModal,')) {
  content = content.replace(
    "  const [loadingTriggers, setLoadingTriggers] = useState(false);",
    "  const [loadingTriggers, setLoadingTriggers] = useState(false);\n\n  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean, type: 'success' | 'error', message: string }>({ open: false, type: 'success', message: '' });\n  const showFeedback = (type: 'success' | 'error', message: string) => { setFeedbackModal({ open: true, type, message }); };"
  );
}

// Replace success alerts
content = content.replace("alert(t('campaigns.alertSent').replace('{0}', data.campaign.sentCount).replace('{1}', data.campaign.failedCount));", "showFeedback('success', t('campaigns.alertSent').replace('{0}', data.campaign.sentCount.toString()).replace('{1}', data.campaign.failedCount.toString()));");
content = content.replace("alert(t('campaigns.alertTemplateReview'));", "showFeedback('success', t('campaigns.alertTemplateReview'));");

// Replace remaining alerts with error
content = content.replace(/alert\((.*?)\);/g, "showFeedback('error', $1);");

// Append Modal UI before last div
const modalUI = `
      {feedbackModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--border-radius-lg)', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: feedbackModal.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: feedbackModal.type === 'success' ? '#10b981' : '#ef4444', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {feedbackModal.type === 'success' ? '✓' : '⚠️'}
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
                {feedbackModal.type === 'success' ? 'Éxito' : 'Error'}
              </h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {feedbackModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontWeight: 500 }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('feedbackModal.open')) {
  const lastDivIndex = content.lastIndexOf('    </div>\n  );\n}');
  content = content.slice(0, lastDivIndex) + modalUI + content.slice(lastDivIndex);
}

fs.writeFileSync(filePath, content);
console.log('Done!');
