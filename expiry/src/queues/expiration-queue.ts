// src/queues/expiration-queue.ts
import { Queue, Worker, Job } from "bullmq"
import { OrderExpiredPublisher } from "../events/publishers/OrderExpiredPublisher"
import { natsWrapper } from "../nats-wrapper"

interface Payload {
    orderId: string
}

const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
}

const expirationQueue = new Queue<Payload>("order:expiration", { connection })

const expirationWorker = new Worker<Payload>(
    "order:expiration",
    async (job: Job<Payload>) => {
        await new OrderExpiredPublisher(natsWrapper.js).publish({
            orderId: job.data.orderId,
        })
        console.log(`ExpirationComplete published for order: ${job.data.orderId}`)
    },
    { connection }
)

expirationWorker.on("failed", (job, err) => {
    console.error(`Job failed for order ${job?.data.orderId}:`, err)
})

export { expirationQueue }