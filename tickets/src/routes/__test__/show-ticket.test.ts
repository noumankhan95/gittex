import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

describe('Show Ticket Route', () => {
    it('returns 404 if ticket not found', async () => {
        const id = new mongoose.Types.ObjectId().toHexString();

        await request(app)
            .get(`/api/tickets/${id}`)
            .send()
            .expect(404);
    });

    it('returns the ticket if found', async () => {
        const cookie = global.signin();

        // create a ticket first
        const createResponse = await request(app)
            .post('/api/tickets')
            .set('Cookie', cookie)
            .send({ title: 'Concert', price: 20 })
            .expect(200);

        // fetch it by id
        const showResponse = await request(app)
            .get(`/api/tickets/${createResponse.body.id}`)
            .send()
            .expect(200);

        expect(showResponse.body.title).toEqual('Concert');
        expect(showResponse.body.price).toEqual(20);
    });
});