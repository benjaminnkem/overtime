import { Injectable, Logger } from '@nestjs/common';
import { KeyPair, PrivateKey } from '@nimiq/core';

@Injectable()
export class NimiqService {
  private readonly logger = new Logger(NimiqService.name);
  private readonly custodialKeyPair: KeyPair | null;
  private readonly custodialAddress: string | null;

  constructor() {
    const privateKeyHex = process.env.NIMIQ_CUSTODIAL_PRIVATE_KEY;
    if (!privateKeyHex) {
      this.logger.warn(
        'NIMIQ_CUSTODIAL_PRIVATE_KEY not set — entry-fee payments have no recipient address',
      );
      this.custodialKeyPair = null;
      this.custodialAddress = null;
      return;
    }
    this.custodialKeyPair = KeyPair.derive(PrivateKey.fromHex(privateKeyHex));
    this.custodialAddress = this.custodialKeyPair
      .toAddress()
      .toUserFriendlyAddress();
  }

  getCustodialAddress(): string | null {
    return this.custodialAddress;
  }

  getCustodialKeyPair(): KeyPair | null {
    return this.custodialKeyPair;
  }
}
