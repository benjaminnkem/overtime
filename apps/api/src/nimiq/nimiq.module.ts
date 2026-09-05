import { Global, Module } from '@nestjs/common';
import { NimiqService } from './nimiq.service';
import { NimiqClientService } from './nimiq-client.service';

@Global()
@Module({
  providers: [NimiqService, NimiqClientService],
  exports: [NimiqService, NimiqClientService],
})
export class NimiqModule {}
