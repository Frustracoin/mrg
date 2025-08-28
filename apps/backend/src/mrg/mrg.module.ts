import { Module } from '@nestjs/common';
import { MrgController } from './mrg.controller';
import { MrgService } from './mrg.service';

@Module({
    controllers: [MrgController],
    providers: [MrgService],
})
export class MrgModule {}
