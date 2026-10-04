const fs = require('fs');

// Clean up old broken folders
fs.rmSync('functions', { recursive: true, force: true });
fs.rmSync('apps/mehrchain-frontend/functions', { recursive: true, force: true });

const content = `
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Target Render backend
  const backendBase = 'https://mehrchain-api.onrender.com';
  const targetUrl = backendBase + url.pathname + url.search;

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

  // Clone headers
  const headers = new Headers(request.headers);
  headers.set('Host', 'mehrchain-api.onrender.com');

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    redirect: 'follow',
  });

  try {
    const response = await fetch(modifiedRequest);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy Error', message: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
`.trim();

// 1. Root functions/api/[[path]].js
fs.mkdirSync('functions/api', { recursive: true });
fs.writeFileSync('functions/api/[[path]].js', content, 'utf8');

// 2. apps/mehrchain-frontend/functions/api/[[path]].js
fs.mkdirSync('apps/mehrchain-frontend/functions/api', { recursive: true });
fs.writeFileSync('apps/mehrchain-frontend/functions/api/[[path]].js', content, 'utf8');

console.log('Created functions/api/[[path]].js in both locations!');
