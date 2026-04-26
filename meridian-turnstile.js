/*  ─── Meridian™ · Cloudflare Turnstile Human Verification Gate ───
 *
 *  Adds a full-page overlay that hides content until Cloudflare Turnstile
 *  confirms the visitor is human. Verification is remembered for the
 *  browser session so visitors only see the gate once.
 *
 *  SETUP:
 *  1. Replace YOUR_SITE_KEY_HERE with your Turnstile site key from
 *     https://dash.cloudflare.com → Turnstile → Add Widget
 *  2. Choose "Managed" widget type (invisible when possible, simple
 *     checkbox when needed — no image puzzles ever).
 *
 *  ────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────
  var SITE_KEY = '0x4AAAAAADD0J74UYDpuAg-2';
  var SESSION_KEY = 'meridian_verified';
  // ────────────────────────────────────────────────────────────────

  /* Skip gate if already verified this session */
  if (sessionStorage.getItem(SESSION_KEY) === '1') return;

  /* Hide page content immediately */
  document.documentElement.style.overflow = 'hidden';

  /* Build overlay once DOM is ready */
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
      'background:#16130f',
      'transition:opacity 0.5s ease',
      'opacity:1'
    ].join(';'));

    /* ── Branding ── */
    var brand = document.createElement('div');
    brand.setAttribute('style', [
      "font-family:'Cormorant Garamond',serif",
      'font-size:clamp(1.6rem,4vw,2.4rem)',
      'font-weight:300',
      'letter-spacing:0.14em',
      'color:#e8e2d8',
      'margin-bottom:8px',
      'text-align:center'
    ].join(';'));
    brand.innerHTML = 'The <em style="color:#c9a84c;font-style:italic">Meridian</em>';

    /* ── Gold rule ── */
    var rule = document.createElement('div');
    rule.setAttribute('style', [
      'width:200px',
      'height:1px',
      'background:linear-gradient(to right,transparent,#c9a84c,transparent)',
      'opacity:0.45',
      'margin:0 auto 28px'
    ].join(';'));

    /* ── Status text ── */
    var status = document.createElement('div');
    status.setAttribute('style', [
      "font-family:'Jost',sans-serif",
      'font-size:0.72rem',
      'letter-spacing:0.22em',
      'text-transform:uppercase',
      'color:#8a8278',
      'margin-bottom:24px',
      'text-align:center'
    ].join(';'));
    status.textContent = 'Verifying you are human…';

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
        /* Turnstile API not loaded yet — retry */
        setTimeout(renderWidget, 150);
      }
    }
    renderWidget();

    /* ── Callbacks ── */
    function onSuccess() {
      sessionStorage.setItem(SESSION_KEY, '1');
      status.textContent = 'Verified';
      status.style.color = '#c9a84c';
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.remove();
        document.documentElement.style.overflow = '';
      }, 520);
    }

    function onError() {
      status.textContent = 'Verification failed — please refresh the page.';
      status.style.color = '#8a6030';
    }

    function onExpired() {
      status.textContent = 'Verification expired — please refresh the page.';
      status.style.color = '#8a6030';
    }
  }

  /* Run as soon as possible */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
