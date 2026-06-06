import request from "supertest"
import { app } from "../../app"
import { Order } from "../../models/order-model";
import { OrderStatus } from "@nmstickets/common";
import { Ticket, TicketDoc } from "../../models/ticket-model";
import mongoose from "mongoose";
import { natsWrapper } from "../../nats-wrapper";

describe("Create Order Route", () => {
    const buildTicket = async () => {
        const ticket = Ticket.build({
            id: new mongoose.Types.ObjectId().toHexString(),
            title: 'Concert',
            price: 20,
        });
        await ticket.save();
        return ticket;
    };
  
    it("fails with 401 if user is not signed in", async () => {
        await request(app).post("/api/create-order").send({}).expect(401)
    })

    it("fails with 401 if no ticketId", async () => {
        const cookie = global.signin()
        await request(app).post("/api/create-order").set("Cookie", cookie).send({ ticketId: "not-valid" }).expect(401)
    })
    it("fails if ticket is already reserved", async () => {
        const cookie = global.signin()
        const ticket = await buildTicket();
        const existingOrder = Order.build({
            ticket,
            userId: new mongoose.Types.ObjectId().toHexString(),
            status: OrderStatus.Created,
            expiresAt: new Date(),
        });
        await existingOrder.save();

        await request(app).post("/api/create-order").set("Cookie", cookie).send({ ticketId: ticket.id }).expect(400)
    })

    it('creates an order for a valid ticket', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();

        // no orders exist yet
        let orders = await Order.find({});
        expect(orders.length).toEqual(0);

        await request(app)
            .post('/api/create-order')
            .set('Cookie', cookie)
            .send({ ticketId: ticket.id })
            .expect(201);

        // one order now exists
        orders = await Order.find({});
        expect(orders.length).toEqual(1);
        expect(orders[0]!.status).toEqual(OrderStatus.Created);
        expect(orders[0]!.ticket.toString()).toEqual(ticket.id);
    });
    it('creates an order with correct expiration', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();

        const response = await request(app)
            .post('/api/create-order')
            .set('Cookie', cookie)
            .send({ ticketId: ticket.id })
            .expect(201);

        // expiration should be ~60 seconds from now
        const expiresAt = new Date(response.body.expiresAt);
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();

        // should be close to 60 seconds (within 5 second margin)
        expect(diff).toBeGreaterThan(55 * 1000);
        expect(diff).toBeLessThan(65 * 1000);
    });
    it('publishes an OrderCreated event', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();

        await request(app)
            .post('/api/create-order')
            .set('Cookie', cookie)
            .send({ ticketId: ticket.id })
            .expect(201);

        expect(natsWrapper.js.publish).toHaveBeenCalled();
    });
    it('does not reserve ticket for cancelled orders', async () => {
        const ticket = await buildTicket();
        const cookie = global.signin();

        // create a CANCELLED order for this ticket
        const cancelledOrder = Order.build({
            ticket,
            userId: new mongoose.Types.ObjectId().toHexString(),
            status: OrderStatus.Cancelled,  // cancelled — isReserved() returns false
            expiresAt: new Date(),
        });
        await cancelledOrder.save();

        // should succeed — cancelled order doesn't block new orders
        await request(app)
            .post('/api/create-order')
            .set('Cookie', cookie)
            .send({ ticketId: ticket.id })
            .expect(201);
    });
})