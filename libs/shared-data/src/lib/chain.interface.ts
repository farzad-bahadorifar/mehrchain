import { CommitmentCalendar } from './commitment.interface';

export type ChainStatus =
  | 'ACTIVE'
  | 'RESTING'
  | 'FADING'
  | 'COMPLETED'
  | 'DORMANT'
  | 'DISCONNECTED';

export type ChainInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface ChainPartner {
  username: string | null;
  name?: string | null;
}

export interface ChainPartnerCommitment {
  title: string;
  category: 'health' | 'growth' | 'community' | 'environment' | string;
  consecutiveMissedDays?: number;
  isCompletedToday?: boolean;
  lastCompletedDate?: string | Date | null;
}

export interface ChainConnection {
  id: string;
  // Changes on explicit reconnection; absent only in legacy local caches.
  generationId?: string;
  userId: string;
  partnerId: string;
  userCommitmentId: string;
  partnerCommitmentId: string;
  status: ChainStatus;
  consecutiveMissedDays: number;
  lastPartnerActivityAt?: string | Date | null;
  lastNudgeSentAt?: string | Date | null;
  heartSent: boolean;
  heartSentAt?: string | Date | null;
  supportCards?: ChainSupportCard[];
  // Aggregate for the viewer's own habit; never identifies a supporter.
  receivedHeartCount?: number;
  calendar?: CommitmentCalendar;
  // The recipient's calendar controls this viewer's heart allowance.
  partnerCalendar?: CommitmentCalendar;
  createdAt: string | Date;
  archivedAt?: string | Date | null;
  partner?: ChainPartner;
  partnerCommitment?: ChainPartnerCommitment;
}

export interface ChainSupportCard {
  completionId: string;
  completedAt: string | Date;
  sentAt: string | Date | null;
  allowanceUsed: boolean;
}

export const DISCONNECT_REASONS = {
  TAKING_BREAK: "I'm taking a break from this chain.",
  DIFFERENT_ROUTINE: "I'm choosing a different routine.",
  OTHER: "I've decided to end this chain.",
  PREFER_NOT_TO_SHARE: 'Prefer not to share',
} as const;

export type DisconnectReason = keyof typeof DISCONNECT_REASONS;
export const DISCONNECT_NOTE_LIMIT = 500;
export const SYSTEM_DISCONNECT_MESSAGE =
  'This chain ended because a linked habit is no longer available.';

export interface DisconnectChainRequest {
  generationId: string;
  reason: DisconnectReason;
  note?: string;
}

export interface ChainDisconnectReceipt {
  id: string;
  partner: ChainPartner;
  recipientHabitTitle: string;
  reason: DisconnectReason | 'HABIT_UNAVAILABLE';
  note: string | null;
  createdAt: string | Date;
}

export interface ChainInvite {
  id: string;
  senderId: string;
  senderCommitmentId: string;
  inviteCode: string;
  status: ChainInviteStatus;
  acceptedById?: string | null;
  acceptedCommitmentId?: string | null;
  createdAt: string | Date;
  expiresAt: string | Date;
  sender?: ChainPartner;
  senderCommitment?: {
    title: string;
    category: string;
  };
}
