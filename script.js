
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
    document.body.classList.add('loading');
    const form = e.target;
    const bauturi = Array.from(form.querySelectorAll('input[name="bauturi"]:checked')).map(i => i.value);
    const urlParams = new URLSearchParams(window.location.search);
    const guest = urlParams.get("guest") || "unknown";

    const data = {
        guest: guest,
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
            form.innerHTML = '<p class="form__success">Răspunsul a fost trimis cu succes!</p>';
        } else {
            console.error("Error from function:", result.message);
            console.error("Details:", result.details);
        }
        

    
    } catch (err) {
        console.error('Network Error:', err);
        alert('A apărut o eroare de rețea. Vă rugăm să încercați din nou.');
    } finally {
        document.body.classList.remove('loading');
    }
});



// Countdown
function countdown(targetDate) {
  const countdownElement = document.querySelector('[data-countdown]');
  
  if (!countdownElement) {
    console.error('Element with data-countdown attribute not found');
    return;
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      countdownElement.innerHTML = `
        <div style="font-variant-numeric: tabular-nums;" class="info__countdown">
          <div class="info__countdown-item">00 zile</div>
          <div class="info__countdown-item">00 ore</div>
          <div class="info__countdown-item">00 minute</div>
          <div class="info__countdown-item">00 secunde</div>
        </div>
      `;
      clearInterval(interval);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Pad numbers with leading zeros for consistent width
    const d = String(days).padStart(2, '0');
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    countdownElement.innerHTML = `
      <div style="font-variant-numeric: tabular-nums;" class="info__countdown">
        <div class="info__countdown-item">${d} zile</div>
        <div class="info__countdown-item">${h} ore</div>
        <div class="info__countdown-item">${m} minute</div>
        <div class="info__countdown-item info__countdown-item--seconds">
            <div class="info__countdown-item--seconds-number"><span>${s} </span></div>
            <span class="info__countdown-item--seconds-text">secunde</span>
            </div>
      </div>
    `;
  }

  // Update immediately, then every second
  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
}

// Usage:
countdown('2026-05-16 00:00:00');

AOS.init();



document.addEventListener('DOMContentLoaded', function () {
    const radioVeni = document.querySelectorAll('input[name="veniti"]');
    const numarPersoaneInput = document.getElementById('numar');

    // Function to update the number field based on radio selection
    function updateNumarPersoane() {
        if (radioVeni[1].checked) {  // "Nu, nu voi veni" is selected
            numarPersoaneInput.value = '0';
            numarPersoaneInput.setAttribute('readonly', 'readonly'); // optional: prevent editing
            numarPersoaneInput.style.opacity = '0.6';                // visual feedback
        } else if (radioVeni[0].checked) { // "Da, voi veni" is selected
            numarPersoaneInput.value = '';     // clear the field
            numarPersoaneInput.removeAttribute('readonly');
            numarPersoaneInput.style.opacity = '1';
            numarPersoaneInput.focus();        // nice UX: focus so they can type immediately
        }
    }

    // Listen to any change on the "Veti veni?" radios
    radioVeni.forEach(radio => {
        radio.addEventListener('change', updateNumarPersoane);
    });

    // Run once on page load in case a radio is pre-selected
    updateNumarPersoane();
});