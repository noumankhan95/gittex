import request from 'supertest';
import { app } from '../../app';

describe('All Tickets Route', () => {
    const createTicket = async (title: string, price: number) => {
        const cookie = global.signin();
        await request(app)
            .post('/api/tickets')
            .set('Cookie', cookie)
            .send({ title, price })
            .expect(200);
    };

    it('returns empty array if no tickets', async () => {
        const response = await request(app)
            .get('/api/tickets')
            .send()
            .expect(200);

        expect(response.body).toHaveLength(0);
    });

    it('returns all tickets', async () => {
        await createTicket('Concert', 20);
        await createTicket('Festival', 50);
        await createTicket('Show', 30);

        const response = await request(app)
            .get('/api/tickets')
            .send()
            .expect(200);

        expect(response.body).toHaveLength(3);
    });
});