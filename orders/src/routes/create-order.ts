import mongoose from "mongoose";
import { Router, Request, Response } from "express";
import {
    requireAuth,
    validateRequest,
    NotFoundError,
    BadRequestError
} from '@nmstickets/common';
import { body } from 'express-validator';

const router = Router();

router.post("/api/create-order", requireAuth, [
    body('ticketId')
        .not()
        .isEmpty()
        .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
        .withMessage('TicketId must be provided')
],
    validateRequest, async (req: Request, res: Response) => { 

        
    })



export { router as CreateOrderRouter }
