import { Router, Request, Response } from "express"
import { BadRequestError, CustomError, NotAuthorizedError, NotFoundError, requireAuth, validateRequest } from "@nmstickets/common";
import { body } from "express-validator"
import { Ticket } from "../models/ticket-model";
import { TicketUpdatedPublisher } from "../events/publishers/TicketUpdatedPublisher";
import { natsWrapper } from "../nats-wrapper";
const router = Router();

router.put("/api/tickets/:id", requireAuth, [body("title").not().isEmpty().withMessage("Title is empty"), body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than zero")], validateRequest, async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) throw new NotFoundError()
    if (ticket.userId !== req.currentUser!.id) throw new NotAuthorizedError()
    if (ticket.orderId != undefined) throw new BadRequestError("Ticket is Reserved")
    ticket.set({
        title: req.body.title, price: req.body.price
    })
    await ticket.save();
    await new TicketUpdatedPublisher(natsWrapper.js).publish({
        id: ticket.id, price: ticket.price, userId: req.currentUser!.id,
        title: ticket.title,
        version: ticket.version,
    });
    res.status(200).send(ticket)
})

export { router as UpdateTicketRouter }