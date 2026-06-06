// src/routes/__test__/new.test.ts
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order-model';
import { Payment } from '../../models/payment-model';
import { OrderStatus } from '@nmstickets/common';
import { natsWrapper } from '../../nats-wrapper';
import mongoose from 'mongoose';

const buildOrder = async (userId: string, status = OrderStatus.Created) => {
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 20,
        status,
        userId,
        version: 0,
    });
    await order.save();
    return order;
};

describe('Create Payment Route', () => {

    it('fails with 401 if not signed in', async () => {
        await request(app)
            .post('/api/payments')
            .send({ token: 'tok_visa', orderId: 'abc' })
            .expect(401);
    });

    it('fails with 400 if token is missing', async () => {
        const { cookie } = global.signin();

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ orderId: new mongoose.Types.ObjectId().toHexString() })
            .expect(400);
    });

    it('fails with 400 if orderId is missing', async () => {
        const { cookie } = global.signin();

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ token: 'tok_visa' })
            .expect(400);
    });

    it('fails with 404 if order not found', async () => {
        const { cookie } = global.signin();

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({
                token: 'tok_visa',
                orderId: new mongoose.Types.ObjectId().toHexString(),
            })
            .expect(404);
    });

    it('fails with 401 if user does not own order', async () => {
        // order owned by a different user
        const order = await buildOrder(new mongoose.Types.ObjectId().toHexString());

        const { cookie } = global.signin(); // different user

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ token: 'tok_visa', orderId: order.id })
            .expect(401);
    });

    it('fails with 400 if order is cancelled', async () => {
        const { cookie, id: userId } = global.signin();

        const order = await buildOrder(userId, OrderStatus.Cancelled);

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ token: 'tok_visa', orderId: order.id })
            .expect(400);
    });

    it('creates a payment and returns 201', async () => {
        const { cookie, id: userId } = global.signin();

        const order = await buildOrder(userId);

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ token: 'tok_visa', orderId: order.id })
            .expect(201);

        const payment = await Payment.findOne({ orderId: order.id });
        expect(payment).toBeDefined();
        expect(payment!.orderId).toEqual(order.id);
        expect(payment!.stripeId).toBeDefined();
    });

    it('publishes a PaymentCreated event', async () => {
        const { cookie, id: userId } = global.signin();
        const order = await buildOrder(userId);

        await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ token: 'tok_visa', orderId: order.id })
            .expect(201);

        expect(natsWrapper.js.publish).toHaveBeenCalled();
    });

    it('returns payment id in response', async () => {
        const { cookie, id: userId } = global.signin();
        const order = await buildOrder(userId);

        const response = await request(app)
            .post('/api/payments')
            .set('Cookie', cookie)
            .send({ token: 'tok_visa', orderId: order.id })
            .expect(201);

        expect(response.body.id).toBeDefined();
    });
});