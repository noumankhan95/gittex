import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { Order } from "./order-model";
import { OrderStatus } from "@nmstickets/common";
interface TicketAttrs {
    title: string;
    price: number;
    id: string;

}

export interface TicketDoc extends mongoose.Document {
    title: string;
    price: number;
    version: number;
    isReserved(): Promise<boolean>;
    id: string;
}

export interface TicketModel extends mongoose.Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc;
    findByEvent(event: { id: string; version: number }): Promise<TicketDoc | null>;
}
const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, {
    toJSON: {
        transform: (doc: any, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
        }
    }
})
TicketSchema.statics.findByEvent = (event: { id: string; version: number }) => {
    return Ticket.findOne({
        _id: event.id,
        version: event.version - 1,
    });
};
TicketSchema.statics.build = (attrs: TicketAttrs) => {
    return new Ticket({
        _id: attrs.id,    // explicitly set _id to tickets-service id
        title: attrs.title,
        price: attrs.price,
    });
}
TicketSchema.methods.isReserved = async function () {
    // this === the ticket document that we just called 'isReserved' on
    const existingOrder = await Order.findOne({
        ticket: this,
        status: {
            $in: [
                OrderStatus.Created,
                OrderStatus.AwaitingPayment,
                OrderStatus.Complete,
            ],
        },
    });

    return !!existingOrder;
};
TicketSchema.set("versionKey", "version")
TicketSchema.plugin(updateIfCurrentPlugin)
const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", TicketSchema);

export { Ticket }