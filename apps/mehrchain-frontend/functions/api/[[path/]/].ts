/**
 * Cloudflare Pages Function: API Reverse Proxy
 * Intercepts all requests matching /api/* and proxies them to the backend API hosted on Render.
 * This ensures lightning-fast edge delivery in Iran without ISP SNI/DNS blocks.
 */

interface Env {
  BACKEND_API_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = context.env.BACKEND_API_ORIGIN || 'https://mehrchain-api.onrender.com';
  const url = new URL(context.request.url);
  const targetUrl = new URL(url.pathname + url.search, origin);

  const requestHeaders = new Headers(context.request.headers);
  requestHeaders.set('Host', new URL(origin).host);
  requestHeaders.set('X-Forwarded-Host', url.host);
  requestHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  // Remove Cloudflare internal headers before forwarding
  requestHeaders.delete('cf-connecting-ip');
  requestHeaders.delete('cf-ipcountry');
  requestHeaders.delete('cf-ray');
  requestHeaders.delete('cf-visitor');

  const method = context.request.method;

  // Handle preflight OPTIONS requests directly at the edge
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const fetchInit: RequestInit = {
    method,
    headers: requestHeaders,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(method)) {
    fetchInit.body = await context.request.arrayBuffer();
  }

  try {
    const upstreamResponse = await fetch(targetUrl.toString(), fetchInit);

    // Clone response headers and inject permissive CORS for web/Capacitor clients
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', context.request.headers.get('Origin') || '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        statusCode: 502,
        message: 'Backend Gateway Proxy Error: ' + (err.message || 'Upstream server unreachable'),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
};
