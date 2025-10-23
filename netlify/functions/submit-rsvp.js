// netlify/functions/submit-rsvp.js

// Your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwpeMkVM8dlfmHuRk2yAYP8-B6Kq-y0LMaQcvJrtb_ORA09JVf6mmMkHmcz0foA1Y3h/exec";
// Your actual Telegram bot token and chat ID
const TELEGRAM_BOT_TOKEN = "8279901342:AAG25QUhvg1hvD2zzXbUA-fxSdJHbusEtnY";
const TELEGRAM_CHAT_ID = "-1003160404855";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Helper function to convert JSON object to URL-encoded string
function toUrlEncoded(obj) {
  const pairs = [];
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = Array.isArray(obj[key]) ? obj[key].join(',') : obj[key];
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
  }
  return pairs.join('&');
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  try {
    const requestBody = JSON.parse(event.body);

    // --- Step 1: Send data to Google Apps Script ---
    let sheetsSuccess = false;
    try {
      const urlEncodedData = toUrlEncoded(requestBody);
console.log("RSVP received:", requestBody);

      const sheetsRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlEncodedData,
      });

      // If we get ANY response (even non-JSON), consider it a success
      // because you confirmed the data is reaching Google Sheets
      if (sheetsRes.ok || sheetsRes.status === 200 || sheetsRes.status === 302) {
        sheetsSuccess = true;
        console.log("Google Sheets: Data sent successfully (status:", sheetsRes.status, ")");
      } else {
        console.log("Google Sheets: Unexpected status:", sheetsRes.status);
        // Still mark as success if status is in 200-399 range
        sheetsSuccess = sheetsRes.status >= 200 && sheetsRes.status < 400;
      }
    } catch (error) {
      console.error('Error calling Google Apps Script:', error);
      // Don't fail the whole operation - Sheets might still have received it
      sheetsSuccess = false;
    }

    // --- Step 2: Send data to Telegram (ALWAYS try, regardless of Sheets response) ---
    let telegramSuccess = false;
    try {
      const telegramMessage = `
📩 RSVP nou:
URL: ${requestBody.guest}
Nume: ${requestBody.nume}
Participare: ${requestBody.veniti == 'da' ? '✅' : '🚫'}
Număr persoane: ${requestBody.numar}
Băuturi: ${(requestBody.bauturi || []).join(', ') || 'N/A'}
Notă: ${requestBody.nota || 'N/A'}
      `.trim();

      const telegramRes = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
        }),
      });

      const telegramResult = await telegramRes.json();

      if (telegramRes.ok && telegramResult.ok) {
        telegramSuccess = true;
        console.log("Telegram: Message sent successfully");
      } else {
        console.error("Telegram API Error:", telegramResult.description || 'Unknown error');
      }
    } catch (error) {
      console.error('Error calling Telegram API:', error);
    }

    // --- Step 3: Return success response ---
    // We'll return success as long as we attempted to send to both services
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Datele au fost trimise cu succes!',
        details: {
          sheets: sheetsSuccess ? 'Trimis' : 'Posibil trimis',
          telegram: telegramSuccess ? 'Trimis' : 'Eroare la trimitere'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };

  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        message: 'A apărut o eroare. Vă rugăm să încercați din nou.' 
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};