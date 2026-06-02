import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { Order } from "./order-model";
import { OrderStatus } from "@nmstickets/common";
interface TicketAttrs {
    title: string;
    price: number;
    userId: string;
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
}
const TicketSchema = new mongoose.Model({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
    }
}, {
    toJSON: {
        transform: (doc: any, ret: any) => {
            ret.id = ret.id;
            delete ret._id;
        }
    }
})

TicketSchema.statics.build = (attrs: TicketAttrs) => {
    return new Ticket(attrs);
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