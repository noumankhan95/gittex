import { TicketUpdatedEvent } from '@nmstickets/common';
import { natsWrapper } from '../../../nats-wrapper';
import { TicketUpdatedListener } from '../TicketUpdatedListener';
import { Ticket } from '../../../models/ticket-model';
import mongoose from 'mongoose';
import { JsMsg } from '@nats-io/jetstream';

const setup = async () => {
    const listener = new TicketUpdatedListener(
        natsWrapper.js as any,
        natsWrapper.jsm as any
    );

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 10.99,
        title: 'Ticket#1',
    });
    await ticket.save(); // version 0

    const data: TicketUpdatedEvent['data'] = {
        id: ticket.id,
        price: 99.99,
        title: 'Updated Ticket',
        version: ticket.version + 1,
        userId: new mongoose.Types.ObjectId().toHexString(),
    };

    const msg = { ack: jest.fn() } as unknown as JsMsg;
    return { listener, ticket, data, msg };
};

it('fails if no existing ticket', async () => {
    const { listener, data, msg } = await setup();
    data.id = new mongoose.Types.ObjectId().toHexString();
    try {
        await listener.onMessage(data, msg);
    } catch { }
    expect(msg.ack).not.toHaveBeenCalled();
});

it('succeeds if ticket exists', async () => {
    const { listener, data, msg } = await setup();
    await listener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(data.id);
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);
    expect(updatedTicket!.id).toEqual(data.id);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();
    await listener.onMessage(data, msg);
    expect(msg.ack).toHaveBeenCalled();
});

it('does not process event out of order', async () => {
    const { listener, data, msg, ticket } = await setup();
    data.version = 10;  // skip ahead — findByEvent won't find version 9
    try {
        await listener.onMessage(data, msg);
    } catch { }
    const unchanged = await Ticket.findById(data.id);
    expect(unchanged!.version).toEqual(ticket.version);  // still version 0
    expect(msg.ack).not.toHaveBeenCalled();
});