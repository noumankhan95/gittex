import { Publisher, Subjects, OrderCreatedEvent } from "@nmstickets/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
}