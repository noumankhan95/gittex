import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
    requireAuth,
    validateRequest,
    BadRequestError,
    NotAuthorizedError,
    NotFoundError,
    OrderStatus,
} from '@nmstickets/common';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';
import { randomBytes } from 'node:crypto';
import { Payment } from '../models/payment-model';
import { Order } from '../models/order-model';

const router = express.Router();

router.post(
    '/api/payments',
    requireAuth,
    [body('token').not().isEmpty(), body('orderId').not().isEmpty()],
    validateRequest,
    async (req: Request, res: Response) => {
        const { token, orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            throw new NotFoundError();
        }
        if (order.userId !== req.currentUser!.id) {
            throw new NotAuthorizedError();
        }
        if (order.status === OrderStatus.Cancelled) {
            throw new BadRequestError('Cannot pay for an cancelled order');
        }


        const payment = Payment.build({
            orderId,
            stripeId: randomBytes(12).toString(),
        });
        await payment.save();
        new PaymentCreatedPublisher(natsWrapper.js).publish({
            id: payment.id,
            orderId: payment.orderId,
            stripeId: payment.stripeId,
        });

        res.status(201).send({ id: payment.id });
    }
);

export { router as createChargeRouter };
