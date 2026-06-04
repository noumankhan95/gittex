import {
    Subjects,
    Listener,
    PaymentCreatedEvent,
    OrderStatus,
} from '@nmstickets/common';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order-model';
import { JsMsg } from '@nats-io/jetstream';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: PaymentCreatedEvent['data'], msg: JsMsg) {
        const order = await Order.findById(data.orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        order.set({
            status: OrderStatus.Complete,
        });
        await order.save();

        msg.ack();
    }
}
