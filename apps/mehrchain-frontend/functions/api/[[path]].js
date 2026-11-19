const renderOrigin = 'https://mehrchain-api.onrender.com';
const proxySecretHeader = 'X-MehrChain-Proxy-Secret';
const proxyIpHeader = 'X-MehrChain-Client-IP';

function unavailable(status) {
  return new Response(JSON.stringify({ code: 'API_INGRESS_UNAVAILABLE' }), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
  });
}

export async function onRequest(context) {
  const { request, env = {} } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const upstream = new URL(env.BACKEND_ORIGIN ?? renderOrigin);
    const secret = env.BACKEND_PROXY_SECRET;
    if (
      upstream.protocol !== 'https:' ||
      upstream.href !== `${upstream.origin}/` ||
      ((upstream.origin !== renderOrigin || secret !== undefined) &&
        !/^[a-f0-9]{64}$/.test(secret ?? ''))
    )
      return unavailable(503);

    const headers = new Headers(request.headers);
    headers.set('Host', upstream.host);
    headers.delete(proxySecretHeader);
    headers.delete(proxyIpHeader);
    const visitor = request.headers.get('CF-Connecting-IP');
    if (secret && visitor) {
      headers.set(proxySecretHeader, secret);
      headers.set(proxyIpHeader, visitor);
    }

    const modifiedRequest = new Request(upstream.origin + url.pathname + url.search, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      duplex: 'half',
      redirect: 'manual',
    });
    const response = await fetch(modifiedRequest);
    // Keep a sign-in request and the proxy secret on the configured origin.
    if ([301, 302, 303, 307, 308].includes(response.status)) return unavailable(502);
    const newHeaders = new Headers(response.headers);
    const contentType = newHeaders.get('Content-Type') ?? '';
    if (
      newHeaders.get('cf-mitigated') === 'challenge' ||
      (response.status === 429 && !/^application\/json(?:\s*;|$)/i.test(contentType))
    ) {
      return unavailable(503);
    }

    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (response.status === 429) newHeaders.set('Access-Control-Expose-Headers', 'Retry-After');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch {
    return unavailable(502);
  }
}
