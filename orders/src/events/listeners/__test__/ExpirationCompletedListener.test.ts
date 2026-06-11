import { ExpirationCompleteEvent, OrderStatus } from "@nmstickets/common"
import { natsWrapper } from "../../../nats-wrapper"
import { ExpirationCompleteListener } from "../ExpirationCompletedListener"
import { Ticket } from "../../../models/ticket-model"
import { Order } from "../../../models/order-model"
import mongoose from "mongoose"
import { JsMsg } from "@nats-io/jetstream"

const setup = async () => {
    const listener = new ExpirationCompleteListener(natsWrapper.js, natsWrapper.jsm)
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 10.99,
        title: 'Ticket#1',
    });
    await ticket.save();

    const order = Order.build({
        expiresAt: new Date(new Date().getTime() + 60000),
        status: OrderStatus.Created,
        ticket,
        userId: new mongoose.Types.ObjectId().toHexString(),
    });
    await order.save();
    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id
    }
    const msg = { ack: jest.fn() } as unknown as JsMsg;
    return { msg, listener, data, order }
}

it('does not ack if order not found', async () => {
    const { data, listener, msg } = await setup();

    data.orderId = new mongoose.Types.ObjectId().toHexString(); // non-existent order

    try {
        await listener.onMessage(data, msg);
    } catch (err) { }

    expect(msg.ack).not.toHaveBeenCalled();
});

it('returns ack early if already paid', async () => {
    const { data, listener, msg, order } = await setup();
    order.set({ status: OrderStatus.Complete });
    await order.save();
    await listener.onMessage(data, msg);


    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Complete);
    expect(msg.ack).toHaveBeenCalled();

});

it("sets status to cancelled", async () => {
    const { data, listener, msg, order } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
})
it('publishes an OrderCancelled event', async () => {
    const { data, listener, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.js.publish).toHaveBeenCalled();
});
it('does not publish event if order already complete', async () => {
    const { data, listener, msg, order } = await setup();

    order.set({ status: OrderStatus.Complete });
    await order.save();

    await listener.onMessage(data, msg);
    expect(natsWrapper.js.publish).not.toHaveBeenCalled();
});