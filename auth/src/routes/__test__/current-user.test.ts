import request from "supertest"
import { app } from "../../app"

describe("Current User Route", () => {
    it('responds with the current user when logged in', async () => {
        const cookie = await global.signin();

        const response = await request(app)
            .get('/api/users/current-user')
            .set('Cookie', cookie)  // attach the session cookie
            .send()
            .expect(200);

        expect(response.body.currentUser.email).toEqual('test@test.com');
    });

    it('returns null if not authenticated', async () => {
        await request(app)
            .get('/api/users/current-user')
            .send()
            .expect(401);
    });


})