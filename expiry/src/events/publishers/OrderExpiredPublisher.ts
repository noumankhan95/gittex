import { Publisher, ExpirationCompleteEvent, Subjects } from "@nmstickets/common";

export class OrderExpiredPublisher extends Publisher<ExpirationCompleteEvent> {
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}