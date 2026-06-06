// src/events/listeners/__test__/OrderCreatedListener.test.ts
import mongoose from 'mongoose';
import { OrderCreatedListener } from '../OrderCreatedListener';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order-model';
import { OrderCreatedEvent, OrderStatus } from '@nmstickets/common';
import { JsMsg } from '@nats-io/jetstream';

const setup = async () => {
    const listener = new OrderCreatedListener(
        natsWrapper.js as any,
        natsWrapper.jsm as any
    );

    const data: OrderCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString(),
        expiresAt: new Date().toISOString(),
        ticket: {
            id: new mongoose.Types.ObjectId().toHexString(),
            price: 20,
        },
    };

    const msg = { ack: jest.fn() } as unknown as JsMsg;

    return { listener, data, msg };
};

it('creates an order in payments-service DB', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const order = await Order.findById(data.id);
    expect(order).toBeDefined();
    expect(order!.price).toEqual(data.ticket.price);
    expect(order!.status).toEqual(OrderStatus.Created);
    expect(order!.userId).toEqual(data.userId);
});

it('creates order with correct version', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const order = await Order.findById(data.id);
    expect(order!.version).toEqual(data.version);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

it('does not ack if order already exists', async () => {
    const { listener, data, msg } = await setup();

    // save order first
    const order = Order.build({
        id: data.id,
        price: data.ticket.price,
        status: data.status,
        userId: data.userId,
        version: data.version,
    });
    await order.save();

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    expect(msg.ack).not.toHaveBeenCalled();
});