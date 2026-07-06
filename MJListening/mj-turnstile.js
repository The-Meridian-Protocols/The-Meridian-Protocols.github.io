/*  ─── M.J.'s Listening Sessions · Cloudflare Turnstile Human Verification Gate ───
 *
 *  Sibling of meridian-turnstile.js — same logic, styled for the
 *  Listening Sessions page. Adds a full-page overlay that hides content
 *  until Cloudflare Turnstile confirms the visitor is human.
 *  Verification is remembered for the browser session.
 *
 *  ─────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────
  var SITE_KEY = '0x4AAAAAADD0J74UYDpuAg-2';
  var SESSION_KEY = 'mjls_verified';
  // ────────────────────────────────────────────────────────────────

  /* Skip gate if already verified this session */
  if (sessionStorage.getItem(SESSION_KEY) === '1') return;

  /* Hide page content immediately */
  document.documentElement.style.overflow = 'hidden';

  function init() {
    /* ── Overlay container ── */
    var overlay = document.createElement('div');
    overlay.id = 'turnstile-gate';
    overlay.setAttribute('style', [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'background:#12161a',
      'transition:opacity 0.5s ease',
      'opacity:1',
      'padding:24px'
    ].join(';'));

    /* ── Branding ── */
    var brand = document.createElement('div');
    brand.setAttribute('style', [
      "font-family:'Syne',sans-serif",
      'font-size:clamp(1.4rem,4.5vw,2.1rem)',
      'font-weight:700',
      'letter-spacing:-0.02em',
      'text-transform:uppercase',
      'color:#e4e7eb',
      'margin-bottom:6px',
      'text-align:center'
    ].join(';'));
    var brandName = document.createElement('span');
    brandName.setAttribute('style', 'color:transparent;-webkit-text-stroke:1px #bfa373;margin-right:8px');
    brandName.textContent = "M.J.'s";
    brand.appendChild(brandName);
    brand.appendChild(document.createTextNode('Listening Sessions'));

    /* ── Gold rule ── */
    var rule = document.createElement('div');
    rule.setAttribute('style', [
      'width:200px',
      'height:1px',
      'background:linear-gradient(to right,transparent,#bfa373,transparent)',
      'opacity:0.4',
      'margin:0 auto 26px'
    ].join(';'));

    /* ── Status text ── */
    var status = document.createElement('div');
    status.setAttribute('style', [
      "font-family:'Montserrat',sans-serif",
      'font-size:0.65rem',
      'letter-spacing:0.35em',
      'text-transform:uppercase',
      'color:#7c8691',
      'margin-bottom:22px',
      'text-align:center'
    ].join(';'));
    status.textContent = 'One moment before the music…';

    /* ── Turnstile widget container ── */
    var widgetWrap = document.createElement('div');
    widgetWrap.id = 'turnstile-widget';

    /* Assemble */
    overlay.appendChild(brand);
    overlay.appendChild(rule);
    overlay.appendChild(status);
    overlay.appendChild(widgetWrap);
    document.body.appendChild(overlay);

    /* ── Render Turnstile ── */
    function renderWidget() {
      if (typeof turnstile !== 'undefined' && turnstile.render) {
        turnstile.render('#turnstile-widget', {
          sitekey: SITE_KEY,
          theme: 'dark',
          callback: onSuccess,
          'error-callback': onError,
          'expired-callback': onExpired
        });
      } else {
        setTimeout(renderWidget, 150);
      }
    }
    renderWidget();

    /* ── Callbacks ── */
    function onSuccess() {
      sessionStorage.setItem(SESSION_KEY, '1');
      status.textContent = 'Verified — welcome in.';
      status.style.color = '#bfa373';
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.remove();
        document.documentElement.style.overflow = '';
      }, 520);
    }

    function onError() {
      status.textContent = 'Verification failed — please refresh the page.';
      status.style.color = '#ff6b6b';
    }

    function onExpired() {
      status.textContent = 'Verification expired — please refresh the page.';
      status.style.color = '#ff6b6b';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
