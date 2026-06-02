import { OrderCreatedListener } from "./events/listeners/OrderCreatedListener"
import { natsWrapper } from "./nats-wrapper"
const start = async () => {

    if (!process.env.NATS_URL) {
        throw new Error("NATS_URL must be defined")
    }
    if (!process.env.REDIS_HOST) {
        throw new Error("REDIS_HOST must be defined")
    }
    try {
        await natsWrapper.connect(process.env.NATS_URL)
        process.on("SIGTERM", async () => await natsWrapper.gracefulShutdown())
        process.on("SIGINT", async () => await natsWrapper.gracefulShutdown())
        new OrderCreatedListener(natsWrapper.js, natsWrapper.jsm).listen()
    } catch (e) {
        console.log(e)
    }
}

start()
