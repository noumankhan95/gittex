import { Publisher, TicketCreatedEvent } from "@nmstickets/common";
import { Subjects } from "@nmstickets/common";
export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;
}