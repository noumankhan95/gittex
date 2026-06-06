import request from 'supertest';
import { app } from '../../app';
import { Ticket, TicketDoc } from '../../models/ticket-model';
import mongoose from 'mongoose';
import { Order } from '../../models/order-model';
import { OrderStatus } from '@nmstickets/common';
import jwt from 'jsonwebtoken';

describe('Show Order Route', () => {

    const buildTicket = async () => {
        const ticket = Ticket.build({
            id: new mongoose.Types.ObjectId().toHexString(),
            title: 'Concert',
            price: 20,
        });
        await ticket.save();
        return ticket;
    };

    const getUserIdFromCookie = (cookie: string[]) => {
        const sessionStr = Buffer.from(
            cookie[0]!.split('=')[1]!, 'base64'
        ).toString();
        const session = JSON.parse(sessionStr);
        const payload = jwt.decode(session.jwt) as { id: string };
        return payload.id;
    };


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
        const orderId = new mongoose.Types.ObjectId().toHexString();

        await request(app)
            .get(`/api/orders/${orderId}`)
            .send({})
            .expect(401);
    });

    it('fails with 404 if order not found', async () => {
        const cookie = global.signin();
        const fakeOrderId = new mongoose.Types.ObjectId().toHexString();

        await request(app)
            .get(`/api/orders/${fakeOrderId}`)
            .set('Cookie', cookie)
            .send({})
            .expect(404);
    });

    it('fails with 401 if user did not create the order', async () => {
        const ticket = await buildTicket();

        // user one creates order
        const cookieOne = global.signin();
        const userOneId = getUserIdFromCookie(cookieOne);
        const order = await createOrder(ticket, userOneId); // ✅ passing userId

        // user two tries to view it
        const cookieTwo = global.signin();
        await request(app)
            .get(`/api/orders/${order.id}`)
            .set('Cookie', cookieTwo)
            .send({})
            .expect(401);
    });

    it('returns the order if user owns it', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();
        const userId = getUserIdFromCookie(cookie); // ✅ extract userId

        const order = await createOrder(ticket, userId);

        const response = await request(app)
            .get(`/api/orders/${order.id}`)
            .set('Cookie', cookie)
            .send({})
            .expect(200);

        expect(response.body.id).toEqual(order.id);
    });

    it('returns order with populated ticket', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();
        const userId = getUserIdFromCookie(cookie);

        const order = await createOrder(ticket, userId);

        const response = await request(app)
            .get(`/api/orders/${order.id}`)
            .set('Cookie', cookie)
            .send({})
            .expect(200);

        expect(response.body.ticket.title).toEqual('Concert');
        expect(response.body.ticket.price).toEqual(20);
    });

    it('returns order with correct status', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();
        const userId = getUserIdFromCookie(cookie);

        const order = await createOrder(ticket, userId);

        const response = await request(app)
            .get(`/api/orders/${order.id}`)
            .set('Cookie', cookie)
            .send({})
            .expect(200);

        expect(response.body.status).toEqual('created');
    });
});