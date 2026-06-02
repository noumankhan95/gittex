import { Listener, OrderCreatedEvent, OrderStatus, Subjects } from "@nmstickets/common";
import { queueGroupName } from "./queue-group-name";
import { JsMsg } from "@nats-io/jetstream";
import { expirationQueue } from "../../queues/expiration-queue"
export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;
    onMessage(data: { id: string; version: number; status: OrderStatus; userId: string; expiresAt: string; ticket: { id: string; price: number; }; }, msg: JsMsg): void {
        const delay = new Date(data.expiresAt).getTime() - (new Date().getTime())
        expirationQueue.add(queueGroupName, { orderId: data.id }, { delay })
        msg.ack()
    }
}