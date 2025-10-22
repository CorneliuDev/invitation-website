
/* Invitatie Personalizata, prelucrare url */
async function displayGuestNames() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestKey = urlParams.get('guest'); // "eriomenco", etc.

  try {
    const response = await fetch('/guests.json'); // adjust path if needed
    const guests = await response.json();

    // Use guestKey here
    const invited = guests[guestKey] || ['Guest'];
    document.getElementById('guest-names').textContent += ' ' + invited.join(', ');

  } catch (err) {
    console.error('Failed to load guest list:', err);
    document.getElementById('guest-names').textContent = 'Welcome!';
  }
}

displayGuestNames();




/* Trimite datele din formular in google sheets si telegram bot */

document.getElementById('rsvp-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;
    const bauturi = Array.from(form.querySelectorAll('input[name="bauturi"]:checked')).map(i => i.value);

    const data = {
        nume: form.nume.value,
        veniti: form.veniti.value,
        numar: form.numar.value,
        bauturi: bauturi,
        nota: form.nota.value
    };

    // Point to your Netlify Function endpoint
    const netlifyFunctionURL = '/.netlify/functions/submit-rsvp'; // This path is standard for Netlify Functions

    try {
        const response = await fetch(netlifyFunctionURL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            console.log("Success:", result.message);
            form.reset();
        } else {
            console.error("Error from function:", result.message);
            console.error("Details:", result.details);
        }

    } catch (err) {
        console.error('Network Error:', err);
        alert('A apărut o eroare de rețea. Vă rugăm să încercați din nou.');
    }
});