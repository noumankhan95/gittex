import mongoose from 'mongoose';
import { OrderCreatedListener } from '../OrderCreatedListener';
import { natsWrapper } from '../../../test/__mocks__/nats-wrapper';
import { Ticket } from '../../../models/ticket-model';
import { OrderCreatedEvent, OrderStatus } from '@nmstickets/common';

const setup = async () => {
    // @ts-ignore
    const listener = new OrderCreatedListener(natsWrapper.js, natsWrapper.jsm);

    // create a ticket in tickets-service DB
    const ticket = Ticket.build({
        title: 'Concert',
        price: 20,
        userId: new mongoose.Types.ObjectId().toHexString(),
    });
    await ticket.save();

    // fake OrderCreated event data
    const data: OrderCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString(),
        expiresAt: new Date().toISOString(),
        ticket: {
            id: ticket.id,
            price: ticket.price,
        },
    };

    // @ts-ignore
    const msg = { ack: jest.fn() } as unknown as JsMsg;

    return { listener, ticket, data, msg };
};

it('sets the orderId of the ticket', async () => {
    const { listener, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toEqual(data.id);
});

it('increments the ticket version', async () => {
    const { listener, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.version).toEqual(ticket.version + 1);
});

it('publishes a ticket updated event', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.js.publish).toHaveBeenCalled();
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

it('does not ack if ticket not found', async () => {
    const { listener, data, msg } = await setup();

    // override with non-existent ticket id
    data.ticket.id = new mongoose.Types.ObjectId().toHexString();

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    expect(msg.ack).not.toHaveBeenCalled();
});