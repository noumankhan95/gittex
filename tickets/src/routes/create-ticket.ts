import { Router, Request, Response } from "express"
import { requireAuth, validateRequest } from "@nmstickets/common";
import { body } from "express-validator"
import { Ticket } from "../models/ticket-model";
const router = Router();

router.post("/api/tickets", requireAuth, [body("title").not().isEmpty().withMessage("Title is empty"), body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than zero")], validateRequest, async (req: Request, res: Response) => {
    const { title, price } = req.body

    const ticket = Ticket.build({
        title, price, userId: req.currentUser!.id
    })
    await ticket.save();
    res.status(200).send(ticket)
})

export { router as CreateTicketRouter }