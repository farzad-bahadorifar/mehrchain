import { ChainStatus } from '@prisma/client';
import { chainState } from './chain-state';

describe('UTC chain state', () => {
  const connection = {
    status: ChainStatus.ACTIVE,
    createdAt: new Date('2026-10-01T12:00:00Z'),
    partnerCommitment: { lastCompletedDate: new Date('2026-10-02T23:59:59Z') },
  };
  it('catches up three missed days after a sleeping server and is repeatable', () => {
    const now = new Date('2026-10-06T00:00:00Z');
    expect(chainState(connection, now)).toEqual({
      status: ChainStatus.DORMANT,
      consecutiveMissedDays: 3,
    });
    expect(chainState(connection, now)).toEqual(chainState(connection, now));
  });
  it('does not count the current unfinished day as missed', () => {
    expect(chainState(connection, new Date('2026-10-03T23:59:59Z'))).toEqual({
      status: ChainStatus.ACTIVE,
      consecutiveMissedDays: 0,
    });
  });
  it("does not penalize an invitation created today for a partner's older gap", () => {
    expect(
      chainState(
        { ...connection, createdAt: new Date('2026-10-06T10:00:00Z') },
        new Date('2026-10-06T12:00:00Z'),
      ),
    ).toEqual({ status: ChainStatus.ACTIVE, consecutiveMissedDays: 0 });
  });
});
