/**
 * Cloudflare Pages Function: POST /api/paint-inspection-click
 *
 * Server-side mirror of the browser Pixel's custom "PaintInspectionClick"
 * event, sent to Meta's Conversions API. The click handler in
 * src/layouts/BaseLayout.astro posts here with:
 *   - event_id     one UUID generated per click, also passed to the Pixel as
 *                  eventID → Meta deduplicates the browser + server pair
 *   - external_id  the visitor's persistent anonymous UUID, the SAME value
 *                  the Pixel sends via Advanced Matching → Meta matches both
 *                  events to one person
 *   - fbp / fbc    Meta's own browser cookies, forwarded for extra match quality
 *
 * Required env var (Cloudflare Pages → Settings → Environment variables):
 *   META_CAPI_ACCESS_TOKEN  Conversions API access token (mark as secret).
 *                           Until it's set, this function accepts requests
 *                           with 202 and sends nothing.
 * Optional:
 *   META_TEST_EVENT_CODE    Events Manager "Test events" code, for verifying
 *                           delivery before going live.
 */

// ⚠️ Keep in sync with fbq('init', ...) in src/layouts/BaseLayout.astro
const PIXEL_ID = '1495570652308586';
const GRAPH_API_VERSION = 'v23.0';

// UUIDs from the client (36 chars) plus a little slack for the fallback format
const ID_RE = /^[0-9a-zA-Z-]{8,64}$/;

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.META_CAPI_ACCESS_TOKEN) {
    return new Response(null, { status: 202 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const { event_id: eventId, external_id: externalId, event_source_url, fbp, fbc } = body || {};
  if (!ID_RE.test(String(eventId || '')) || !ID_RE.test(String(externalId || ''))) {
    return new Response(null, { status: 400 });
  }

  const userData = {
    // Normalize exactly like the Pixel does for Advanced Matching values
    // (trim + lowercase, then SHA-256) so the browser and server hashes of
    // the same external_id are identical and Meta can match them.
    external_id: [await sha256Hex(String(externalId).trim().toLowerCase())],
    client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
    client_user_agent: request.headers.get('User-Agent') || undefined,
  };
  if (typeof fbp === 'string' && fbp.startsWith('fb.')) userData.fbp = fbp;
  if (typeof fbc === 'string' && fbc.startsWith('fb.')) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: 'PaintInspectionClick',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url:
          typeof event_source_url === 'string' ? event_source_url.slice(0, 2048) : undefined,
        user_data: userData,
      },
    ],
    // Token goes in the body, not the query string, to keep it out of URL logs
    access_token: env.META_CAPI_ACCESS_TOKEN,
  };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return new Response(null, { status: res.ok ? 204 : 502 });
}
