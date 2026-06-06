import request from "supertest"
import { app } from "../../app"
import { Ticket } from "../../models/ticket-model"
import { natsWrapper } from "../../test/__mocks__/nats-wrapper"

describe("Create Ticket Route", () => {
    it("listens to new tickets", async () => {
        const res = await request(app).post("/api/tickets").send({})
        expect(res.status).not.toBeUndefined()
    })
    it("Can be accessed only if user is signed in", async () => {
        await request(app)
            .post('/api/tickets')
            .send({})
            .expect(401);
    })
    it("returns with 401 if title is empty", async () => {
        const cookie = global.signin()
        await request(app)
            .post('/api/tickets').set("Cookie", cookie)
            .send({ title: "", price: 10 })
            .expect(401);
    })
    it("returns with 401 if price is zero", async () => {
        const cookie = global.signin()

        await request(app)
            .post('/api/tickets').set("Cookie", cookie)
            .send({ title: "1", price: 0 })
            .expect(401);
    })
    it("returns 200 if all correct", async () => {
        const cookie = global.signin()

        await request(app)
            .post('/api/tickets').set("Cookie", cookie)
            .send({ title: "#1", price: 10 })
            .expect(200);
    })
    it("creates a ticket", async () => {
        const tickets = await Ticket.find({})
        expect(tickets.length).toEqual(0)
        const cookie = global.signin()

        await request(app)
            .post('/api/tickets').set("Cookie", cookie)
            .send({ title: "#1", price: 10 })
            .expect(200);
        const newtickets = await Ticket.find({})
        expect(newtickets.length).toEqual(1)
    })
    it("publishes an event after ticket is created", async () => {
        const cookie = global.signin()

        await request(app)
            .post('/api/tickets').set("Cookie", cookie)
            .send({ title: "#1", price: 10 })
            .expect(200);
        expect(natsWrapper.js.publish).toHaveBeenCalledTimes(1)
    })
})
