import { Listener, Subjects, TicketCreatedEvent } from "@nmstickets/common";
import { queueGroupName } from "./queue-group-name";
import { JsMsg } from "@nats-io/jetstream";
import { Ticket } from "../../models/ticket-model";
export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: { id: string; version: number; title: string; price: number; userId: string; }, msg: JsMsg): Promise<void> {
        const existingTicket = await Ticket.findById({ id: data.id })
        if (existingTicket) {
            throw new Error("Ticket Exists")
        }
        const ticket = Ticket.build({
            price: data.price,
            title: data.title,
            userId: data.userId
        })
        await ticket.save();
        msg.ack()
    }
}