import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Address,
  Client,
  ClientConfiguration,
  KeyPair,
  TransactionBuilder,
  type ConsensusState,
  type PlainTransactionDetails,
} from '@nimiq/core';

const CONFIRMED_STATES = new Set(['included', 'confirmed']);

export interface DepositCheck {
  verified: boolean;
  reason?: string;
}

@Injectable()
export class NimiqClientService implements OnModuleInit {
  private readonly logger = new Logger(NimiqClientService.name);
  private client: Client | null = null;
  private consensusState: ConsensusState | 'uninitialized' = 'uninitialized';

  onModuleInit() {
    void this.connect();
  }

  private async connect() {
    try {
      const config = new ClientConfiguration();
      config.network(process.env.NIMIQ_NETWORK ?? 'TestAlbatross');
      this.client = await Client.create(config.build());
      await this.client.addConsensusChangedListener((state) => {
        this.consensusState = state;
        this.logger.log(`Nimiq consensus state: ${state}`);
      });
    } catch (error) {
      this.logger.error('Failed to start Nimiq client', error);
    }
  }

  isReady(): boolean {
    return this.consensusState === 'established';
  }

  private requireClient(): Client {
    if (!this.client || !this.isReady()) {
      throw new Error(
        `Nimiq client not ready (consensus state: ${this.consensusState}) — cannot verify deposits or send payouts right now`,
      );
    }
    return this.client;
  }

  /**
   * Checks that a claimed deposit transaction actually exists on-chain, paid
   * the expected custodial address at least the expected amount, and has
   * landed in a block (not just sitting in the mempool).
   */
  async verifyDeposit(
    txHash: string,
    expectedRecipient: string,
    minLuna: number,
  ): Promise<DepositCheck> {
    const client = this.requireClient();
    let tx: PlainTransactionDetails;
    try {
      tx = await client.getTransaction(txHash);
    } catch {
      return { verified: false, reason: 'transaction not found' };
    }

    if (!CONFIRMED_STATES.has(tx.state)) {
      return {
        verified: false,
        reason: `transaction state is "${tx.state}", not yet confirmed`,
      };
    }
    if (
      Address.fromAny(tx.recipient).toUserFriendlyAddress() !==
      expectedRecipient
    ) {
      return {
        verified: false,
        reason: 'recipient does not match the custodial address',
      };
    }
    if (tx.value < minLuna) {
      return {
        verified: false,
        reason: `value ${tx.value} luna is below the expected ${minLuna} luna`,
      };
    }

    return { verified: true };
  }

  /** Signs and broadcasts a payout transaction from the custodial wallet. Returns the tx hash. */
  async sendPayout(
    custodialKeyPair: KeyPair,
    recipientAddress: string,
    amountLuna: number,
  ): Promise<string> {
    const client = this.requireClient();
    const tx = TransactionBuilder.newBasic(
      custodialKeyPair.toAddress(),
      Address.fromUserFriendlyAddress(recipientAddress),
      BigInt(Math.round(amountLuna)),
      0n,
      await client.getHeadHeight(),
      await client.getNetworkId(),
    );
    tx.sign(custodialKeyPair, undefined);
    const details = await client.sendTransaction(tx);
    return details.transactionHash;
  }
}
