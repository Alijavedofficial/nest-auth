import { Module } from '@nestjs/common';
import { BaseModule } from './base/base.module';
import { CoreModule } from './core/core.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [BaseModule, CoreModule, UtilsModule],
})
export class AppModule {}
