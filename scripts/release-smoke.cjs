// Run only with two disposable, verified accounts. No credentials/tokens are printed.
const assert = require('node:assert/strict');
const base = process.env.SMOKE_API_URL?.replace(/\/$/, '');
const env = process.env;
async function request(method, route, token, body, statuses = [200, 201]) {
  const response = await fetch(base + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  assert.ok(
    statuses.includes(response.status),
    `${method} ${route.split('?')[0]} returned ${response.status}`,
  );
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function login(email, password) {
  const auth = await request('POST', '/auth/login', null, { email, password });
  assert.ok(auth.accessToken && auth.user?.id, 'Login must return a real identity and token');
  return auth;
}
async function run() {
  assert.ok(base && /^https?:\/\//.test(base), 'Set SMOKE_API_URL including /api');
  for (const key of ['SMOKE_A_EMAIL', 'SMOKE_A_PASSWORD', 'SMOKE_B_EMAIL', 'SMOKE_B_PASSWORD'])
    assert.ok(env[key], `Set ${key}`);
  assert.notEqual(env.SMOKE_A_EMAIL, env.SMOKE_B_EMAIL);
  const a = await login(env.SMOKE_A_EMAIL, env.SMOKE_A_PASSWORD);
  const b = await login(env.SMOKE_B_EMAIL, env.SMOKE_B_PASSWORD);
  assert.notEqual(a.user.id, b.user.id);
  const habits = [];
  let bDeleted = false;
  try {
    await request('GET', '/commitments', null, undefined, [401]);
    await request('POST', '/auth/google', null, { idToken: 'mock_google_smoke@gmail.com' }, [401]);
    const stamp = Date.now();
    const ha = await request('POST', '/commitments', a.accessToken, {
      title: `Smoke A ${stamp}`,
      category: 'health',
      totalDays: 21,
      isPublic: true,
    });
    habits.push([a.accessToken, ha.id]);
    const hb = await request('POST', '/commitments', b.accessToken, {
      title: `Smoke B ${stamp}`,
      category: 'growth',
      totalDays: -1,
      isPublic: true,
    });
    habits.push([b.accessToken, hb.id]);
    assert.ok(ha.id && hb.id && ha.isPublic && hb.isPublic);
    await request('PATCH', `/commitments/${ha.id}`, b.accessToken, { title: 'Unauthorized edit' }, [
      403,
    ]);
    await Promise.all(
      [1, 2].map(() => request('PATCH', `/commitments/${ha.id}/complete`, a.accessToken, {})),
    );
    const aReload = await login(env.SMOKE_A_EMAIL, env.SMOKE_A_PASSWORD);
    assert.equal(aReload.user.id, a.user.id);
    const persisted = (await request('GET', '/commitments', aReload.accessToken)).find(
      (h) => h.id === ha.id,
    );
    assert.equal(persisted.currentDay, 1);
    assert.equal(persisted.logs.length, 1);
    const invite = await request('POST', '/chain/invite', a.accessToken, { commitmentId: ha.id });
    assert.ok(invite.inviteCode);
    await request('GET', `/chain/invite/${invite.inviteCode}`);
    await request(
      'POST',
      `/chain/invite/${invite.inviteCode}/accept`,
      a.accessToken,
      { commitmentId: ha.id },
      [400],
    );
    await request('POST', `/chain/invite/${invite.inviteCode}/accept`, b.accessToken, {
      commitmentId: hb.id,
    });
    await request(
      'POST',
      `/chain/invite/${invite.inviteCode}/accept`,
      b.accessToken,
      { commitmentId: hb.id },
      [400],
    );
    const ca = (await request('GET', '/chain/connections', a.accessToken)).find(
      (c) => c.userCommitmentId === ha.id && c.partnerCommitmentId === hb.id,
    );
    const cb = (await request('GET', '/chain/connections', b.accessToken)).find(
      (c) => c.userCommitmentId === hb.id && c.partnerCommitmentId === ha.id,
    );
    assert.ok(ca && cb, 'Both users must see reciprocal persisted connections');
    assert.ok(cb.partnerCommitment.lastCompletedDate, 'Partner Spark must survive fresh API read');
    await request('POST', `/chain/connections/${ca.id}/heart`, b.accessToken, {}, [404]);
    const heart = await request('POST', `/chain/connections/${ca.id}/heart`, a.accessToken, {});
    assert.equal(heart.heartSent, true);
    assert.equal(
      (await request('GET', '/chain/connections', aReload.accessToken)).find((c) => c.id === ca.id)
        .heartSent,
      true,
    );
    if (env.SMOKE_DELETE_B === 'yes') {
      await request('DELETE', '/auth/account', b.accessToken);
      bDeleted = true;
      await request('GET', '/auth/me', b.accessToken, undefined, [401]);
      assert.equal(
        (await request('GET', '/chain/connections', a.accessToken)).some((c) => c.id === ca.id),
        false,
      );
      console.log('PASS: disposable account deletion and partner chain cleanup');
    } else {
      await request('DELETE', `/chain/connections/${ca.id}`, a.accessToken);
      assert.equal(
        (await request('GET', '/chain/connections', b.accessToken)).some((c) => c.id === cb.id),
        false,
      );
      console.log('Deletion gate skipped: set SMOKE_DELETE_B=yes ONLY for a disposable account.');
    }
    console.log(
      'PASS: auth, ownership, solo persistence, duplicate Spark, real invites, reciprocal chain, Heart',
    );
  } finally {
    for (const [token, id] of habits) {
      if (bDeleted && token === b.accessToken) continue;
      try {
        await request('DELETE', `/commitments/${id}/permanent`, token);
      } catch {
        console.error('Cleanup failed; remove the smoke habit using its account.');
        process.exitCode = 1;
      }
    }
  }
}
run().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : 'Smoke test failed; inspect server logs privately.',
  );
  process.exitCode = 1;
});
