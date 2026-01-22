// =====================================================
// ISO 9001 Abweichungen: Einschätzung vom Profi - GOOGLE APPS SCRIPT BACKEND
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
          /* Fußzeile kompakter & höher (erste Zeile näher an die Trennlinie) */
          margin-top: 28px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
          font-size: 9pt;
          line-height: 1.25;
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
        USt-IdNr.: DE225320101 • www.QM-Guru.de • Stadtsparkasse Fürth • BIC: BYLADEM1SFU • IBAN: DE81762500000000441972
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
        
        <div class="footer" style="margin-top: 60px;">
          Holger Grosser • Simonstr. 14 • 90763 Fürth • Deutschland<br>
          Tel.: 0911-49522541 • Fax: 0911-49522548 • E-Mail: Holger.Grosser@QM-Guru.de<br>
          USt-IdNr.: DE225320101 • www.QM-Guru.de • Stadtsparkasse Fürth • BIC: BYLADEM1SFU • IBAN: DE81762500000000441972
        </div>
      </div>
    </body>
    </html>
  `;
  
  // HTML zu PDF konvertieren
  const blob = Utilities.newBlob(html, 'text/html', 'angebot.html');
  const pdf = blob.getAs('application/pdf');
  pdf.setName(`Angebot_ISO9001-Abweichungen_Einschaetzung-vom-Profi_${data.firma || 'Kunde'}.pdf`);
  
  return pdf;
}

// =====================================================
// 3. E-MAIL AN KUNDEN (mit PDF)
// =====================================================
function sendCustomerEmail(data, pdfBlob) {
  const subject = 'Ihr Angebot: ISO 9001 Abweichungen – Einschätzung vom Profi (PDF im Anhang)';

  const items = [];
  if (data.nebenCount > 0) items.push(`${data.nebenCount}× Nebenabweichung(en)`);
  if (data.hauptCount > 0) items.push(`${data.hauptCount}× Hauptabweichung(en)`);
  const itemsText = items.length ? items.join(' + ') : 'Abweichungen';
  const anrede = data.ansprechpartner ? `Guten Tag ${data.ansprechpartner},` : 'Guten Tag,';
  const firmaLine = data.firma ? ` (${data.firma})` : '';

  const mailtoSubject = encodeURIComponent(`Beauftragung ISO 9001 Abweichungen – Einschätzung vom Profi – ${data.firma || data.email}`);
  const mailtoBody = encodeURIComponent(
    `Hallo Holger,\n\n` +
    `hiermit beauftragen wir die Unterstützung „ISO 9001 Abweichungen: Einschätzung vom Profi“ gemäß Angebot (PDF im Anhang).\n\n` +
    `Firma: ${data.firma || '-'}\n` +
    `Ansprechpartner: ${data.ansprechpartner || '-'}\n` +
    `E-Mail: ${data.email || '-'}\n` +
    `Telefon: ${data.telefon || '-'}\n\n` +
    `Umfang: ${itemsText}\n` +
    `Festpreis: ${formatCurrency(data.gesamt)} (inkl. MwSt.)\n\n` +
    `Bitte kurze Rückmeldung zum weiteren Vorgehen.\n\n` +
    `Viele Grüße`
  );
  const mailtoHref = `mailto:${CONFIG.COMPANY_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

  const bodyText = `${anrede}

vielen Dank für Ihre Anfrage. Im Anhang erhalten Sie Ihr persönliches Angebot als PDF.

Kurzüberblick${firmaLine}:
- Umfang: ${itemsText}
- Festpreis: ${formatCurrency(data.gesamt)} (inkl. MwSt.)

Warum „ISO 9001 Abweichungen: Einschätzung vom Profi“:
- Audit-sichere Einordnung (Normkontext & Auditorenblick)
- Klare Ursachenlogik statt "Aktionismus"
- Maßnahmen-Review: angemessen, wirksam, prüffähig

So geht’s weiter (wenn Sie starten möchten):
1) Abweichungsbericht des Auditors
2) Relevante QM-Dokumente (z.B. Handbuch/Prozesse)

Ich melde mich i.d.R. innerhalb von 24 Stunden mit der ersten Einschätzung und dem konkreten Vorgehen.

Jetzt beauftragen (einfach kurz antworten: "Bitte starten"):
${mailtoHref}

Rückfragen:
Tel.: ${CONFIG.COMPANY_PHONE}
E-Mail: ${CONFIG.COMPANY_EMAIL}

Mit freundlichen Grüßen
Holger Grosser

${CONFIG.COMPANY_NAME}
${CONFIG.COMPANY_ADDRESS}
${CONFIG.COMPANY_WEB}`;

  const htmlBody = `
  <div style="font-family: Arial, sans-serif; color:#0f172a; line-height:1.5; font-size:14px;">
    <div style="max-width:720px; margin:0 auto; padding:24px;">
      <div style="border:1px solid #e2e8f0; border-radius:14px; padding:18px 18px 14px; background:#ffffff;">
        <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">ISO 9001 Abweichungen: Einschätzung vom Profi</div>
        <h2 style="margin:10px 0 6px; font-size:20px;">Schnelle, audit-sichere Unterstützung bei ISO&nbsp;9001 Abweichungen</h2>
        <p style="margin:0 0 14px; color:#334155;">${anrede.replace(',', '')} – im Anhang finden Sie Ihr persönliches Angebot als PDF.</p>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin:14px 0 8px;">
          <div style="flex:1; min-width:220px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
            <div style="color:#64748b; font-size:12px;">Umfang</div>
            <div style="font-weight:700; font-size:14px;">${itemsText}${data.firma ? ` <span style="color:#64748b; font-weight:500;">(${data.firma})</span>` : ''}</div>
          </div>
          <div style="flex:1; min-width:220px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:12px;">
            <div style="color:#2563eb; font-size:12px;">Festpreis</div>
            <div style="font-weight:800; font-size:18px; color:#1d4ed8;">${formatCurrency(data.gesamt)} <span style="font-size:12px; font-weight:600; color:#2563eb;">inkl. MwSt.</span></div>
          </div>
        </div>

        <div style="margin:14px 0 10px;">
          <div style="font-weight:700; margin-bottom:6px;">Warum „ISO 9001 Abweichungen: Einschätzung vom Profi“</div>
          <ul style="margin:0; padding-left:18px; color:#334155;">
            <li>Audit-sichere Einordnung im Normkontext (inkl. Auditorenblick)</li>
            <li>Ursachenlogik, die hält – statt reiner Symptombekämpfung</li>
            <li>Maßnahmen-Review: angemessen, wirksam, prüffähig dokumentiert</li>
          </ul>
        </div>

        <div style="margin:14px 0 0; padding:12px; border-radius:12px; border:1px solid #e2e8f0; background:#ffffff;">
          <div style="font-weight:700; margin-bottom:6px;">Nächste Schritte</div>
          <ol style="margin:0; padding-left:18px; color:#334155;">
            <li>Abweichungsbericht des Auditors</li>
            <li>Relevante QM-Dokumente (z.B. Handbuch / Prozesse)</li>
          </ol>
          <p style="margin:10px 0 0; color:#334155;">Ich melde mich i.d.R. innerhalb von 24 Stunden mit der ersten Einschätzung und dem konkreten Vorgehen.</p>
        </div>

        <div style="margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0; color:#334155;">
          <div style="font-weight:700;">Direkt starten oder Rückfragen</div>
          <div style="margin:10px 0 12px;">
            <a href="${mailtoHref}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:700;">Jetzt beauftragen</a>
            <span style="display:inline-block; width:10px;"></span>
            <a href="tel:${CONFIG.COMPANY_PHONE}" style="display:inline-block; background:#f8fafc; color:#0f172a; text-decoration:none; padding:10px 14px; border-radius:10px; border:1px solid #e2e8f0; font-weight:700;">Kurz anrufen</a>
          </div>
          <div>Tel.: <a style="color:#2563eb; text-decoration:none;" href="tel:${CONFIG.COMPANY_PHONE}">${CONFIG.COMPANY_PHONE}</a> &nbsp;•&nbsp; E-Mail: <a style="color:#2563eb; text-decoration:none;" href="mailto:${CONFIG.COMPANY_EMAIL}">${CONFIG.COMPANY_EMAIL}</a></div>
          <div style="margin-top:8px; color:#64748b; font-size:12px;">${CONFIG.COMPANY_NAME} • ${CONFIG.COMPANY_ADDRESS.replace(/\n/g, ' • ')} • <a style="color:#64748b; text-decoration:none;" href="https://${CONFIG.COMPANY_WEB}">${CONFIG.COMPANY_WEB}</a></div>
        </div>
      </div>
    </div>
  </div>`;

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: bodyText,
    htmlBody: htmlBody,
    attachments: [pdfBlob]
  });
}

// =====================================================
// 4. BENACHRICHTIGUNG AN HOLGER
// =====================================================
function sendNotificationToHolger(data) {
  const subject = `Neue Anfrage (ISO 9001 Abweichungen): ${data.firma || data.email}`;

  const body = `
Neue Anfrage: ISO 9001 Abweichungen

Kontakt:
- Firma: ${data.firma || '-'}
- Ansprechpartner: ${data.ansprechpartner || '-'}
- E-Mail: ${data.email}
- Telefon: ${data.telefon || '-'}

Umfang & Preis:
- Nebenabweichungen: ${data.nebenCount} (${formatCurrency(data.nebenPreis)})
- Hauptabweichungen: ${data.hauptCount} (${formatCurrency(data.hauptPreis)})
- Gesamt: ${formatCurrency(data.gesamt)} (inkl. MwSt.)

Beschreibung:
${data.beschreibung || '-'}

Hinweis: Angebot (PDF) wurde automatisch an den Kunden versendet.
Zeitstempel: ${formatDateTime(new Date())}
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

  const anrede = data.ansprechpartner ? `Guten Tag ${data.ansprechpartner},` : 'Guten Tag,';
  const mailtoSubject = encodeURIComponent(`Beauftragung ISO 9001 Abweichungen – Einschätzung vom Profi – ${data.firma || data.email}`);
  const mailtoBody = encodeURIComponent(
    `Hallo Holger,\n\n` +
    `hiermit beauftragen wir die Unterstützung „ISO 9001 Abweichungen: Einschätzung vom Profi“. Bitte senden Sie mir die nächsten Schritte / benötigten Unterlagen.\n\n` +
    `Firma: ${data.firma || '-'}\n` +
    `Ansprechpartner: ${data.ansprechpartner || '-'}\n` +
    `E-Mail: ${data.email || '-'}\n\n` +
    `Viele Grüße`
  );
  const mailtoHref = `mailto:${CONFIG.COMPANY_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

  const textBlocks = {
    1: {
      intro: 'gestern haben Sie ein Angebot für die Bearbeitung Ihrer ISO-9001-Abweichung angefragt.',
      ask: 'Wenn Sie starten möchten, antworten Sie einfach kurz mit „Bitte starten“ – ich melde mich dann i.d.R. innerhalb von 24 Stunden mit der ersten Einschätzung.'
    },
    2: {
      intro: 'kurze Rückfrage zu Ihrer Anfrage: Haben Sie sich schon entschieden, ob Sie Unterstützung bei der ISO-9001-Abweichung möchten?',
      ask: 'Wenn Sie möchten, starten wir direkt: kurze Antwort mit „Bitte starten“ genügt.'
    },
    4: {
      intro: 'letzte kurze Erinnerung zu Ihrer Anfrage.',
      ask: 'Wenn das Thema erledigt ist, passt das natürlich. Falls Sie noch Unterstützung möchten, genügt eine kurze Antwort mit „Bitte starten“.'
    }
  };

  const bodyText = `${anrede}

${textBlocks[day].intro}

${textBlocks[day].ask}

Jetzt beauftragen:
${mailtoHref}

Rückfragen:
Tel.: ${CONFIG.COMPANY_PHONE}
E-Mail: ${CONFIG.COMPANY_EMAIL}

Mit freundlichen Grüßen
Holger Grosser

${CONFIG.COMPANY_NAME}
${CONFIG.COMPANY_ADDRESS}
${CONFIG.COMPANY_WEB}`;

  const htmlBody = `
  <div style="font-family: Arial, sans-serif; color:#0f172a; line-height:1.5; font-size:14px;">
    <div style="max-width:720px; margin:0 auto; padding:24px;">
      <div style="border:1px solid #e2e8f0; border-radius:14px; padding:18px 18px 14px; background:#ffffff;">
        <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">ISO 9001 Abweichungen: Einschätzung vom Profi</div>
        <h2 style="margin:10px 0 6px; font-size:18px;">Kurze Rückfrage zu Ihrer Anfrage</h2>
        <p style="margin:0 0 12px; color:#334155;">${anrede.replace(',', '')}</p>
        <p style="margin:0 0 12px; color:#334155;">${textBlocks[day].intro}</p>
        <p style="margin:0 0 14px; color:#334155;">${textBlocks[day].ask}</p>

        <div style="margin:12px 0 10px; padding:12px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc;">
          <div style="font-weight:700; margin-bottom:8px;">Direkt starten</div>
          <a href="${mailtoHref}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:700;">Jetzt beauftragen</a>
          <span style="display:inline-block; width:10px;"></span>
          <a href="tel:${CONFIG.COMPANY_PHONE}" style="display:inline-block; background:#ffffff; color:#0f172a; text-decoration:none; padding:10px 14px; border-radius:10px; border:1px solid #e2e8f0; font-weight:700;">Kurz anrufen</a>
          <div style="margin-top:10px; color:#64748b; font-size:12px;">Oder antworten Sie einfach auf diese E-Mail mit „Bitte starten“.</div>
        </div>

        <div style="margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0; color:#334155;">
          <div>Tel.: <a style="color:#2563eb; text-decoration:none;" href="tel:${CONFIG.COMPANY_PHONE}">${CONFIG.COMPANY_PHONE}</a> &nbsp;•&nbsp; E-Mail: <a style="color:#2563eb; text-decoration:none;" href="mailto:${CONFIG.COMPANY_EMAIL}">${CONFIG.COMPANY_EMAIL}</a></div>
          <div style="margin-top:8px; color:#64748b; font-size:12px;">${CONFIG.COMPANY_NAME} • ${CONFIG.COMPANY_ADDRESS.replace(/\n/g, ' • ')} • <a style="color:#64748b; text-decoration:none;" href="https://${CONFIG.COMPANY_WEB}">${CONFIG.COMPANY_WEB}</a></div>
        </div>
      </div>
    </div>
  </div>`;

  MailApp.sendEmail({
    to: data.email,
    subject: subjects[day],
    body: bodyText,
    htmlBody: htmlBody
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
