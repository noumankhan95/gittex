import { Subjects } from "./Subjects";

export interface TicketUpdated {
    subject: Subjects.TicketUpdated,
    data: {
        id: string;
        version: number;
        title: string;
        price: number;
        userId: string;
        orderId?: string;
    }

}