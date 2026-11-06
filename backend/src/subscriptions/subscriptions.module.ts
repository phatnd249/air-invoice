import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DeliveryModule, QueueModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
