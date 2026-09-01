import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule.forRoot({ logger: false, errorLogStyle: 'pretty' })],
  controllers: [HealthController],
})
export class HealthModule {}
