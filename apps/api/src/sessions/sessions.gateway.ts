import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

interface JoinPayload {
  sessionId: string;
}

interface StartQuestionPayload {
  sessionId: string;
  questionIndex: number;
}

interface AnswerPayload {
  sessionId: string;
  entryId: string;
  questionId: string;
  selectedOption: string;
}

interface ActiveQuestion {
  questionId: string;
  broadcastAtMs: number;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class SessionsGateway {
  @WebSocketServer()
  server: Server;

  private readonly activeQuestions = new Map<string, ActiveQuestion>();

  constructor(private readonly prisma: PrismaService) {}

  @SubscribeMessage('session:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    await client.join(payload.sessionId);
  }

  @SubscribeMessage('host:startQuestion')
  async handleStartQuestion(@MessageBody() payload: StartQuestionPayload) {
    const questions = await this.prisma.question.findMany({
      where: { sessionId: payload.sessionId },
      orderBy: { order: 'asc' },
    });
    const question = questions[payload.questionIndex];
    if (!question) return;

    const broadcastAtMs = Date.now();
    this.activeQuestions.set(payload.sessionId, {
      questionId: question.id,
      broadcastAtMs,
    });

    this.server.to(payload.sessionId).emit('question', {
      question: {
        id: question.id,
        text: question.text,
        options: question.options,
        timeLimitSec: question.timeLimitSec,
      },
      index: payload.questionIndex,
      total: questions.length,
      broadcastAtMs,
    });
  }

  @SubscribeMessage('answer')
  async handleAnswer(@MessageBody() payload: AnswerPayload) {
    const active = this.activeQuestions.get(payload.sessionId);
    if (!active || active.questionId !== payload.questionId) return;

    const question = await this.prisma.question.findUnique({
      where: { id: payload.questionId },
    });
    if (!question) return;

    const answeredAtMs = Date.now() - active.broadcastAtMs;
    const isCorrect = payload.selectedOption === question.correctOption;

    await this.prisma.answer.create({
      data: {
        entryId: payload.entryId,
        questionId: payload.questionId,
        selectedOption: payload.selectedOption,
        answeredAtMs,
        isCorrect,
      },
    });

    const rankings = await this.computeLeaderboard(payload.sessionId);
    this.server.to(payload.sessionId).emit('leaderboard', { rankings });
  }

  private async computeLeaderboard(sessionId: string) {
    const entries = await this.prisma.entry.findMany({
      where: { sessionId },
      include: { answers: true },
    });

    return entries
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
      )
      .map((entrant, index) => ({
        userId: entrant.userId,
        score: entrant.score,
        rank: index + 1,
      }));
  }
}
