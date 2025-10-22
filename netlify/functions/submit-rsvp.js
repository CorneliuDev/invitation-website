// netlify/functions/submit-rsvp.js

// Your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8hIG0LxS7X84LcHUJWZyPtnxdFGJ-gUcA-GUeApJD-TrrQ282CugVGgFudRmWrKTS/exec";

// Your actual Telegram bot token and chat ID
const TELEGRAM_BOT_TOKEN = "8279901342:AAG25QUhvg1hvD2zzXbUA-fxSdJHbusEtnY"; // Keep this secret!
const TELEGRAM_CHAT_ID = "-4862293355"; // Keep this secret!
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

exports.handler = async (event, context) => {
  // Only allow POST requests
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
    // Parse the incoming JSON data from the frontend
    const requestBody = JSON.parse(event.body);

    // --- Step 1: Send data to Google Apps Script ---
    let sheetsResponse = { status: 'pending', success: false, message: '' };
    try {
      const sheetsRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), // Send the raw data to Apps Script
      });

      const sheetsResult = await sheetsRes.json();

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
            // parse_mode: 'HTML', // Optional: if you want HTML formatting
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
    const overallSuccess = sheetsResponse.success; // Consider overall success based on Sheets
    const responseMessage = overallSuccess
      ? 'Datele au fost trimise cu succes!'
      : `Eroare: ${sheetsResponse.message}. Telegram: ${telegramResponse.message}`;

    return {
      statusCode: overallSuccess ? 200 : 500, // 200 for success, 500 for failure
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
        // Optional: Add CORS headers if needed for frontend calls (though less critical if same origin)
        // 'Access-Control-Allow-Origin': '*', // Uncomment if needed, but be cautious in production
        // 'Access-Control-Allow-Methods': 'POST',
        // 'Access-Control-Allow-Headers': 'Content-Type',
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