import { OrderStatus, PaymentCreatedEvent } from '@nmstickets/common';
import { natsWrapper } from '../../../nats-wrapper';
import { PaymentCreatedListener } from '../PaymentChargedListener';
import { Order } from '../../../models/order-model';
import { Ticket } from '../../../models/ticket-model';
import mongoose from 'mongoose';
import { JsMsg } from '@nats-io/jetstream';

const setup = async () => {
    const listener = new PaymentCreatedListener(
        natsWrapper.js as any,
        natsWrapper.jsm as any
    );

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 10.99,
        title: 'Ticket#1',
    });
    await ticket.save();

    const order = Order.build({
        expiresAt: new Date(new Date().getTime() + 60000),
        status: OrderStatus.Created,
        ticket,
        userId: new mongoose.Types.ObjectId().toHexString(),
    });
    await order.save();

    const data: PaymentCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(),
        orderId: order.id,
        stripeId: new mongoose.Types.ObjectId().toHexString(),
    };

    const msg = { ack: jest.fn() } as unknown as JsMsg;

    return { listener, ticket, order, data, msg };
};

it('does not ack if order not found', async () => {
    const { data, listener, msg } = await setup();

    data.orderId = new mongoose.Types.ObjectId().toHexString(); // non-existent order

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    expect(msg.ack).not.toHaveBeenCalled();
});

it('updates order status to complete', async () => {
    const { data, listener, msg, order } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Complete);
});

it('acks the message', async () => {
    const { data, listener, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});