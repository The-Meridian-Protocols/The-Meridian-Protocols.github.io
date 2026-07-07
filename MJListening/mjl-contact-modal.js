/* ============================================================
   M.J.'s Listening Sessions — Contact Modal
   Opens a form overlay from any element with [data-mjl-contact].
   Submits via Web3Forms (fetch — CSP-safe with form-action 'self')
   and redirects to the thank-you page on success.
   ============================================================ */
(function () {
  var ACCESS_KEY = '9b5d44a1-65e4-4da7-a517-72789aaf225d';
  var REDIRECT_URL = 'https://the-meridian-protocols.github.io/contact-themeridian.html';

  // --- Inject styles (MJL theme: Syne / Montserrat, room + gold) ---
  var style = document.createElement('style');
  style.textContent = [
    '.mjl-overlay{position:fixed;inset:0;background:rgba(10,13,16,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity .3s ease;padding:24px}',
    '.mjl-overlay.mjl-open{display:flex;opacity:1}',
    '.mjl-modal{position:relative;background:#171d24;border:1px solid rgba(191,163,115,0.35);padding:48px 36px 36px;max-width:480px;width:100%;box-shadow:0 30px 70px -20px rgba(0,0,0,0.8);animation:mjlFadeUp .55s cubic-bezier(0.16,1,0.3,1) both;max-height:90vh;overflow-y:auto}',
    '@keyframes mjlFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
    '.mjl-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#7c8691;font-size:1.5rem;cursor:pointer;padding:6px 10px;line-height:1;transition:color .2s;font-family:inherit}',
    '.mjl-close:hover{color:#bfa373}',
    '.mjl-eyebrow{font-family:"Montserrat",sans-serif;font-size:.65rem;letter-spacing:.4em;text-transform:uppercase;color:#bfa373;font-weight:500;text-align:center;margin-bottom:14px}',
    '.mjl-title{font-family:"Syne",sans-serif;font-size:1.7rem;font-weight:700;letter-spacing:-0.02em;text-transform:uppercase;color:#e4e7eb;text-align:center;margin-bottom:12px;line-height:1.15}',
    '.mjl-subtitle{font-family:"Montserrat",sans-serif;font-size:.9rem;font-weight:500;color:#cbd5e1;text-align:center;margin-bottom:28px;line-height:1.7}',
    '.mjl-form{display:flex;flex-direction:column;gap:12px}',
    '.mjl-form input[type="text"],.mjl-form input[type="email"],.mjl-form textarea{width:100%;padding:1rem 1.1rem;background:#12161a;border:1px solid #222a33;border-radius:0;color:#e4e7eb;font-family:"Montserrat",sans-serif;font-size:.95rem;font-weight:400;letter-spacing:.03em;transition:border-color .2s;-webkit-appearance:none}',
    '.mjl-form textarea{min-height:130px;resize:vertical;line-height:1.65}',
    '.mjl-form input::placeholder,.mjl-form textarea::placeholder{color:#4e5864}',
    '.mjl-form input:focus,.mjl-form textarea:focus{outline:none;border-color:rgba(191,163,115,0.6)}',
    '.mjl-form button{margin-top:10px;padding:1.1rem 2.2rem;background:#bfa373;border:1px solid #bfa373;border-radius:0;color:#0a0d10;font-family:"Montserrat",sans-serif;font-size:.7rem;font-weight:600;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;transition:all .3s cubic-bezier(0.16,1,0.3,1)}',
    '.mjl-form button:hover{background:transparent;color:#bfa373;transform:translateY(-2px)}',
    '.mjl-form button:focus-visible{outline:2px solid #bfa373;outline-offset:2px}',
    '.mjl-form button:disabled{opacity:.5;cursor:wait;transform:none}',
    '.mjl-error{display:none;margin-top:6px;font-family:"Montserrat",sans-serif;font-size:.82rem;color:#bfa373;font-weight:500;letter-spacing:.05em;text-align:center}',
    '.mjl-honeypot{position:absolute !important;left:-9999px !important;visibility:hidden !important}',
    'body.mjl-locked{overflow:hidden}'
  ].join('');
  document.head.appendChild(style);

  // --- Build modal markup ---
  var overlay = document.createElement('div');
  overlay.className = 'mjl-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'mjl-title');
  overlay.innerHTML =
    '<div class="mjl-modal">' +
      '<button class="mjl-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="mjl-eyebrow">Contact</div>' +
      '<div class="mjl-title" id="mjl-title">Write to M.J.</div>' +
      '<p class="mjl-subtitle">A session, a seat, the record, the room — send it over.<br>Every note gets read.</p>' +
      '<form class="mjl-form" novalidate>' +
        '<input type="checkbox" name="botcheck" class="mjl-honeypot" tabindex="-1" autocomplete="off">' +
        '<input type="text" name="name" placeholder="Your name" required autocomplete="name" maxlength="120">' +
        '<input type="email" name="email" placeholder="your@email.com" required autocomplete="email" inputmode="email" maxlength="254" spellcheck="false">' +
        '<textarea name="message" placeholder="What\u2019s on your mind?" required maxlength="4000"></textarea>' +
        '<button type="submit">Send it</button>' +
        '<p class="mjl-error"></p>' +
      '</form>' +
    '</div>';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // --- Attach to DOM once body is ready ---
  function attach() {
    document.body.appendChild(overlay);

    overlay.querySelector('.mjl-close').addEventListener('click', window.closeContactModal);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) window.closeContactModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('mjl-open')) {
        window.closeContactModal();
      }
    });

    // Any element with [data-mjl-contact] opens the modal
    document.querySelectorAll('[data-mjl-contact]').forEach(function (el) {
      el.addEventListener('click', window.openContactModal);
    });

    // Fetch-based submit (the page CSP blocks direct form POSTs off-site)
    var form = overlay.querySelector('.mjl-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var btn = form.querySelector('button[type="submit"]');
      var errEl = form.querySelector('.mjl-error');
      var name = (form.elements.name.value || '').trim().slice(0, 120);
      var email = (form.elements.email.value || '').trim().slice(0, 254);
      var message = (form.elements.message.value || '').trim().slice(0, 4000);

      errEl.style.display = 'none';
      if (!name) { form.elements.name.focus(); return; }
      if (!EMAIL_RE.test(email)) { form.elements.email.focus(); return; }
      if (!message) { form.elements.message.focus(); return; }

      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = 'Sending\u2026';

      try {
        var res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: ACCESS_KEY,
            subject: 'New message \u2014 M.J.\u2019s Listening Sessions',
            from_name: 'MJL Contact Form',
            botcheck: form.elements.botcheck.checked,
            name: name,
            email: email,
            message: message
          })
        });
        var data = await res.json();
        if (data.success) {
          window.location.href = REDIRECT_URL;
          return;
        }
        errEl.textContent = 'Something went sideways \u2014 try again in a moment.';
        errEl.style.display = 'block';
      } catch (err) {
        errEl.textContent = 'Something went sideways \u2014 try again in a moment.';
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  // --- Public API ---
  window.openContactModal = function () {
    if (!overlay.parentNode) return;
    overlay.classList.add('mjl-open');
    document.body.classList.add('mjl-locked');
    setTimeout(function () {
      var first = overlay.querySelector('input[name="name"]');
      if (first) first.focus();
    }, 100);
  };

  window.closeContactModal = function () {
    overlay.classList.remove('mjl-open');
    document.body.classList.remove('mjl-locked');
  };
})();
