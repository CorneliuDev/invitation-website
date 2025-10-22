/* Invitatie Personalizata, prelucrare url */
async function displayGuestNames() {
	const urlParams = new URLSearchParams(window.location.search);
	const guestKey = urlParams.get("guest"); // "eriomenco", etc.

	try {
		const response = await fetch("/guests.json"); // adjust path if needed
		const guests = await response.json();

		// Use guestKey here
		const invited = guests[guestKey] || ["Guest"];
		document.getElementById("guest-names").textContent +=
			" " + invited.join(", ");
	} catch (err) {
		console.error("Failed to load guest list:", err);
		document.getElementById("guest-names").textContent = "Welcome!";
	}
}

displayGuestNames();

/* Trimite datele din formular in google sheets si telegram bot */

document
	.getElementById("rsvp-form")
	.addEventListener("submit", async function (e) {
		e.preventDefault();

		const form = e.target;
		const bauturi = Array.from(
			form.querySelectorAll('input[name="bauturi"]:checked')
		).map((i) => i.value);

		const data = {
			nume: form.nume.value,
			veniti: form.veniti.value,
			numar: form.numar.value,
			bauturi: bauturi,
			nota: form.nota.value,
		};

		const googleScriptURL =
			"https://script.google.com/macros/s/AKfycbw8hIG0LxS7X84LcHUJWZyPtnxdFGJ-gUcA-GUeApJD-TrrQ282CugVGgFudRmWrKTS/exec";

		// aici pune link-ul de la App Script
		// daca folosesti chors intra mai intai pe https://cors-anywhere.herokuapp.com/corsdemo, activeaza si adauga https://cors-anywhere.herokuapp.com/ inaintea linkului

		const telegramURL =
			"https://api.telegram.org/bot8279901342:AAG25QUhvg1hvD2zzXbUA-fxSdJHbusEtnY/sendMessage";

		try {
			const resSheets = await fetch(googleScriptURL, {
				method: "POST",
				headers: { "Content-Type": "text/plain" }, // <- plain text
				body: JSON.stringify(data),
			});

			const resultSheets = JSON.parse(await resSheets.text()); // <- parse the text manually

			if (resultSheets.status !== "success") {
				throw new Error(
					resultSheets.message || "Google Sheets a returnat eroare"
				);
			}

			const telegramMessage = `
📩 RSVP nou:
Nume: ${data.nume}
Veti veni?: ${data.veniti}
Numar persoane: ${data.numar}
Bauturi: ${data.bauturi.join(", ")}
Nota: ${data.nota || "-"}
        `;

			const resTelegram = await fetch(telegramURL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: -4862293355,
					text: telegramMessage,
				}),
			});

			if (!resTelegram.ok) {
				throw new Error("Eroare la trimiterea mesajului pe Telegram");
			}

			form.reset();
		} catch (err) {
			console.error(err);
		}
	});
