// ═══════════════════════════════════════════════════════════
//  The Meridian™ — Cloudflare Worker
//  Verifies Firebase Auth token, returns signed Supabase URL
//
//  Deploy: wrangler deploy
//  Environment variables to set in Cloudflare dashboard:
//    SUPABASE_URL          — your Supabase project URL
//    SUPABASE_SERVICE_KEY  — your Supabase service role key (secret)
//    FIREBASE_PROJECT_ID   — your Firebase project ID
// ═══════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {

    // ── CORS headers ─────────────────────────────────────
    const corsHeaders = {
      'Access-Control-Allow-Origin':  'https://the-meridian-protocols.github.io',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      // ── 1. Get Firebase ID token from Authorization header ──
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
      const idToken = authHeader.replace('Bearer ', '').trim();

      // ── 2. Verify Firebase ID token ──────────────────────
      const verified = await verifyFirebaseToken(idToken, env.FIREBASE_PROJECT_ID);
      if (!verified) {
        return new Response('Invalid token', { status: 403, headers: corsHeaders });
      }

      // ── 3. Get requested audio file path ─────────────────
      const url   = new URL(request.url);
      const track = url.searchParams.get('track');

      if (!track) {
        return new Response('Missing track parameter', { status: 400, headers: corsHeaders });
      }

      // ── 4. Validate track name (security: no path traversal) ──
      const validTrack = /^[a-z0-9\-\.]+\.mp3$/.test(track);
      if (!validTrack) {
        return new Response('Invalid track name', { status: 400, headers: corsHeaders });
      }

      // ── 5. Generate signed Supabase URL (2 hr expiry) ────
      const signedUrl = await getSupabaseSignedUrl(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
        track
      );

      if (!signedUrl) {
        return new Response('Could not generate audio URL', { status: 500, headers: corsHeaders });
      }

      // ── 6. Return signed URL to browser ──────────────────
      return new Response(
        JSON.stringify({ url: signedUrl }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      );

    } catch (err) {
      return new Response('Server error', { status: 500, headers: corsHeaders });
    }
  }
};

// ── Verify Firebase ID token using Google's public keys ────
async function verifyFirebaseToken(idToken, projectId) {
  try {
    // Fetch Google's public keys for Firebase
    const keysRes = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    const keys = await keysRes.json();

    // Decode token header to get key ID
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(atob(headerB64.replace(/-/g,'+').replace(/_/g,'/')));
    const kid = header.kid;

    if (!keys[kid]) return false;

    // Import the public key
    const pemKey = keys[kid];
    const pemBody = pemKey.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
    const derBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      derBuffer.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify signature
    const [, payloadB64, sigB64] = idToken.split('.');
    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(sigB64.replace(/-/g,'+').replace(/_/g,'/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature.buffer,
      signingInput
    );

    if (!valid) return false;

    // Verify claims
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g,'+').replace(/_/g,'/'))
    );
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now)           return false; // expired
    if (payload.iat > now + 300)     return false; // issued in future
    if (payload.aud !== projectId)   return false; // wrong project
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return false;
    if (!payload.sub)                return false; // no user ID

    return true;

  } catch (e) {
    return false;
  }
}

// ── Get signed URL from Supabase Storage ──────────────────
async function getSupabaseSignedUrl(supabaseUrl, serviceKey, track) {
  try {
    const bucket = 'meridian-audio';
    const path   = `full/${track}`;
    const expiresIn = 7200; // 2 hours

    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ expiresIn }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.signedURL ? `${supabaseUrl}/storage/v1${data.signedURL}` : null;

  } catch (e) {
    return null;
  }
}
