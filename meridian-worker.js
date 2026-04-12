// ═══════════════════════════════════════════════════════════
//  The Meridian™ — Cloudflare Worker  (AUDIO PAUSED)
//
//  Audio delivery has been temporarily disabled.
//  The /api/audio-url endpoint now returns 503.
//
//  TO RESTORE AUDIO:
//  1. Replace this file with the version at git commit b84ec80
//     ("Update meridian-worker.js") which contains the full
//     Firebase token verification and R2 presigned URL logic.
//  2. Re-add the following Worker Secrets in the Cloudflare
//     dashboard (Workers → meridian-worker → Settings → Secrets):
//       FIREBASE_PROJECT_ID
//       R2_ACCOUNT_ID
//       R2_ACCESS_KEY_ID
//       R2_SECRET_ACCESS_KEY
//  3. Run: wrangler deploy
//  4. In meridian-protocols-rl.html and meridian-protocols-al.html,
//     replace every [AUDIO_PLACEHOLDER] block with the audio
//     player markup and reinstate the playFull() JS functions.
// ═══════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {

    // ── CORS headers ─────────────────────────────────────
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin =
      origin === 'https://the-meridian-protocols.github.io' ||
      /^https:\/\/[a-z0-9\-]+\.pages\.dev$/.test(origin) ||
      /^https:\/\/[a-z0-9\-]+\.workers\.dev$/.test(origin)
        ? origin
        : 'https://the-meridian-protocols.github.io';

    const corsHeaders = {
      'Access-Control-Allow-Origin':  allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── All routes: audio coming soon ────────────────────
    return new Response(
      JSON.stringify({ error: 'Audio delivery coming soon.' }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
};
