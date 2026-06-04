import { Listener, Subjects, TicketUpdatedEvent } from "@nmstickets/common";
import { queueGroupName } from "./queue-group-name";
import { JsMsg } from "@nats-io/jetstream";
import { Ticket } from "../../models/ticket-model";
export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: TicketUpdatedEvent['data'], msg: JsMsg): Promise<void> {
        const existingTicket = await Ticket.findByEvent(data);
        if (!existingTicket) {
            throw new Error("Ticket Doesnt Exist")
        }
        const { title, price } = data;
        existingTicket.set({ title, price });
        await existingTicket.save();

        msg.ack();
    }
}