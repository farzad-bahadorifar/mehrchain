import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AddressInfo } from 'node:net';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { authThrottling } from './auth-throttling';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('Authentication rate limits over HTTP', () => {
  const worker = '2a06:98c0:3600::103';
  let app: INestApplication;
  let origin: string;

  async function start(onRender = true) {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(authThrottling(onRender))],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: () => ({}),
            register: () => ({}),
            googleLogin: () => ({}),
            getMe: () => ({}),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: {
          switchToHttp: () => {
            getRequest: () => { headers: Record<string, string>; user?: { id: string } };
          };
        }) {
          const request = context.switchToHttp().getRequest();
          if (!request.headers.authorization) return false;
          request.user = { id: request.headers.authorization };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
    origin = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/auth`;
  }

  async function post(route: string, body: object, visitor = worker, forwarded = '192.0.2.20') {
    return fetch(`${origin}/${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': visitor,
        'X-Forwarded-For': forwarded,
      },
      body: JSON.stringify(body),
    });
  }

  afterEach(async () => {
    await app?.close();
  });

  it.each([
    ['login', 5],
    ['register', 3],
  ] as const)(
    'separates worker-pool %s destinations but limits a normalized repeated identity',
    async (route, limit) => {
      await start();
      for (let attempt = 0; attempt < limit; attempt++) {
        expect((await post(route, { email: 'Owner@example.test' })).status).toBe(201);
      }
      for (let attempt = 0; attempt < 42; attempt++) {
        const response = await post(route, { email: ' OWNER@EXAMPLE.TEST ' });
        expect(response.status).toBe(429);
        expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
      }
      expect((await post(route, { email: 'another@example.test' })).status).toBe(201);
    },
  );

  it('still caps aggregate traffic to a route through the documented shared worker', async () => {
    await start();
    for (let attempt = 0; attempt < 40; attempt++) {
      expect((await post('google', { idToken: `fixture-${attempt}` })).status).toBe(201);
    }
    const blocked = await post('google', { idToken: 'another fixture' });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

  it('keeps direct Render IP budgets independent and ignores arbitrary forwarded headers', async () => {
    await start();
    for (let attempt = 0; attempt < 5; attempt++) {
      expect(
        (await post('login', { email: `fixture-${attempt}@example.test` }, '198.51.100.10')).status,
      ).toBe(201);
    }
    expect(
      (await post('login', { email: 'another@example.test' }, '198.51.100.10', '203.0.113.33'))
        .status,
    ).toBe(429);
    expect((await post('login', { email: 'another@example.test' }, '198.51.100.11')).status).toBe(
      201,
    );
  });

  it('does not trust request-supplied forwarding headers on non-Render installs', async () => {
    await start(false);
    for (let attempt = 0; attempt < 3; attempt++) {
      expect(
        (await post('register', { email: 'owner@example.test' }, `198.51.100.${attempt + 1}`))
          .status,
      ).toBe(201);
    }
    expect((await post('register', { email: 'another@example.test' }, worker)).status).toBe(429);
  });

  it('keeps authenticated session restore independent for users on the same worker', async () => {
    await start();
    const me = (id: string) =>
      fetch(`${origin}/me`, { headers: { 'CF-Connecting-IP': worker, Authorization: id } });
    for (let attempt = 0; attempt < 10; attempt++) expect((await me('first')).status).toBe(200);
    expect((await me('first')).status).toBe(429);
    expect((await me('second')).status).toBe(200);
  });
});
