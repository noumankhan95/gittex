import mongoose from 'mongoose';
import { TicketCreatedListener } from '../TicketCreatedListener';
import { natsWrapper } from '../../../nats-wrapper';
import { TicketCreatedEvent } from '@nmstickets/common';
import { JsMsg } from '@nats-io/jetstream';
import { Ticket } from '../../../models/ticket-model';

const setup = async () => {
    const listener = new TicketCreatedListener(
        natsWrapper.js as any,
        natsWrapper.jsm as any
    );
    const data: TicketCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(), 
        price: 10.99,
        title: 'Ticket#1',
        userId: new mongoose.Types.ObjectId().toHexString(), 
        version: 0,
    };
    const msg = { ack: jest.fn() } as unknown as JsMsg;
    return { listener, data, msg };
};

it('creates a ticket locally', async () => {
    const { data, listener, msg } = await setup();
    await listener.onMessage(data, msg);
    const ticket = await Ticket.findById(data.id);
    expect(ticket!.id).toEqual(data.id);
});

it('constructs ticket locally with correct data', async () => {
    const { data, listener, msg } = await setup();
    await listener.onMessage(data, msg);
    const ticket = await Ticket.findById(data.id);
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
    expect(ticket!.version).toEqual(0);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();
    await listener.onMessage(data, msg);
    expect(msg.ack).toHaveBeenCalled();
});

it('does not ack if ticket already exists', async () => { 
    const { listener, data, msg } = await setup();
    const ticket = Ticket.build({
        id: data.id,
        price: data.price,
        title: data.title,
    });
    await ticket.save();
    try {
        await listener.onMessage(data, msg);
    } catch (err) { }
    expect(msg.ack).not.toHaveBeenCalled();
});