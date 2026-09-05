import { IsNotEmpty, IsString } from 'class-validator';

export class RecordDepositDto {
  @IsString()
  @IsNotEmpty()
  depositTxHash: string;
}
