// src/events/listeners/__test__/OrderCancelledListener.test.ts
import mongoose from 'mongoose';
import { OrderCancelledListener } from '../OrderCancelledListener';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order-model';
import { OrderCancelledEvent, OrderStatus } from '@nmstickets/common';
import { JsMsg } from '@nats-io/jetstream';

const setup = async () => {
    const listener = new OrderCancelledListener(
        natsWrapper.js as any,
        natsWrapper.jsm as any
    );

    // create order at version 0
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 20,
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
    });
    await order.save();

    // event says version 1 — listener looks for version 0 (1-1=0) ✅
    const data: OrderCancelledEvent['data'] = {
        id: order.id,
        version: 1,
        ticket: {
            id: new mongoose.Types.ObjectId().toHexString(),
        },
    };

    const msg = { ack: jest.fn() } as unknown as JsMsg;

    return { listener, order, data, msg };
};

it('sets order status to cancelled', async () => {
    const { listener, order, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

it('does not ack if order not found', async () => {
    const { listener, data, msg } = await setup();

    data.id = new mongoose.Types.ObjectId().toHexString(); // non-existent

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    expect(msg.ack).not.toHaveBeenCalled();
});

it('does not process event out of order', async () => {
    const { listener, order, data, msg } = await setup();

    data.version = 5; // skip ahead — looks for version 4 which doesn't exist

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    const unchanged = await Order.findById(order.id);
    expect(unchanged!.status).toEqual(OrderStatus.Created); // still Created
    expect(msg.ack).not.toHaveBeenCalled();
});