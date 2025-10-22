import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body);

    // 1. Send data to Google Sheets via Apps Script
    const googleScriptURL = "https://script.google.com/macros/s/AKfycbw8hIG0LxS7X84LcHUJWZyPtnxdFGJ-gUcA-GUeApJD-TrrQ282CugVGgFudRmWrKTS/exec";

    const resSheets = await fetch(googleScriptURL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // send as plain text to avoid preflight
      body: JSON.stringify(data)
    });

    const resultSheets = JSON.parse(await resSheets.text());

    if (resultSheets.status !== "success") {
      throw new Error(resultSheets.message || "Google Sheets error");
    }

    // 2. Send notification to Telegram
    const telegramURL = "https://api.telegram.org/bot8279901342:AAG25QUhvg1hvD2zzXbUA-fxSdJHbusEtnY/sendMessage";

    const telegramMessage = `
📩 RSVP nou:
Nume: ${data.nume}
Veti veni?: ${data.veniti}
Numar persoane: ${data.numar}
Bauturi: ${(data.bauturi || []).join(", ")}
Nota: ${data.nota || "-"}
`;

    await fetch(telegramURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: -4862293355, text: telegramMessage })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success", message: "RSVP trimis cu succes" })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ status: "error", message: err.message }) };
  }
}
