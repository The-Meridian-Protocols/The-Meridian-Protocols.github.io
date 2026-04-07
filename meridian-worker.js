// ═══════════════════════════════════════════════════════════
//  The Meridian™ — Cloudflare Worker
//  Verifies Firebase Auth token, returns R2 presigned URL
//
//  Deploy: wrangler deploy
//  Secrets to set via: wrangler secret put <NAME>
//    FIREBASE_PROJECT_ID  — your Firebase project ID
//    R2_ACCOUNT_ID        — your Cloudflare account ID
//    R2_ACCESS_KEY_ID     — R2 API token Access Key ID
//    R2_SECRET_ACCESS_KEY — R2 API token Secret Access Key
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

      // ── 5. Generate R2 presigned URL (2 hr expiry) ───────
      const signedUrl = await getR2PresignedUrl(
        env.R2_ACCOUNT_ID,
        env.R2_ACCESS_KEY_ID,
        env.R2_SECRET_ACCESS_KEY,
        'meridian-audio',
        `full/${track}`
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
    // Fetch Google's public keys for Firebase in JWK format
    const keysRes = await fetch(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    );
    const { keys } = await keysRes.json();

    // Decode token header to get key ID
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(atob(headerB64.replace(/-/g,'+').replace(/_/g,'/')));
    const kid = header.kid;

    // Find the matching JWK
    const jwk = keys.find(k => k.kid === kid);
    if (!jwk) return false;

    // Import the public key using JWK format (works correctly in Workers)
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
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

// ── Generate R2 presigned URL via AWS Signature V4 ────────
async function getR2PresignedUrl(accountId, accessKeyId, secretAccessKey, bucket, key) {
  try {
    const region  = 'auto';
    const service = 's3';
    const host    = `${accountId}.r2.cloudflarestorage.com`;

    const now       = new Date();
    const datestamp = now.toISOString().slice(0, 10).replace(/-/g, '');          // YYYYMMDD
    const amzdate   = datestamp + 'T' + now.toISOString().slice(11, 19).replace(/:/g, '') + 'Z'; // YYYYMMDDTHHmmssZ

    const expiresIn      = 7200; // 2 hours in seconds
    const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
    const credential      = `${accessKeyId}/${credentialScope}`;

    // ── Build canonical query string ─────────────────────
    // Parameters must be sorted alphabetically by name
    const queryParams = [
      ['X-Amz-Algorithm',     'AWS4-HMAC-SHA256'],
      ['X-Amz-Credential',    credential],
      ['X-Amz-Date',          amzdate],
      ['X-Amz-Expires',       String(expiresIn)],
      ['X-Amz-SignedHeaders', 'host'],
    ].sort((a, b) => a[0].localeCompare(b[0]));

    const canonicalQueryString = queryParams
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    // ── Build canonical request ───────────────────────────
    const canonicalUri     = `/${bucket}/${key}`;
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders    = 'host';
    const payloadHash      = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      'GET',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // ── Build string to sign ──────────────────────────────
    const canonicalRequestHash = await sha256(canonicalRequest);

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzdate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    // ── Calculate signing key ─────────────────────────────
    const signingKey = await getSigningKey(secretAccessKey, datestamp, region, service);

    // ── Calculate signature ───────────────────────────────
    const signature = await hmacHex(signingKey, stringToSign);

    // ── Assemble final URL ────────────────────────────────
    return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

  } catch (e) {
    return null;
  }
}

// ── Crypto helpers ─────────────────────────────────────────

async function sha256(message) {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacRaw(key, message) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const msgBuffer = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  return crypto.subtle.sign('HMAC', keyMaterial, msgBuffer);
}

async function hmacHex(key, message) {
  const raw = await hmacRaw(key, message);
  return Array.from(new Uint8Array(raw)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSigningKey(secretKey, datestamp, region, service) {
  const kDate    = await hmacRaw(new TextEncoder().encode(`AWS4${secretKey}`), datestamp);
  const kRegion  = await hmacRaw(kDate, region);
  const kService = await hmacRaw(kRegion, service);
  const kSigning = await hmacRaw(kService, 'aws4_request');
  return kSigning;
}
