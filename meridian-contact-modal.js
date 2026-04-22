/* ============================================================
   Meridian Contact Modal
   Opens a form overlay when "Contact The Meridian" is clicked.
   Submits via Web3Forms and redirects to the thank-you page.
   ============================================================ */
(function () {
  var ACCESS_KEY = '9b5d44a1-65e4-4da7-a517-72789aaf225d';
  var REDIRECT_URL = 'https://the-meridian-protocols.github.io/contact-themeridian.html';

  // --- Inject styles ---
  var style = document.createElement('style');
  style.textContent = [
    '.mc-overlay{position:fixed;inset:0;background:rgba(10,8,6,0.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity .3s ease;padding:24px}',
    '.mc-overlay.mc-open{display:flex;opacity:1}',
    '.mc-modal{position:relative;background:#1e1a15;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:44px 34px 32px;max-width:460px;width:100%;box-shadow:0 14px 52px rgba(0,0,0,0.5);animation:mcFadeUp .55s ease both;max-height:90vh;overflow-y:auto}',
    '@keyframes mcFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}',
    '.mc-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#8a8278;font-size:1.5rem;cursor:pointer;padding:6px 10px;line-height:1;transition:color .2s;font-family:inherit}',
    '.mc-close:hover{color:#c9a84c}',
    '.mc-eyebrow{font-family:"Cormorant Garamond",serif;font-size:.72rem;letter-spacing:.4em;text-transform:uppercase;color:#c9a84c;opacity:.6;text-align:center;margin-bottom:14px}',
    '.mc-title{font-family:"Cormorant Garamond",serif;font-size:1.75rem;font-weight:300;letter-spacing:.04em;color:#e8e2d8;text-align:center;margin-bottom:10px;line-height:1.2}',
    '.mc-title em{font-style:italic;color:#c9a84c}',
    '.mc-subtitle{font-family:"Cormorant Garamond",serif;font-size:.98rem;font-style:italic;color:#a09890;text-align:center;margin-bottom:26px;line-height:1.6}',
    '.mc-form{display:flex;flex-direction:column;gap:12px}',
    '.mc-form input[type="text"],.mc-form input[type="email"],.mc-form textarea{width:100%;padding:12px 14px;background:rgba(10,8,6,0.5);border:1px solid rgba(201,168,76,0.2);border-radius:6px;color:#e8e2d8;font-family:"Jost",sans-serif;font-size:.95rem;transition:border-color .2s,background .2s}',
    '.mc-form textarea{min-height:120px;resize:vertical;line-height:1.55}',
    '.mc-form input::placeholder,.mc-form textarea::placeholder{color:#6a6358;font-style:italic;font-family:"Cormorant Garamond",serif;font-size:1rem}',
    '.mc-form input:focus,.mc-form textarea:focus{outline:none;border-color:rgba(201,168,76,0.55);background:rgba(10,8,6,0.75)}',
    '.mc-form button{margin-top:8px;padding:13px 28px;background:transparent;border:1px solid rgba(201,168,76,0.4);border-radius:8px;color:#c9a84c;font-family:"Jost",sans-serif;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;cursor:pointer;transition:all .25s}',
    '.mc-form button:hover{background:rgba(201,168,76,0.08);border-color:rgba(201,168,76,0.7);transform:translateY(-1px)}',
    '.mc-form button:disabled{opacity:.5;cursor:wait}',
    '.mc-honeypot{position:absolute !important;left:-9999px !important;visibility:hidden !important}',
    'body.mc-locked{overflow:hidden}'
  ].join('');
  document.head.appendChild(style);

  // --- Build modal markup ---
  var overlay = document.createElement('div');
  overlay.className = 'mc-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'mc-title');
  overlay.innerHTML =
    '<div class="mc-modal">' +
      '<button class="mc-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="mc-eyebrow">Contact</div>' +
      '<div class="mc-title" id="mc-title">Speak to <em>The Meridian.</em></div>' +
      '<p class="mc-subtitle">Share your thoughts, questions, or reflections.<br>Every note is read with care.</p>' +
      '<form class="mc-form" action="https://api.web3forms.com/submit" method="POST">' +
        '<input type="hidden" name="access_key" value="' + ACCESS_KEY + '">' +
        '<input type="hidden" name="redirect" value="' + REDIRECT_URL + '">' +
        '<input type="hidden" name="subject" value="New message to The Meridian">' +
        '<input type="hidden" name="from_name" value="The Meridian Contact Form">' +
        '<input type="checkbox" name="botcheck" class="mc-honeypot" tabindex="-1" autocomplete="off">' +
        '<input type="text" name="name" placeholder="Your name" required autocomplete="name">' +
        '<input type="email" name="email" placeholder="Your email" required autocomplete="email">' +
        '<textarea name="message" placeholder="Your message" required></textarea>' +
        '<button type="submit">Send</button>' +
      '</form>' +
    '</div>';

  // --- Attach to DOM once body is ready ---
  function attach() {
    document.body.appendChild(overlay);

    overlay.querySelector('.mc-close').addEventListener('click', window.closeContactModal);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) window.closeContactModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('mc-open')) {
        window.closeContactModal();
      }
    });

    // Disable submit button after click to avoid double-post
    overlay.querySelector('.mc-form').addEventListener('submit', function () {
      var btn = overlay.querySelector('.mc-form button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
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
    overlay.classList.add('mc-open');
    document.body.classList.add('mc-locked');
    setTimeout(function () {
      var first = overlay.querySelector('input[name="name"]');
      if (first) first.focus();
    }, 100);
  };

  window.closeContactModal = function () {
    overlay.classList.remove('mc-open');
    document.body.classList.remove('mc-locked');
  };
})();
