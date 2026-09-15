import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search users by username query prefix/substring and return public profile + public habits
   */
  async searchUsers(query: string, currentUserId: string) {
    const cleanQuery = query.trim().replace(/^@/, '').toLowerCase();
    if (!cleanQuery || cleanQuery.length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        username: {
          contains: cleanQuery,
          mode: 'insensitive',
        },
        id: {
          not: currentUserId, // Don't search self
        },
        isEmailVerified: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        metadata: true,
        commitments: {
          where: {
            isPublic: true,
            isArchived: false,
          },
          select: {
            id: true,
            title: true,
            category: true,
            totalDays: true,
            currentStreak: true,
          },
        },
      },
      take: 10,
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.name || u.username,
      avatar: (u.metadata as any)?.avatar || 'assets/mero.png',
      publicHabits: u.commitments,
    }));
  }

  async getPublicProfile(username: string) {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { username: clean },
      select: {
        id: true,
        username: true,
        name: true,
        metadata: true,
        commitments: {
          where: {
            isPublic: true,
            isArchived: false,
          },
          select: {
            id: true,
            title: true,
            category: true,
            totalDays: true,
            currentStreak: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${clean} not found.`);
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.name || user.username,
      avatar: (user.metadata as any)?.avatar || 'assets/mero.png',
      publicHabits: user.commitments,
    };
  }
}
