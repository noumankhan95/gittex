import { Listener, OrderCreatedEvent, Subjects } from "@nmstickets/common";
import { queueGroupName } from "./queue-group-name"
import { JsMsg } from "@nats-io/jetstream";
import { Ticket } from "../../models/ticket-model";
import { TicketUpdatedPublisher } from "../publishers/TicketUpdatedPublisher";
export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: OrderCreatedEvent['data'], msg: JsMsg): Promise<void> {
        const ticket = await Ticket.findById(data.ticket.id)
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Mark the ticket as being reserved by setting its orderId property
        ticket.set({ orderId: data.id });
        await ticket.save();
        await new TicketUpdatedPublisher(this.client).publish({
            id: ticket.id,
            price: ticket.price,
            title: ticket.title,
            userId: ticket.userId,
            orderId: ticket.orderId,
            version: ticket.version,
        });

        // ack the message
        msg.ack();
    }
}