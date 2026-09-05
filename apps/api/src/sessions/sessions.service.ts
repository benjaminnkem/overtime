import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';

const PAYOUT_SPLIT = [0.5, 0.3, 0.2];

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(roomId: string, dto: CreateSessionDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const session = await this.prisma.session.create({
      data: {
        roomId,
        scheduledAt: new Date(dto.scheduledAt),
        entryFee: dto.entryFee,
        currency: dto.currency ?? 'NIM',
        minEntries: dto.minEntries ?? 3,
        questions: {
          create: dto.questions.map((q, index) => ({
            text: q.text,
            options: q.options,
            correctOption: q.correctOption,
            order: index,
            timeLimitSec: q.timeLimitSec ?? 15,
          })),
        },
      },
    });

    return { sessionId: session.id };
  }

  async join(sessionId: string, dto: JoinSessionDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    if (session.status !== 'scheduled') {
      throw new BadRequestException(
        `Session ${sessionId} is no longer open for entries`,
      );
    }

    const entry = await this.prisma.entry.create({
      data: { sessionId, userId: dto.walletAddress },
    });

    // TODO: replace with a real @nimiq/mini-app-sdk payment request once the
    // exact payment-request method is confirmed against the live Nimiq docs.
    const paymentRequest = {
      amount: session.entryFee,
      currency: session.currency,
      recipient: null as string | null,
    };

    return { entryId: entry.id, paymentRequest };
  }

  async settle(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { entries: { include: { answers: true } } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    if (session.status === 'settled' || session.status === 'refunded') {
      throw new BadRequestException(
        `Session ${sessionId} has already been settled`,
      );
    }

    if (session.entries.length < session.minEntries) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'refunded' },
      });
      // TODO: trigger real refund transactions via the shared nimiq-settlement module.
      return {
        refunded: true,
        entries: session.entries.map((entry) => ({
          userId: entry.userId,
          amount: session.entryFee,
        })),
      };
    }

    const ranked = session.entries
      .map((entry) => {
        const correct = entry.answers.filter((a) => a.isCorrect);
        return {
          userId: entry.userId,
          score: correct.length,
          totalAnsweredAtMs: correct.reduce(
            (sum, a) => sum + a.answeredAtMs,
            0,
          ),
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score || a.totalAnsweredAtMs - b.totalAnsweredAtMs,
      );

    const pool = Number(session.entryFee) * session.entries.length;
    const payoutCount = Math.min(PAYOUT_SPLIT.length, ranked.length);
    const splitSlice = PAYOUT_SPLIT.slice(0, payoutCount);
    const splitTotal = splitSlice.reduce((sum, share) => sum + share, 0);

    const results = await Promise.all(
      ranked.map((entrant, index) => {
        const rank = index + 1;
        const share = index < payoutCount ? splitSlice[index] / splitTotal : 0;
        const payoutAmount = share > 0 ? pool * share : null;
        return this.prisma.result.create({
          data: {
            sessionId,
            userId: entrant.userId,
            score: entrant.score,
            rank,
            payoutAmount,
            // TODO: replace with the real payout tx hash from nimiq-settlement.
            payoutTxHash: null,
          },
        });
      }),
    );

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'settled' },
    });

    return {
      results: results.map((r) => ({
        userId: r.userId,
        rank: r.rank,
        payoutAmount: r.payoutAmount,
        txHash: r.payoutTxHash,
      })),
    };
  }
}
