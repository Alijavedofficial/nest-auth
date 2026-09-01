import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthCheckService,
    private readonly databaseHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Get('database')
  @HealthCheck()
  async checkDatabase(): Promise<HealthCheckResult> {
    return await this.healthService.check([
      async (): Promise<HealthIndicatorResult> =>
        await this.databaseHealthIndicator.pingCheck('database'),
    ]);
  }
}
