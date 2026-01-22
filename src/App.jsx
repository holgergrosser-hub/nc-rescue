import React, { useState } from 'react';

// =====================================================
// KONFIGURATION
// =====================================================
const SCRIPT_URL =
  import.meta.env.VITE_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbw38nfScFJxFyroWPA_24YA9DSK9RX84ILT9_Bq_ItMCqhm4U4LZ_T2-mX_I34FO1PsSg/exec';

// Testmodus steuert, ob das Backend (Apps Script) E-Mails/Folgetrigger überspringt.
// Default: lokal (Vite dev) = true, Production-Build = false.
// Override (z.B. Netlify): setze VITE_TEST_MODE=true (oder =false).
const TEST_MODE = (() => {
  const raw = import.meta.env.VITE_TEST_MODE;
  if (raw === undefined) return import.meta.env.DEV;
  return raw === 'true' || raw === '1';
})();
const PRICE_NEBEN = 400;
const PRICE_HAUPT = 800;

// =====================================================
// KOMPONENTE: Anzahl-Wähler
// =====================================================
function AnzahlWaehler({ label, subtitle, value, onChange, preis, color }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleButtonClick = (num) => {
    if (num === '10+') {
      setShowCustom(true);
      setCustomValue('');
      onChange(0);
    } else {
      setShowCustom(false);
      onChange(parseInt(num));
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomValue(val);
    const num = parseInt(val) || 0;
    onChange(Math.max(0, num));
  };

  const buttons = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

  return (
    <div style={styles.anzahlCard}>
      <div style={styles.anzahlHeader}>
        <div>
          <h3 style={styles.anzahlLabel}>{label}</h3>
          <p style={styles.anzahlSubtitle}>{subtitle}</p>
        </div>
        <div style={{...styles.preisTag, backgroundColor: color}}>
          {preis} €
        </div>
      </div>
      
      <div style={styles.buttonGrid}>
        {buttons.map((num) => (
          <button
            key={num}
            style={{
              ...styles.anzahlButton,
              ...((!showCustom && value === parseInt(num)) || (showCustom && num === '10+')
                ? {...styles.anzahlButtonActive, borderColor: color}
                : {}),
            }}
            onClick={() => handleButtonClick(num)}
            type="button"
          >
            {num}
          </button>
        ))}
      </div>

      {showCustom && (
        <div style={styles.customInputBox}>
          <input
            type="number"
            min="10"
            placeholder="Anzahl eingeben (z.B. 15)"
            value={customValue}
            onChange={handleCustomChange}
            style={styles.customInput}
            autoFocus
          />
        </div>
      )}

      {value > 0 && (
        <div style={styles.anzahlSumme}>
          <span style={styles.summeText}>{value} × {preis} € =</span>
          <strong style={styles.summeWert}>{(value * preis).toLocaleString('de-DE')} €</strong>
        </div>
      )}
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '40px 20px',
  },
  
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  logo: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748b',
    maxWidth: '600px',
    margin: '0 auto',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1e293b',
  },
  infoText: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    marginTop: '16px',
  },
  infoListItem: {
    fontSize: '15px',
    color: '#475569',
    padding: '8px 0',
    paddingLeft: '24px',
    position: 'relative',
  },
  bullet: {
    position: 'absolute',
    left: '0',
    color: '#2563eb',
    fontWeight: 'bold',
  },

  // Calculator Card
  calculatorCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '32px',
  },
  calculatorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
    textAlign: 'center',
  },
  calculatorSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '32px',
  },

  // Step Indicator
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  stepDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    transition: 'all 0.3s ease',
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
    width: '32px',
    borderRadius: '6px',
  },

  // Anzahl Card
  anzahlCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '2px solid #e2e8f0',
  },
  anzahlHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  anzahlLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
  },
  anzahlSubtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  preisTag: {
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
  },

  // Button Grid
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  anzahlButton: {
    padding: '14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  anzahlButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    color: '#2563eb',
  },

  // Custom Input
  customInputBox: {
    marginTop: '12px',
  },
  customInput: {
    width: '100%',
    padding: '14px',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
  },

  // Summe
  anzahlSumme: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summeText: {
    fontSize: '15px',
    color: '#64748b',
  },
  summeWert: {
    fontSize: '20px',
    color: '#1e293b',
  },

  // Result Box
  resultBox: {
    backgroundColor: '#f0fdf4',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  resultLabel: {
    fontSize: '14px',
    color: '#064e3b',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#065f46',
    marginBottom: '8px',
  },
  resultDetail: {
    fontSize: '14px',
    color: '#047857',
  },

  // Form
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    minHeight: '100px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },

  // Buttons
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  buttonPrimary: {
    flex: 1,
    padding: '16px 32px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonSecondary: {
    padding: '16px 32px',
    backgroundColor: '#fff',
    color: '#2563eb',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonDisabled: {
    backgroundColor: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
  },

  // Success State
  successCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '48px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '16px',
  },
  successText: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '12px',
    lineHeight: '1.6',
  },

  // Footer
  footer: {
    textAlign: 'center',
    padding: '32px 20px',
    color: '#64748b',
    fontSize: '14px',
  },
  footerStrong: {
    color: '#1e293b',
    fontWeight: '600',
  },

  // Disclaimer
  disclaimer: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '16px',
    textAlign: 'center',
    lineHeight: '1.5',
  },
};

// =====================================================
// HAUPT-APP
// =====================================================
export default function App() {
  const [step, setStep] = useState(0);
  const [nebenCount, setNebenCount] = useState(0);
  const [hauptCount, setHauptCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    firma: '',
    ansprechpartner: '',
    email: '',
    telefon: '',
    beschreibung: '',
  });

  const totalCount = nebenCount + hauptCount;
  const nebenPreis = nebenCount * PRICE_NEBEN;
  const hauptPreis = hauptCount * PRICE_HAUPT;
  const zwischensumme = nebenPreis + hauptPreis;
  const mwst = Math.round(zwischensumme * 0.19);
  const gesamt = zwischensumme + mwst;

  const handleSubmit = async () => {
    if (!formData.email) return;
    
    setSubmitting(true);

    const payload = {
      ...formData,
      nebenCount,
      hauptCount,
      nebenPreis,
      hauptPreis,
      zwischensumme,
      mwst,
      gesamt,
      timestamp: new Date().toISOString(),
      testMode: TEST_MODE,
    };

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        // Apps Script WebApps sind oft nicht CORS-freundlich (insb. Preflight/OPTIONS).
        // Mit `no-cors` wird die Anfrage gesendet; die Response ist dann "opaque".
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      // Bei `no-cors` können wir den Status nicht lesen (opaque). Wenn die Anfrage
      // ohne Exception rausging, behandeln wir das als Erfolg.
      if (response.type === 'opaque' || response.ok) {
        setSubmitted(true);
      } else {
        alert('Es gab einen Fehler. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.');
      }
    } catch (error) {
      alert('Es gab einen Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✅</div>
            <h1 style={styles.successTitle}>Anfrage erfolgreich gesendet!</h1>
            <p style={styles.successText}>
              Vielen Dank für Ihre Anfrage.
              {TEST_MODE
                ? ' (Testmodus aktiv: Es werden keine E-Mails versendet.)'
                : ' Sie erhalten in Kürze eine Bestätigung per E-Mail mit Ihrem persönlichen Angebot als PDF.'}
            </p>
            <p style={styles.successText}>
              Ich melde mich innerhalb von 24 Stunden bei Ihnen.
            </p>
            <div style={{marginTop: '32px'}}>
              <button 
                style={styles.buttonPrimary}
                onClick={() => window.location.reload()}
              >
                Neue Anfrage stellen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.logo}>🆘</div>
          <h1 style={styles.title}>NC-Rescue</h1>
          <p style={styles.subtitle}>
            Fachliche Unterstützung bei ISO 9001 Abweichungen – 
            klar, verlässlich, erfahren
          </p>
        </header>

        {/* INFO CARDS */}
        <div style={styles.infoCard}>
          <h2 style={styles.infoTitle}>Wann diese Unterstützung sinnvoll ist</h2>
          <p style={styles.infoText}>
            Sie haben eine Neben- oder Hauptabweichung im ISO-9001-Audit erhalten 
            und sind unsicher über die richtige Reaktion, Ursachenanalyse oder 
            angemessene Maßnahmen?
          </p>
          <p style={styles.infoText}>
            Diese Situationen kommen häufig vor:
          </p>
          <ul style={styles.infoList}>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              „Der Auditor hat eine Hauptabweichung festgestellt, aber für uns wirkt das überzogen."
            </li>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              „Wir sind uns nicht sicher, ob unsere Ursachenanalyse aus Auditorensicht hält."
            </li>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              „Die geplanten Maßnahmen erscheinen uns angemessen, aber wir wollen Sicherheit."
            </li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h2 style={styles.infoTitle}>Was diese Unterstützung leistet</h2>
          <ul style={styles.infoList}>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              Fachliche Einordnung der Abweichung im Normkontext
            </li>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              Bewertung aus Auditorensicht: Ist das Haupt- oder Nebenabweichung?
            </li>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              Prüfung der Ursachenlogik: Greift Ihre Analyse?
            </li>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              Review geplanter Maßnahmen: Angemessen oder übertrieben?
            </li>
            <li style={styles.infoListItem}>
              <span style={styles.bullet}>✓</span>
              Audit-Simulation: „Was würde der Auditor fragen?"
            </li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h2 style={styles.infoTitle}>Über 30 Jahre Erfahrung</h2>
          <p style={styles.infoText}>
            Ich arbeite seit über 30 Jahren im Qualitätsmanagement, habe selbst 
            als Auditor gearbeitet und über 1.000 Audits durchgeführt. Ich kenne 
            die Perspektive beider Seiten und weiß, worauf es wirklich ankommt.
          </p>
          <p style={styles.infoText}>
            Meine Einschätzung ist unabhängig – ich arbeite weder für 
            Zertifizierungsstellen noch verkaufe ich Ihnen anschließend ein 
            Beratungsprojekt.
          </p>
        </div>

        {/* CALCULATOR */}
        <div style={styles.calculatorCard}>
          <h2 style={styles.calculatorTitle}>
            {step === 0 ? 'Anfrage stellen' : 'Ihre Kontaktdaten'}
          </h2>
          <p style={styles.calculatorSubtitle}>
            {step === 0 
              ? 'Wählen Sie die Anzahl Ihrer Abweichungen' 
              : 'Ich sende Ihnen Ihr persönliches Angebot per E-Mail'}
          </p>

          {/* Step Indicator */}
          <div style={styles.stepIndicator}>
            <div style={{...styles.stepDot, ...(step >= 0 ? styles.stepDotActive : {})}} />
            <div style={{...styles.stepDot, ...(step >= 1 ? styles.stepDotActive : {})}} />
          </div>

          {/* STEP 0: Anzahl wählen */}
          {step === 0 && (
            <>
              <AnzahlWaehler
                label="Nebenabweichungen"
                subtitle="Kleinere Abweichungen, die keine systemischen Auswirkungen haben"
                value={nebenCount}
                onChange={setNebenCount}
                preis={PRICE_NEBEN}
                color="#3b82f6"
              />

              <AnzahlWaehler
                label="Hauptabweichungen"
                subtitle="Größere Abweichungen mit systemischen Auswirkungen"
                value={hauptCount}
                onChange={setHauptCount}
                preis={PRICE_HAUPT}
                color="#dc2626"
              />

              {totalCount > 0 && (
                <div style={styles.resultBox}>
                  <div style={styles.resultLabel}>Gesamtpreis</div>
                  <div style={styles.resultValue}>
                    {gesamt.toLocaleString('de-DE')} €
                  </div>
                  <div style={styles.resultDetail}>
                    {nebenCount > 0 && `${nebenCount}× Neben (${nebenPreis.toLocaleString('de-DE')} € netto)`}
                    {nebenCount > 0 && hauptCount > 0 && ' + '}
                    {hauptCount > 0 && `${hauptCount}× Haupt (${hauptPreis.toLocaleString('de-DE')} € netto)`}
                    {' • '}inkl. {mwst.toLocaleString('de-DE')} € MwSt.
                  </div>
                </div>
              )}

              <button
                style={{
                  ...styles.buttonPrimary,
                  ...(totalCount === 0 ? styles.buttonDisabled : {}),
                }}
                disabled={totalCount === 0}
                onClick={() => setStep(1)}
              >
                Weiter zur Anfrage →
              </button>
            </>
          )}

          {/* STEP 1: Kontaktdaten */}
          {step === 1 && (
            <>
              <div style={styles.resultBox}>
                <div style={styles.resultLabel}>Ihr Festpreis</div>
                <div style={styles.resultValue}>
                  {gesamt.toLocaleString('de-DE')} €
                </div>
                <div style={styles.resultDetail}>
                  {nebenCount > 0 && `${nebenCount}× Neben`}
                  {nebenCount > 0 && hauptCount > 0 && ', '}
                  {hauptCount > 0 && `${hauptCount}× Haupt`}
                  {' • '}inkl. MwSt.
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Firma / Unternehmen</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.firma}
                  onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                  placeholder="z.B. Mustermann GmbH"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Ansprechpartner</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.ansprechpartner}
                  onChange={(e) => setFormData({ ...formData, ansprechpartner: e.target.value })}
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>E-Mail *</label>
                <input
                  style={styles.input}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ihre.email@firma.de"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Telefon (optional)</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  placeholder="z.B. 0911 1234567"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Kurze Beschreibung (optional)</label>
                <textarea
                  style={styles.textarea}
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                  placeholder="z.B. Normkapitel, Thema der Abweichung, besondere Umstände..."
                />
              </div>

              <div style={styles.buttonRow}>
                <button 
                  style={styles.buttonSecondary} 
                  onClick={() => setStep(0)}
                >
                  ← Zurück
                </button>
                <button
                  style={{
                    ...styles.buttonPrimary,
                    ...(formData.email ? {} : styles.buttonDisabled),
                  }}
                  disabled={!formData.email || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? '⏳ Wird gesendet...' : 'Unverbindlich anfragen →'}
                </button>
              </div>

              <p style={styles.disclaimer}>
                Mit dem Absenden stimmen Sie zu, dass ich Sie per E-Mail kontaktiere. 
                Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
              </p>
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <p>
            <span style={styles.footerStrong}>Holger Grosser</span><br />
            QM-Dienstleistungen • Simonstr. 14 • 90763 Fürth<br />
            Tel: 0911-49522541 • holger.grosser@qm-guru.de<br />
            <a href="https://www.qm-guru.de" style={{color: '#2563eb', textDecoration: 'none'}}>
              www.QM-Guru.de
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
