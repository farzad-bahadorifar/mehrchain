import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest as rootProxy } from '../functions/api/[[path]].js';
import { onRequest as frontendProxy } from '../apps/mehrchain-frontend/functions/api/[[path]].js';

for (const [layout, onRequest] of [
  ['root', rootProxy],
  ['frontend', frontendProxy],
]) {
  const login = () =>
    new Request('https://mehrchain.pages.dev/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.invalid', password: 'fixture' }),
      headers: { 'Content-Type': 'application/json' },
    });

  test(`${layout} Pages proxy identifies upstream challenges and non-API limits`, async (t) => {
    const cases = [
      ['<html>Challenge</html>', 403, { 'cf-mitigated': 'challenge', 'Content-Type': 'text/html' }],
      ['Too Many Requests', 429, { 'Content-Type': 'text/plain' }],
    ];
    for (const [body, status, headers] of cases) {
      await t.test(String(status), async (subtest) => {
        const fetchMock = subtest.mock.method(globalThis, 'fetch', async (request) => {
          assert.equal(request.method, 'POST');
          assert.equal(new URL(request.url).pathname, '/api/auth/login');
          assert.equal((await request.json()).email, 'test@example.invalid');
          return new Response(body, { status, headers });
        });
        const response = await onRequest({ request: login() });
        assert.equal(fetchMock.mock.callCount(), 1);
        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), { code: 'API_INGRESS_UNAVAILABLE' });
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
        assert.equal(response.headers.get('cf-mitigated'), null);
      });
    }
  });

  test(`${layout} Pages proxy keeps the application's rate limit and retry timing`, async (t) => {
    const body = { statusCode: 429, message: 'Too Many Requests' };
    t.mock.method(
      globalThis,
      'fetch',
      async () =>
        new Response(JSON.stringify(body), {
          status: 429,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '28' },
        }),
    );
    const response = await onRequest({ request: login() });
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), body);
    assert.equal(response.headers.get('Retry-After'), '28');
    assert.equal(response.headers.get('Access-Control-Expose-Headers'), 'Retry-After');
  });

  test(`${layout} routes only to its configured HTTPS origin and replaces client proof`, async (t) => {
    const secret = 'a'.repeat(64);
    const request = login();
    request.headers.set('CF-Connecting-IP', '192.0.2.1');
    request.headers.set('X-MehrChain-Client-IP', '192.0.2.9');
    request.headers.set('X-MehrChain-Proxy-Secret', 'forged');
    const upstream = t.mock.method(globalThis, 'fetch', async (outbound) => {
      assert.equal(outbound.url, 'https://candidate.example.test/api/auth/login');
      assert.equal(outbound.headers.get('X-MehrChain-Client-IP'), '192.0.2.1');
      assert.equal(outbound.headers.has('CF-Connecting-IP'), false);
      assert.equal(outbound.headers.get('X-MehrChain-Proxy-Secret'), secret);
      assert.equal(outbound.redirect, 'manual');
      return new Response(null, {
        status: 307,
        headers: { Location: 'https://other.example.test' },
      });
    });
    const response = await onRequest({
      request,
      env: { BACKEND_ORIGIN: 'https://candidate.example.test', BACKEND_PROXY_SECRET: secret },
    });
    assert.equal(response.status, 502);
    assert.equal(upstream.mock.callCount(), 1);
    assert.equal(response.headers.get('Location'), null);
  });

  test(`${layout} rejects an invalid origin or unprotected custom destination`, async (t) => {
    const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json({}));
    for (const backend of [
      'https://candidate.example.test',
      'http://candidate.example.test',
      'https://candidate.example.test/api',
    ]) {
      const response = await onRequest({ request: login(), env: { BACKEND_ORIGIN: backend } });
      assert.equal(response.status, 503);
    }
    assert.equal(upstream.mock.callCount(), 0);
  });
}
