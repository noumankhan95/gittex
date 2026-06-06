import mongoose from 'mongoose';
import { OrderCancelledListener } from '../OrderCancelledListener';
import { natsWrapper } from '../../../test/__mocks__/nats-wrapper';
import { Ticket } from '../../../models/ticket-model';
import { OrderCancelledEvent } from '@nmstickets/common';
import { JsMsg } from '@nats-io/jetstream';

const setup = async () => {
    // @ts-ignore
    const listener = new OrderCancelledListener(natsWrapper.js, natsWrapper.jsm);

    // create a ticket that is already reserved (has an orderId)
    const orderId = new mongoose.Types.ObjectId().toHexString();
    const ticket = Ticket.build({
        title: 'Concert',
        price: 20,
        userId: new mongoose.Types.ObjectId().toHexString(),
    });
    ticket.set({ orderId });
    await ticket.save();

    // fake OrderCancelled event data
    const data: OrderCancelledEvent['data'] = {
        id: orderId,
        version: 1,
        ticket: {
            id: ticket.id,
        },
    };

    // @ts-ignore
    const msg = { ack: jest.fn() } as unknown as JsMsg

    return { listener, ticket, orderId, data, msg };
};

it('clears the orderId of the ticket', async () => {
    const { listener, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toBeUndefined();
});

it('increments the ticket version', async () => {
    const { listener, ticket, data, msg } = await setup();
    const originalVersion = ticket.version;

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.version).toEqual(originalVersion + 1);
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

    data.ticket.id = new mongoose.Types.ObjectId().toHexString();

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    expect(msg.ack).not.toHaveBeenCalled();
});