import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { ThrottlerModuleOptions, normalizeIp } from '@nestjs/throttler';
import type { Request } from 'express';

type AuthRequest = Request & { user?: { id: string } };
const workerAddress = normalizeIp('2a06:98c0:3600::103', 128);

function renderVisitor(request: AuthRequest, onRender: boolean): string | undefined {
  const header = request.headers['cf-connecting-ip'];
  if (onRender && typeof header === 'string' && isIP(header)) return header;
  return undefined;
}

function clientKey(request: AuthRequest, onRender: boolean): string {
  return normalizeIp(renderVisitor(request, onRender) ?? request.ip ?? 'unknown');
}

function fromSharedWorker(request: AuthRequest, onRender: boolean): boolean {
  const address = renderVisitor(request, onRender);
  return !!address && normalizeIp(address, 128) === workerAddress;
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

export function authThrottling(onRender: boolean): ThrottlerModuleOptions {
  return [
    {
      name: 'auth',
      ttl: 60_000,
      limit: 10,
      getTracker: (req) => {
        const request = req as AuthRequest;
        const client = clientKey(request, onRender);
        return fromSharedWorker(request, onRender) ? `${client}:${destination(request)}` : client;
      },
    },
    {
      name: 'worker',
      ttl: 60_000,
      limit: 40,
      skipIf: (context) => !fromSharedWorker(context.switchToHttp().getRequest(), onRender),
      getTracker: (req) => clientKey(req as AuthRequest, onRender),
    },
  ];
}
