import { Global, Module } from '@nestjs/common';
import { NimiqService } from './nimiq.service';

@Global()
@Module({
  providers: [NimiqService],
  exports: [NimiqService],
})
export class NimiqModule {}
