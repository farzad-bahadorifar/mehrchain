export type ChainStatus =
  | 'ACTIVE'
  | 'RESTING'
  | 'FADING'
  | 'COMPLETED'
  | 'DORMANT'
  | 'DISCONNECTED';

export type ChainInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface ChainPartner {
  username: string;
  name?: string | null;
}

export interface ChainPartnerCommitment {
  title: string;
  category: 'health' | 'growth' | 'community' | 'environment' | string;
  consecutiveMissedDays?: number;
  lastCompletedDate?: string | Date | null;
}

export interface ChainConnection {
  id: string;
  userId: string;
  partnerId: string;
  userCommitmentId: string;
  partnerCommitmentId: string;
  status: ChainStatus;
  consecutiveMissedDays: number;
  lastPartnerActivityAt?: string | Date | null;
  lastNudgeSentAt?: string | Date | null;
  heartSent: boolean;
  createdAt: string | Date;
  archivedAt?: string | Date | null;
  partner?: ChainPartner;
  partnerCommitment?: ChainPartnerCommitment;
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
