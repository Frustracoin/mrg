import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MrgModule } from './mrg/mrg.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
    MrgModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
