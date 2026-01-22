// =====================================================
// NC-RESCUE - GOOGLE APPS SCRIPT BACKEND
// =====================================================
// Diesen Code in Google Apps Script einfügen:
// 1. Google Sheet öffnen
// 2. Erweiterungen → Apps Script
// 3. Code einfügen
// 4. SHEET_ID anpassen (Zeile 10)
// 5. Bereitstellen → Neue Bereitstellung → Web-App
// =====================================================

// KONFIGURATION
const CONFIG = {
  SHEET_ID: 'HIER_DEINE_GOOGLE_SHEET_ID',  // <- ANPASSEN!
  SHEET_NAME: 'Anfragen',
  EMAIL_HOLGER: 'holger.grosser@qm-guru.de',
  COMPANY_NAME: 'Holger Grosser - QM-Dienstleistungen',
  COMPANY_ADDRESS: 'Simonstr. 14\n90763 Fürth',
  COMPANY_PHONE: '0911-49522541',
  COMPANY_EMAIL: 'holger.grosser@qm-guru.de',
  COMPANY_WEB: 'www.QM-Guru.de',
};

// =====================================================
// HAUPT-FUNKTION (von Netlify aufgerufen)
// =====================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Testmodus: Frontend kann testMode=true mitsenden (oder ?testMode=true / ?test=1)
    // Dann werden keine E-Mails versendet und keine Follow-ups geplant.
    const testMode = isTestMode_(data, e);
    data.testMode = testMode;
    
    // 1. In Google Sheet speichern
    saveToSheet(data);
    
    // 2. PDF-Angebot erstellen
    const pdfBlob = createPDFAngebot(data);

    if (!testMode) {
      // 3. E-Mail an Kunden senden (mit PDF)
      sendCustomerEmail(data, pdfBlob);

      // 4. Benachrichtigung an Holger
      sendNotificationToHolger(data);

      // 5. Follow-up E-Mails einplanen
      scheduleFollowUps(data);
    } else {
      Logger.log('TESTMODE: Skipping customer/holger emails and follow-ups');
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Fehler: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =====================================================
// 1. IN GOOGLE SHEET SPEICHERN
// =====================================================
function saveToSheet(data) {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
  
  // Falls Sheet nicht existiert, erstellen
  if (!sheet) {
    const newSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).insertSheet(CONFIG.SHEET_NAME);
    newSheet.appendRow([
      'Datum', 'Firma', 'Ansprechpartner', 'E-Mail', 'Telefon', 
      'Beschreibung', 'Neben Anz.', 'Neben €', 'Haupt Anz.', 'Haupt €',
      'Zwischensumme', 'MwSt', 'Gesamt', 'Status'
    ]);
  }
  
  const row = [
    new Date(data.timestamp),
    data.firma || '',
    data.ansprechpartner || '',
    data.email || '',
    data.telefon || '',
    data.beschreibung || '',
    data.nebenCount || 0,
    data.nebenPreis || 0,
    data.hauptCount || 0,
    data.hauptPreis || 0,
    data.zwischensumme || 0,
    data.mwst || 0,
    data.gesamt || 0,
    data.testMode ? 'Test' : 'Neu'
  ];
  
  SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NAME)
    .appendRow(row);
}

// =====================================================
// 2. PDF-ANGEBOT ERSTELLEN
// =====================================================
function createPDFAngebot(data) {
  // HTML-Template für das Angebot
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 11pt;
          line-height: 1.4;
          margin: 0;
          padding: 40px;
        }
        .header {
          margin-bottom: 40px;
        }
        .absender {
          font-size: 9pt;
          color: #666;
          margin-bottom: 20px;
        }
        .empfaenger {
          margin-bottom: 30px;
        }
        .meta {
          text-align: right;
          margin-bottom: 40px;
          font-size: 10pt;
        }
        h1 {
          font-size: 18pt;
          margin: 40px 0 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        .right {
          text-align: right;
        }
        .total-row {
          background-color: #f9f9f9;
          font-weight: bold;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 9pt;
          color: #666;
        }
        .signature {
          margin: 40px 0 20px 0;
        }
        .checklist {
          margin-top: 40px;
          page-break-before: always;
        }
        .checkbox {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid #333;
          margin-right: 10px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <!-- SEITE 1: ANGEBOT -->
      <div class="absender">
        Holger Grosser - Simonstr. 14 - 90763 Fürth
      </div>
      
      <div class="empfaenger">
        <strong>${data.firma || ''}</strong><br>
        ${data.ansprechpartner ? 'An: ' + data.ansprechpartner + '<br>' : ''}
        ${data.email ? 'E-Mail: ' + data.email + '<br>' : ''}
        ${data.telefon ? 'Tel: ' + data.telefon : ''}
      </div>
      
      <div class="meta">
        Angebotsdatum: ${formatDate(new Date())}<br>
        Gültig: 30 Tage<br>
        Bearbeiter: Holger Grosser<br>
        Telefonnummer: 0911-49522541
      </div>
      
      <h1>Angebot: Bearbeitung von Abweichungen ISO 9001</h1>
      
      <table>
        <thead>
          <tr>
            <th>Artikel</th>
            <th class="right">Anzahl</th>
            <th>Einheit</th>
            <th class="right">E-Preis</th>
            <th class="right">Betrag</th>
          </tr>
        </thead>
        <tbody>
          ${data.nebenCount > 0 ? `
          <tr>
            <td>
              <strong>Nebenabweichungen</strong><br>
              <small>Fachliche Einordnung und Review der geplanten Maßnahmen</small>
            </td>
            <td class="right">${data.nebenCount}</td>
            <td>Anzahl</td>
            <td class="right">${formatCurrency(400)}</td>
            <td class="right">${formatCurrency(data.nebenPreis)}</td>
          </tr>
          ` : ''}
          
          ${data.hauptCount > 0 ? `
          <tr>
            <td>
              <strong>Hauptabweichungen</strong><br>
              <small>Ausführliche Analyse, Ursachenprüfung und Maßnahmen-Review</small>
            </td>
            <td class="right">${data.hauptCount}</td>
            <td>Anzahl</td>
            <td class="right">${formatCurrency(800)}</td>
            <td class="right">${formatCurrency(data.hauptPreis)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
      
      <table>
        <tr>
          <td colspan="4" class="right">Zwischensumme:</td>
          <td class="right">${formatCurrency(data.zwischensumme)}</td>
        </tr>
        <tr>
          <td colspan="4" class="right">MwSt. (19%):</td>
          <td class="right">${formatCurrency(data.mwst)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" class="right">Gesamt (€):</td>
          <td class="right">${formatCurrency(data.gesamt)}</td>
        </tr>
      </table>
      
      <div class="signature">
        Mit freundlichen Grüßen<br><br>
        Holger Grosser<br>
        ------------------------------------------------<br>
        Simonstr. 14<br>
        90763 Fürth<br>
        Der QM-Guru aus Fürth<br>
        Tel. 0911-49522541<br>
        Fax 0911-49522548
      </div>
      
      <div class="footer">
        Holger Grosser • Simonstr. 14 • 90763 Fürth • Deutschland<br>
        Tel.: 0911-49522541 • Fax: 0911-49522548 • E-Mail: Holger.Grosser@QM-Guru.de<br>
        USt-IdNr.: DE225320101 • www.QM-Guru.de<br>
        Stadtsparkasse Fürth • BIC: BYLADEM1SFU • IBAN: DE81762500000000441972
      </div>
      
      <!-- SEITE 2: CHECKLISTE -->
      <div class="checklist">
        <h1>Checkliste: Bearbeitung von Neben- und Hauptabweichungen für ISO 9001</h1>
        
        <p style="margin: 30px 0;">
          Bitte senden Sie mir folgende Informationen nach Beauftragung:
        </p>
        
        <p style="margin: 20px 0;">
          <span class="checkbox"></span> <strong>Abweichungsbericht</strong><br>
          <span style="margin-left: 25px; display: block; color: #666; font-size: 10pt;">
            Der vollständige Bericht des Auditors mit allen festgestellten Abweichungen
          </span>
        </p>
        
        <p style="margin: 20px 0;">
          <span class="checkbox"></span> <strong>Dokumentation oberste Struktur</strong><br>
          <span style="margin-left: 25px; display: block; color: #666; font-size: 10pt;">
            QM-Handbuch, Prozesslandkarte, Organigramm (falls vorhanden)
          </span>
        </p>
        
        <p style="margin: 40px 0; padding: 20px; background-color: #f0f0f0; border-left: 4px solid #2563eb;">
          <strong>Nächste Schritte:</strong><br>
          Ich melde mich nach der ersten Analyse, um das weitere Vorgehen zu besprechen.
        </p>
        
        <div class="footer" style="margin-top: 80px;">
          Holger Grosser • Simonstr. 14 • 90763 Fürth • Deutschland<br>
          Tel.: 0911-49522541 • Fax: 0911-49522548 • E-Mail: Holger.Grosser@QM-Guru.de<br>
          USt-IdNr.: DE225320101 • www.QM-Guru.de<br>
          Stadtsparkasse Fürth • BIC: BYLADEM1SFU • IBAN: DE81762500000000441972
        </div>
      </div>
    </body>
    </html>
  `;
  
  // HTML zu PDF konvertieren
  const blob = Utilities.newBlob(html, 'text/html', 'angebot.html');
  const pdf = blob.getAs('application/pdf');
  pdf.setName(`Angebot_NC-Rescue_${data.firma || 'Kunde'}.pdf`);
  
  return pdf;
}

// =====================================================
// 3. E-MAIL AN KUNDEN (mit PDF)
// =====================================================
function sendCustomerEmail(data, pdfBlob) {
  const subject = '✅ Ihr Angebot für ISO 9001 Abweichungs-Unterstützung';
  
  const body = `
Guten Tag${data.ansprechpartner ? ' ' + data.ansprechpartner : ''},

vielen Dank für Ihre Anfrage über NC-Rescue.

Im Anhang finden Sie Ihr persönliches Angebot:
• ${data.nebenCount > 0 ? data.nebenCount + '× Nebenabweichungen' : ''}
${data.nebenCount > 0 && data.hauptCount > 0 ? '• ' : ''}${data.hauptCount > 0 ? data.hauptCount + '× Hauptabweichungen' : ''}

Gesamtpreis: ${formatCurrency(data.gesamt)} (inkl. MwSt.)

NÄCHSTE SCHRITTE:
Nach Ihrer Beauftragung benötige ich:
1. Den Abweichungsbericht des Auditors
2. Ihre QM-Dokumentation (Handbuch, Prozesse)

Ich melde mich dann innerhalb von 24 Stunden für eine erste Einschätzung bei Ihnen.

Bei Fragen erreichen Sie mich jederzeit:
📞 ${CONFIG.COMPANY_PHONE}
📧 ${CONFIG.COMPANY_EMAIL}

Mit freundlichen Grüßen
Holger Grosser

---
${CONFIG.COMPANY_NAME}
${CONFIG.COMPANY_ADDRESS}
${CONFIG.COMPANY_WEB}
`;

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body,
    attachments: [pdfBlob]
  });
}

// =====================================================
// 4. BENACHRICHTIGUNG AN HOLGER
// =====================================================
function sendNotificationToHolger(data) {
  const subject = '🔔 Neue NC-Rescue Anfrage';
  
  const body = `
Neue Anfrage über NC-Rescue:

KUNDE:
Firma: ${data.firma || '-'}
Ansprechpartner: ${data.ansprechpartner || '-'}
E-Mail: ${data.email}
Telefon: ${data.telefon || '-'}

ABWEICHUNGEN:
Nebenabweichungen: ${data.nebenCount} (${formatCurrency(data.nebenPreis)})
Hauptabweichungen: ${data.hauptCount} (${formatCurrency(data.hauptPreis)})
Gesamt: ${formatCurrency(data.gesamt)} (inkl. MwSt.)

BESCHREIBUNG:
${data.beschreibung || 'Keine Beschreibung angegeben'}

Das Angebot wurde automatisch per E-Mail an den Kunden versendet.
Nächste Schritte: Auf Abweichungsbericht und Dokumentation warten.

---
Gesendet: ${formatDateTime(new Date())}
`;

  MailApp.sendEmail({
    to: CONFIG.EMAIL_HOLGER,
    subject: subject,
    body: body
  });
}

// =====================================================
// 5. FOLLOW-UP E-MAILS EINPLANEN
// =====================================================
function scheduleFollowUps(data) {
  const props = PropertiesService.getScriptProperties();
  
  // Follow-up Daten speichern
  const followUpData = {
    email: data.email,
    firma: data.firma,
    ansprechpartner: data.ansprechpartner,
    timestamp: new Date().getTime(),
    sent1: false,
    sent2: false,
    sent4: false
  };
  
  props.setProperty('followup_' + data.email, JSON.stringify(followUpData));
}

// Diese Funktion als Timer-Trigger einrichten (täglich ausführen)
function checkAndSendFollowUps() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  const now = new Date().getTime();
  
  for (const key in allProps) {
    if (key.startsWith('followup_')) {
      const data = JSON.parse(allProps[key]);
      const daysSince = (now - data.timestamp) / (1000 * 60 * 60 * 24);
      
      // Tag 1 Follow-up
      if (daysSince >= 1 && daysSince < 2 && !data.sent1) {
        sendFollowUpEmail(data, 1);
        data.sent1 = true;
        props.setProperty(key, JSON.stringify(data));
      }
      
      // Tag 2 Follow-up
      if (daysSince >= 2 && daysSince < 3 && !data.sent2) {
        sendFollowUpEmail(data, 2);
        data.sent2 = true;
        props.setProperty(key, JSON.stringify(data));
      }
      
      // Tag 4 Follow-up
      if (daysSince >= 4 && daysSince < 5 && !data.sent4) {
        sendFollowUpEmail(data, 4);
        data.sent4 = true;
        props.setProperty(key, JSON.stringify(data));
      }
      
      // Nach 7 Tagen: Daten löschen
      if (daysSince > 7) {
        props.deleteProperty(key);
      }
    }
  }
}

function sendFollowUpEmail(data, day) {
  const subjects = {
    1: 'Kurze Nachfrage zu Ihrer ISO-9001-Anfrage',
    2: 'Benötigen Sie noch Unterstützung bei Ihrer Abweichung?',
    4: 'Letzte Erinnerung: Ihre ISO-9001-Abweichung'
  };
  
  const bodies = {
    1: `
Guten Tag${data.ansprechpartner ? ' ' + data.ansprechpartner : ''},

gestern haben Sie über NC-Rescue ein Angebot für die Bearbeitung Ihrer ISO-9001-Abweichung angefragt.

Falls Sie Fragen haben oder das Angebot nicht erhalten haben, melden Sie sich gerne bei mir.

Mit freundlichen Grüßen
Holger Grosser
Tel: ${CONFIG.COMPANY_PHONE}
`,
    2: `
Guten Tag${data.ansprechpartner ? ' ' + data.ansprechpartner : ''},

haben Sie bereits eine Entscheidung bezüglich der Unterstützung bei Ihrer ISO-9001-Abweichung getroffen?

Ich stehe Ihnen gerne für Rückfragen zur Verfügung.

Mit freundlichen Grüßen
Holger Grosser
Tel: ${CONFIG.COMPANY_PHONE}
`,
    4: `
Guten Tag${data.ansprechpartner ? ' ' + data.ansprechpartner : ''},

dies ist eine letzte freundliche Erinnerung zu Ihrer Anfrage.

Falls Sie keine Unterstützung mehr benötigen, ist das natürlich kein Problem. 
Ansonsten freue ich mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Holger Grosser
Tel: ${CONFIG.COMPANY_PHONE}
`
  };
  
  MailApp.sendEmail({
    to: data.email,
    subject: subjects[day],
    body: bodies[day]
  });
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateTime(date) {
  const d = new Date(date);
  return formatDate(d) + ' ' + d.toLocaleTimeString('de-DE');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// =====================================================
// INTERNALS
// =====================================================
function isTestMode_(data, e) {
  const fromBody = data && (data.testMode === true || data.testMode === 'true' || data.testMode === 1 || data.testMode === '1');
  const params = (e && e.parameter) ? e.parameter : {};
  const fromQuery = params.test === '1' || params.test === 'true' || params.testMode === '1' || params.testMode === 'true';
  return Boolean(fromBody || fromQuery);
}
