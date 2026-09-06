import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    const room = await this.prisma.room.create({
      data: {
        hostId: dto.hostId,
        hostToken: randomBytes(24).toString('hex'),
        title: dto.title,
        topic: dto.topic,
        schedule: dto.schedule,
      },
    });
    return { roomId: room.id, hostToken: room.hostToken };
  }

  async verifyHostToken(roomId: string, hostToken: string | undefined) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (!hostToken || hostToken !== room.hostToken) {
      throw new ForbiddenException('Invalid or missing host token');
    }
  }

  async getCumulativeLeaderboard(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const results = await this.prisma.result.findMany({
      where: { session: { roomId } },
      select: { userId: true, score: true },
    });

    const byUser = new Map<
      string,
      { totalScore: number; sessionsPlayed: number }
    >();
    for (const result of results) {
      const entry = byUser.get(result.userId) ?? {
        totalScore: 0,
        sessionsPlayed: 0,
      };
      entry.totalScore += result.score;
      entry.sessionsPlayed += 1;
      byUser.set(result.userId, entry);
    }

    const cumulative = Array.from(byUser.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.totalScore - a.totalScore);

    return { cumulative };
  }
}
