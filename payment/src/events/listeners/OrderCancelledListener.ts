import {
    OrderCancelledEvent,
    Subjects,
    Listener,
    OrderStatus,
} from '@nmstickets/common';
import { queueGroupName } from './queue-group-name';
import { JsMsg } from '@nats-io/jetstream';
import { Order } from '../../models/order-model';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCancelledEvent['data'], msg: JsMsg) {
        const order = await Order.findOne({
            _id: data.id,
            version: data.version - 1,
        });

        if (!order) {
            throw new Error('Order not found');
        }

        order.set({ status: OrderStatus.Cancelled });
        await order.save();

        msg.ack();
    }
}
