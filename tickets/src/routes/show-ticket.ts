import { Router, Request, Response } from "express"
import { Ticket } from "../models/ticket-model"
import { NotFoundError } from "@nmstickets/common";

const router = Router()

router.get("/api/tickets/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    const ticket = await Ticket.findById(id)
    if (!ticket) throw new NotFoundError();

    res.send(ticket)
})


export { router as ShowTicketRouter }