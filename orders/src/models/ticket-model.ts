import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
interface TicketAttrs {
    title: string;
    price: number;
    userId: string;
}

export interface TicketDoc extends mongoose.Document {
    id: string;
    title: string;
    price: number;
    userId: string;
    version: number;
    orderId?: string;
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
TicketSchema.set("versionKey", "version")
TicketSchema.plugin(updateIfCurrentPlugin)
const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", TicketSchema);

export { Ticket }