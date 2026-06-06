import request from 'supertest';
import { app } from '../../app';
import { Ticket, TicketDoc } from '../../models/ticket-model';
import mongoose from 'mongoose';
import { Order } from '../../models/order-model';
import { OrderStatus } from '@nmstickets/common';
import jwt from 'jsonwebtoken';

describe('Index Orders Route', () => {

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
        await request(app)
            .get('/api/orders')
            .send({})
            .expect(401);
    });

    it('returns empty array if no orders', async () => {
        const cookie = global.signin();

        const response = await request(app)
            .get('/api/orders')
            .set('Cookie', cookie)
            .send({})
            .expect(200);

        expect(response.body).toHaveLength(0);
    });

    it('returns only orders for the signed in user', async () => {
        const ticketOne = await buildTicket();
        const ticketTwo = await buildTicket();
        const ticketThree = await buildTicket();

        const cookieOne = global.signin();
        const cookieTwo = global.signin();

        const userOneId = getUserIdFromCookie(cookieOne); // ✅
        const userTwoId = getUserIdFromCookie(cookieTwo); // ✅

        // user one creates 1 order
        await createOrder(ticketOne, userOneId);

        // user two creates 2 orders
        await createOrder(ticketTwo, userTwoId);
        await createOrder(ticketThree, userTwoId);

        const responseOne = await request(app)
            .get('/api/orders')
            .set('Cookie', cookieOne)
            .send({})
            .expect(200);

        expect(responseOne.body).toHaveLength(1);
        expect(responseOne.body[0].ticket.id).toEqual(ticketOne.id);

        const responseTwo = await request(app)
            .get('/api/orders')
            .set('Cookie', cookieTwo)
            .send({})
            .expect(200);

        expect(responseTwo.body).toHaveLength(2);
    });

    it('returns orders with populated ticket data', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();
        const userId = getUserIdFromCookie(cookie); // ✅

        await createOrder(ticket, userId);

        const response = await request(app)
            .get('/api/orders')
            .set('Cookie', cookie)
            .send({})
            .expect(200);

        expect(response.body[0].ticket.title).toEqual('Concert');
        expect(response.body[0].ticket.price).toEqual(20);
    });

    it('returns orders with correct status', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();
        const userId = getUserIdFromCookie(cookie); // ✅

        await createOrder(ticket, userId);

        const response = await request(app)
            .get('/api/orders')
            .set('Cookie', cookie)
            .send({})
            .expect(200);

        expect(response.body[0].status).toEqual('created');
    });
});