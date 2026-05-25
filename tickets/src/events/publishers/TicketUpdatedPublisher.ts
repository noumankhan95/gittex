import { Publisher, Subjects, TicketUpdated } from "@nmstickets/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdated> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}