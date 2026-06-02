import { Listener, OrderCancelledEvent, Subjects } from "@nmstickets/common";
import { queueGroupName } from "./queue-group-name";
import { JsMsg } from "@nats-io/jetstream";
import { TicketUpdatedPublisher } from "../publishers/TicketUpdatedPublisher";
import { Ticket } from "../../models/ticket-model";
export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
    queueGroupName = queueGroupName;
    async onMessage(data: OrderCancelledEvent['data'], msg: JsMsg): Promise<void> {
        const ticket = await Ticket.findById(data.ticket.id);

        if (!ticket) {
            throw new Error('Ticket not found');
        }

        ticket.set({ orderId: undefined });
        await ticket.save();
        await new TicketUpdatedPublisher(this.client).publish({
            id: ticket.id,
            orderId: ticket.orderId!,
            userId: ticket.userId,
            price: ticket.price,
            title: ticket.title,
            version: ticket.version,
        });

        msg.ack();
    }
}