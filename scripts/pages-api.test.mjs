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
}
