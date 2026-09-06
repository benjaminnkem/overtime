import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NimiqService } from '../nimiq/nimiq.service';
import { NimiqClientService } from '../nimiq/nimiq-client.service';
import { RoomsService } from '../rooms/rooms.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';

const PAYOUT_SPLIT = [0.5, 0.3, 0.2];
const LUNA_PER_NIM = 100_000;

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nimiq: NimiqService,
    private readonly nimiqClient: NimiqClientService,
    private readonly rooms: RoomsService,
  ) {}

  async create(
    roomId: string,
    dto: CreateSessionDto,
    hostToken: string | undefined,
  ) {
    await this.rooms.verifyHostToken(roomId, hostToken);

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

  async findOne(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { entries: true } } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return {
      id: session.id,
      roomId: session.roomId,
      scheduledAt: session.scheduledAt,
      entryFee: session.entryFee,
      currency: session.currency,
      status: session.status,
      minEntries: session.minEntries,
      entryCount: session._count.entries,
    };
  }

  async findAllByRoom(roomId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { roomId },
      include: { _count: { select: { entries: true } } },
      orderBy: { scheduledAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      roomId: session.roomId,
      scheduledAt: session.scheduledAt,
      entryFee: session.entryFee,
      currency: session.currency,
      status: session.status,
      minEntries: session.minEntries,
      entryCount: session._count.entries,
    }));
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

    const paymentRequest = {
      amount: session.entryFee,
      amountLuna: Math.round(Number(session.entryFee) * LUNA_PER_NIM),
      currency: session.currency,
      recipient: this.nimiq.getCustodialAddress(),
    };

    return { entryId: entry.id, paymentRequest };
  }

  async recordDeposit(entryId: string, depositTxHash: string) {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { session: true },
    });
    if (!entry) {
      throw new NotFoundException(`Entry ${entryId} not found`);
    }

    const custodialAddress = this.nimiq.getCustodialAddress();
    const minLuna = Math.round(Number(entry.session.entryFee) * LUNA_PER_NIM);

    let depositVerified = false;
    if (custodialAddress) {
      try {
        const check = await this.nimiqClient.verifyDeposit(
          depositTxHash,
          custodialAddress,
          minLuna,
        );
        depositVerified = check.verified;
        if (!check.verified) {
          this.logger.warn(
            `Deposit ${depositTxHash} for entry ${entryId} did not verify: ${check.reason}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Could not verify deposit ${depositTxHash} for entry ${entryId}: ${(error as Error).message}`,
        );
      }
    }

    await this.prisma.entry.update({
      where: { id: entryId },
      data: { depositTxHash, depositVerified },
    });

    return { entryId, depositTxHash, depositVerified };
  }

  async settle(sessionId: string, hostToken: string | undefined) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { entries: { include: { answers: true } } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    await this.rooms.verifyHostToken(session.roomId, hostToken);
    if (session.status === 'settled' || session.status === 'refunded') {
      throw new BadRequestException(
        `Session ${sessionId} has already been settled`,
      );
    }

    const custodialKeyPair = this.nimiq.getCustodialKeyPair();

    if (session.entries.length < session.minEntries) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'refunded' },
      });

      const entries = await Promise.all(
        session.entries.map(async (entry) => {
          const amountLuna = Math.round(
            Number(session.entryFee) * LUNA_PER_NIM,
          );
          const txHash = await this.trySendPayout(
            custodialKeyPair,
            entry.userId,
            amountLuna,
          );
          return { userId: entry.userId, amount: session.entryFee, txHash };
        }),
      );

      return { refunded: true, entries };
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
      ranked.map(async (entrant, index) => {
        const rank = index + 1;
        const share = index < payoutCount ? splitSlice[index] / splitTotal : 0;
        const payoutAmount = share > 0 ? pool * share : null;
        const payoutTxHash =
          payoutAmount !== null
            ? await this.trySendPayout(
                custodialKeyPair,
                entrant.userId,
                Math.round(payoutAmount * LUNA_PER_NIM),
              )
            : null;

        return this.prisma.result.create({
          data: {
            sessionId,
            userId: entrant.userId,
            score: entrant.score,
            rank,
            payoutAmount,
            payoutTxHash,
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

  /**
   * Attempts a real payout transaction; returns null (rather than throwing)
   * when the custodial wallet isn't configured or the Nimiq client isn't
   * connected, so settlement still completes with computed amounts even
   * when the on-chain send can't happen right now.
   */
  private async trySendPayout(
    custodialKeyPair: ReturnType<NimiqService['getCustodialKeyPair']>,
    recipientAddress: string,
    amountLuna: number,
  ): Promise<string | null> {
    if (!custodialKeyPair || amountLuna <= 0) return null;
    try {
      return await this.nimiqClient.sendPayout(
        custodialKeyPair,
        recipientAddress,
        amountLuna,
      );
    } catch (error) {
      this.logger.warn(
        `Could not send payout to ${recipientAddress}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
