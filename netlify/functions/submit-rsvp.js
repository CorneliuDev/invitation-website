// netlify/functions/submit-rsvp.js

// Your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8hIG0LxS7X84LcHUJWZyPtnxdFGJ-gUcA-GUeApJD-TrrQ282CugVGgFudRmWrKTS/exec";
// Your actual Telegram bot token and chat ID
const TELEGRAM_BOT_TOKEN = "8279901342:AAG25QUhvg1hvD2zzXbUA-fxSdJHbusEtnY";
const TELEGRAM_CHAT_ID = "-4862293355";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Helper function to convert JSON object to URL-encoded string
function toUrlEncoded(obj) {
  const pairs = [];
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Handle arrays (like bauturi) by joining them with a separator or just taking the first value if not intended as array
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

    // --- Step 1: Send data to Google Apps Script using URL encoding ---
    let sheetsResponse = { status: 'pending', success: false, message: '' };
    try {
      const urlEncodedData = toUrlEncoded(requestBody); // Convert to URL-encoded format

      const sheetsRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Important!
        },
        body: urlEncodedData, // Send URL-encoded body
      });

      const responseBodyText = await sheetsRes.text(); // Get response as text first
      console.log("Raw response from Apps Script:", responseBodyText); // Log for debugging

      let sheetsResult;
      try {
        sheetsResult = JSON.parse(responseBodyText); // Attempt to parse as JSON
      } catch (jsonError) {
        console.error("Error parsing Apps Script response as JSON:", jsonError);
        console.error("Raw response was:", responseBodyText);
        throw new Error(`Apps Script returned non-JSON response: ${responseBodyText}`);
      }

      if (sheetsRes.ok && sheetsResult.status === 'success') {
        sheetsResponse.success = true;
        sheetsResponse.message = sheetsResult.message || 'Datele au fost adăugate.';
      } else {
        sheetsResponse.message = `Google Sheets Error: ${sheetsResult.message || 'Unknown error'}`;
      }
    } catch (error) {
      console.error('Error calling Google Apps Script:', error);
      sheetsResponse.message = `Google Sheets Network Error: ${error.message}`;
    }

    // --- Step 2: Send data to Telegram (only if Sheets was successful) ---
    let telegramResponse = { status: 'pending', success: false, message: '' };
    if (sheetsResponse.success) {
      try {
        const telegramMessage = `
📩 RSVP nou:
Nume: ${requestBody.nume}
Veti veni?: ${requestBody.veniti}
Numar persoane: ${requestBody.numar}
Bauturi: ${(requestBody.bauturi || []).join(', ') || 'N/A'}
Nota: ${requestBody.nota || 'N/A'}
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
          telegramResponse.success = true;
          telegramResponse.message = 'Telegram message sent.';
        } else {
          telegramResponse.message = `Telegram API Error: ${telegramResult.description || 'Unknown error'}`;
        }
      } catch (error) {
        console.error('Error calling Telegram API:', error);
        telegramResponse.message = `Telegram Network Error: ${error.message}`;
      }
    } else {
      telegramResponse.message = 'Skipped Telegram (Sheets failed)';
    }

    // --- Step 3: Return the result to the frontend ---
    const overallSuccess = sheetsResponse.success;
    const responseMessage = overallSuccess
      ? 'Datele au fost trimise cu succes!'
      : `Eroare: ${sheetsResponse.message}. Telegram: ${telegramResponse.message}`;

    return {
      statusCode: overallSuccess ? 200 : 500,
      body: JSON.stringify({
        success: overallSuccess,
        message: responseMessage,
        details: {
          sheets: sheetsResponse,
          telegram: telegramResponse,
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
      body: JSON.stringify({ success: false, message: 'Internal Server Error in Function' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};