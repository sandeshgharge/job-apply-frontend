/**
 * Cloudflare Pages Function — Ollama Cloud API Proxy
 *
 * Route: /ollama-proxy/* (any path under this prefix)
 *
 * WHY THIS EXISTS:
 *   The Angular app runs inside the user's browser. Browsers enforce CORS and
 *   https://ollama.com does NOT return Access-Control-Allow-Origin headers,
 *   so any direct browser request to ollama.com is blocked at the preflight stage.
 *
 *   This Pages Function runs on Cloudflare's SERVERS (not in the browser).
 *   The browser calls /ollama-proxy/... on the same origin as the app (no CORS),
 *   and this function forwards the request to ollama.com server-to-server
 *   (servers are not subject to CORS rules).
 *
 * FLOW:
 *   Browser → POST /ollama-proxy/api/chat   (same origin ✅)
 *           → Cloudflare Function
 *           → POST https://ollama.com/api/chat  (server-to-server ✅)
 *           ← response forwarded back to browser
 *
 * Docs: https://developers.cloudflare.com/pages/functions/
 */

/**
 * Handle all non-OPTIONS requests (GET, POST, etc.)
 */
export async function onRequest(context) {
  const { request, params } = context;

  // Reconstruct the upstream path from the [[path]] wildcard segment
  // e.g. /ollama-proxy/api/chat → params.path = ['api', 'chat'] → /api/chat
  const pathSegments = params.path ?? [];
  const upstreamPath = '/' + pathSegments.join('/');

  // Preserve any query string parameters
  const url = new URL(request.url);
  const upstreamUrl = `https://ollama.com${upstreamPath}${url.search}`;

  // Forward the original headers but override Host to match the target server
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('Host', 'ollama.com');

  // Build the forwarded request (pass body for POST/PUT/PATCH)
  const upstreamRequest = new Request(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });

  // Call the Ollama Cloud API from the server side
  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamRequest);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error reaching ollama.com', detail: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Forward the upstream response back to the browser.
  // Add CORS headers so the browser accepts it (the proxy runs on your Pages
  // origin, but the response body comes from ollama.com).
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

/**
 * Handle CORS preflight OPTIONS requests.
 *
 * Before sending a POST with custom headers (like Authorization),
 * the browser first sends an OPTIONS "preflight" request to check permissions.
 * We must respond with 204 + CORS headers, otherwise the real request never fires.
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // cache preflight result for 24h
    },
  });
}
