import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { ThrottlerModuleOptions, normalizeIp } from '@nestjs/throttler';
import type { Request } from 'express';

type AuthRequest = Request & { user?: { id: string } };
const workerAddress = normalizeIp('2a06:98c0:3600::103', 128);

function visitorIp(
  request: AuthRequest,
  onRender: boolean,
  proxySecret?: Buffer,
): string | undefined {
  const proof = request.headers['x-mehrchain-proxy-secret'];
  const address = request.headers['x-mehrchain-client-ip'];
  if (
    proxySecret &&
    typeof proof === 'string' &&
    /^[a-f0-9]{64}$/.test(proof) &&
    timingSafeEqual(proxySecret, Buffer.from(proof, 'hex')) &&
    typeof address === 'string' &&
    isIP(address)
  )
    return address;

  const header = request.headers['cf-connecting-ip'];
  if (onRender && typeof header === 'string' && isIP(header)) return header;
  return undefined;
}

function destination(request: AuthRequest): string {
  if (request.user?.id) return `user:${request.user.id}`;
  const email = request.body?.email;
  if (typeof email === 'string' && email.length <= 254) {
    const identifier = email.trim().toLowerCase().replace(/^@/, '');
    if (identifier) return `identifier:${identifier}`;
  }
  const idToken = request.body?.idToken;
  if (typeof idToken === 'string' && idToken.length > 0 && idToken.length <= 8192) {
    return `credential:${createHash('sha256').update(idToken).digest('hex')}`;
  }
  return 'unknown';
}

export function authThrottling(onRender: boolean, secret?: string): ThrottlerModuleOptions {
  if (secret !== undefined && !/^[a-f0-9]{64}$/.test(secret)) {
    throw new Error('BACKEND_PROXY_SECRET must be a 64-character lowercase hex value');
  }
  const proxySecret = secret ? Buffer.from(secret, 'hex') : undefined;
  const visitor = (request: AuthRequest) => visitorIp(request, onRender, proxySecret);
  const clientKey = (request: AuthRequest, address = visitor(request)) =>
    normalizeIp(address ?? request.ip ?? 'unknown');
  const fromSharedWorker = (address?: string) =>
    !!address && normalizeIp(address, 128) === workerAddress;

  return [
    {
      name: 'auth',
      ttl: 60_000,
      limit: 10,
      getTracker: (req) => {
        const request = req as AuthRequest;
        const address = visitor(request);
        const client = clientKey(request, address);
        return fromSharedWorker(address) ? `${client}:${destination(request)}` : client;
      },
    },
    {
      name: 'worker',
      ttl: 60_000,
      limit: 40,
      skipIf: (context) => !fromSharedWorker(visitor(context.switchToHttp().getRequest())),
      getTracker: (req) => clientKey(req as AuthRequest),
    },
  ];
}
