import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order-model';
import { Ticket, TicketDoc } from '../../models/ticket-model';
import { OrderStatus } from '@nmstickets/common';
import { natsWrapper } from '../../nats-wrapper';  
import mongoose from 'mongoose';

describe('Delete Order Route', () => {

    const buildTicket = async () => {
        const ticket = Ticket.build({
            id: new mongoose.Types.ObjectId().toHexString(),
            title: 'Concert',
            price: 20,
        });
        await ticket.save();
        return ticket;
    };

    // userId param — so we control who owns the order
    const createOrder = async (ticket: TicketDoc, userId: string) => {
        const order = Order.build({
            expiresAt: new Date(new Date().getTime() + 150000),
            status: OrderStatus.Created,
            ticket,
            userId,
        });
        await order.save();
        return order;
    };

    it('requires user to be signed in', async () => {
        const ticket = await buildTicket();
        const order = await createOrder(ticket, new mongoose.Types.ObjectId().toHexString());

        await request(app)
            .delete(`/api/orders/${order.id}`)
            .send({})
            .expect(401);
    });

    it('fails with 404 if order not found', async () => {
        const cookie = global.signin();
        const fakeOrderId = new mongoose.Types.ObjectId().toHexString();

        await request(app)
            .delete(`/api/orders/${fakeOrderId}`)
            .set('Cookie', cookie)
            .send({})
            .expect(404);
    });

    it('fails with 401 if user did not create the order', async () => {
        const ticket = await buildTicket();

        // create order owned by a DIFFERENT user
        const otherUserId = new mongoose.Types.ObjectId().toHexString();
        const order = await createOrder(ticket, otherUserId);

        // sign in as a DIFFERENT user
        const cookie = global.signin();

        await request(app)
            .delete(`/api/orders/${order.id}`)
            .set('Cookie', cookie)
            .send({})
            .expect(401);
    });

    it('cancels the order if user owns it', async () => {
        const cookie = global.signin();

        // get the userId from the cookie
        // global.signin() generates a jwt with a specific userId
        // we need to create the order with that same userId
        const ticket = await buildTicket();

        // create order then try to cancel with same user
        const createResponse = await request(app)
            .post('/api/create-order')
            .set('Cookie', cookie)
            .send({ ticketId: ticket.id })
            .expect(201);

        // cancel it
        await request(app)
            .delete(`/api/orders/${createResponse.body.id}`)
            .set('Cookie', cookie)
            .send({})
            .expect(204);

        // verify status changed in DB
        const cancelledOrder = await Order.findById(createResponse.body.id);
        expect(cancelledOrder!.status).toEqual(OrderStatus.Cancelled);
    });

    it('publishes an OrderCancelled event', async () => {
        const cookie = global.signin();
        const ticket = await buildTicket();

        const createResponse = await request(app)
            .post('/api/create-order')
            .set('Cookie', cookie)
            .send({ ticketId: ticket.id })
            .expect(201);

        await request(app)
            .delete(`/api/orders/${createResponse.body.id}`)
            .set('Cookie', cookie)
            .send({})
            .expect(204);

        expect(natsWrapper.js.publish).toHaveBeenCalled();
    });
});