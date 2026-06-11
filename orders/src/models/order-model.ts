import mongoose from "mongoose";
import { OrderStatus } from "@nmstickets/common";
import { TicketDoc } from "./ticket-model"
interface OrderAttrs {
    ticket: TicketDoc;
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
}
export interface OrderDoc extends mongoose.Document {
    id: string;
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
    version: number;
}
export interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;

}
const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(OrderStatus),
            default: OrderStatus.Created,
        },
        expiresAt: {
            type: mongoose.Schema.Types.Date,
        },
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ticket',
        },
    },
    {
        toJSON: {
            transform(doc: any, ret: any) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
        optimisticConcurrency: true,
        versionKey: "version",
    }
);



orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order(attrs);
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
