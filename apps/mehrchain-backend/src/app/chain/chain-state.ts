import { ChainStatus } from '@prisma/client';

/** UTC calendar calculation, independent of missed cron executions. */
export function chainState(
  connection: {
    status: ChainStatus;
    createdAt: Date;
    partnerCommitment: { lastCompletedDate: Date | null };
  },
  now = new Date(),
) {
  if (
    connection.status === ChainStatus.DISCONNECTED ||
    connection.status === ChainStatus.COMPLETED ||
    connection.status === ChainStatus.DORMANT
  )
    return null;
  const day = (d: Date) => Date.parse(d.toISOString().slice(0, 10));
  const last = connection.partnerCommitment.lastCompletedDate;
  const anchor = last && last > connection.createdAt ? last : connection.createdAt;
  const missed = Math.max(
    0,
    (day(now) - day(anchor)) / 86400000 - (last && last >= connection.createdAt ? 1 : 0),
  );
  const status =
    missed === 0
      ? ChainStatus.ACTIVE
      : missed === 1
        ? ChainStatus.RESTING
        : missed === 2
          ? ChainStatus.FADING
          : ChainStatus.DORMANT;
  return { status, consecutiveMissedDays: missed };
}
