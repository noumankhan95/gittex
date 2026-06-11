import request from "supertest"
import { app } from "../../app"
import { Ticket } from "../../models/ticket-model"
import mongoose from "mongoose"
import { natsWrapper } from "../../nats-wrapper"

describe("update tickets route handler", () => {
    const createTicket = async () => {
        const cookie = global.signin();
        const response = await request(app)
            .post('/api/tickets')
            .set('Cookie', cookie)
            .send({ title: 'Concert', price: 20 })
            .expect(200);

        return { id: response.body.id, cookie };
    };
    it("listens to update tickets", async () => {
        const cookie = global.signin();
        const id = new mongoose.Types.ObjectId().toHexString();
        const res = await request(app).put(`/api/tickets/${id}`).set("Cookie", cookie).send({})
        expect(res.status).not.toEqual(404)
    })
    it("Can be accessed only if user is signed in", async () => {
        const id = new mongoose.Types.ObjectId().toHexString();
        await request(app).put(`/api/tickets/${id}`)
            .send({})
            .expect(401);
    })
    it("returns with 400 if title is empty", async () => {
        const cookie = global.signin();
        const id = new mongoose.Types.ObjectId().toHexString();
        await request(app).put(`/api/tickets/${id}`).set("Cookie", cookie)
            .send({ title: "", price: 10 })
            .expect(400);
    })
    it("returns with 400 if price is zero", async () => {
        const cookie = global.signin();
        const id = new mongoose.Types.ObjectId().toHexString();
        await request(app).put(`/api/tickets/${id}`).set("Cookie", cookie)
            .send({ title: "1", price: 0 })
            .expect(400);
    })
    it("returns error if ticket is not found", async () => {
        const cookie = global.signin();
        const id = new mongoose.Types.ObjectId().toHexString();
        await request(app).put(`/api/tickets/${id}`).set("Cookie", cookie)
            .send({ title: "#1", price: 10 })
            .expect(404);
    })
    it("fails if accessed by user not authorized", async () => {
        const { id } = await createTicket()
        const otherCookie = global.signin();
        await request(app).put(`/api/tickets/${id}`).set("Cookie", otherCookie)
            .send({ title: "#1", price: 10 })
            .expect(401);
    })
    it("updates the ticket if all good", async () => {
        const { id, cookie } = await createTicket()
        await request(app).put(`/api/tickets/${id}`).set("Cookie", cookie)
            .send({ title: "#1", price: 20 })
            .expect(200);
        const ticket = await Ticket.findById(id)
        expect(ticket?.title).toEqual("#1")
        expect(ticket?.price).toEqual(20)
    })
    it("calls event after updating", async () => {
        const { id, cookie } = await createTicket();

        await request(app)
            .put(`/api/tickets/${id}`)
            .set('Cookie', cookie)
            .send({ title: 'Updated Concert', price: 99 })
            .expect(200);

        expect(natsWrapper.js.publish).toHaveBeenCalledTimes(2)
    })
    it("fails if ticket is reserved", async () => {
        const { id, cookie } = await createTicket();
        const ticket = await Ticket.findById(id);
        ticket!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
        await ticket!.save();
        await request(app)
            .put(`/api/tickets/${id}`)
            .set('Cookie', cookie)
            .send({ title: 'Updated', price: 99 })
            .expect(400);
    })
})