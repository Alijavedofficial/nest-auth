import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => [
        {
          name: 'custom-throttler',
          ttl: Number(configService.get<number>('THROTTLE_TTL')),
          limit: Number(configService.get<number>('THROTTLE_LIMIT')),
        },
      ],
    }),
  ],
})
export class CustomThrottlerModule {}
