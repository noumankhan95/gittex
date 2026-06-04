import mongoose from "mongoose"
import { app } from "./app"
import { natsWrapper } from "./nats-wrapper"
import { TicketCreatedListener } from "./events/listeners/TicketCreatedListener"
import { TicketUpdatedListener } from "./events/listeners/TicketUpdatedListener"
import { ExpirationCompleteListener } from "./events/listeners/ExpirationCompletedListener"
import { PaymentCreatedListener } from "./events/listeners/PaymentChargedListener"
const start = async () => {
    if (!process.env.JWT_KEY) {
        throw new Error("JWT Must be defined")
    }
    if (!process.env.MONGO_URI) {
        throw new Error("Mongo URI must be defined")
    }
    if (!process.env.NATS_URL) {
        throw new Error("NATS_URL must be defined")
    }
    try {
        await natsWrapper.connect(process.env.NATS_URL)
        process.on("SIGTERM", async () => await natsWrapper.gracefulShutdown())
        process.on("SIGINT", async () => await natsWrapper.gracefulShutdown())
        await mongoose.connect(process.env.MONGO_URI)
        await new TicketCreatedListener(natsWrapper.js, natsWrapper.jsm).listen()
        await new TicketUpdatedListener(natsWrapper.js, natsWrapper.jsm).listen()
        await new ExpirationCompleteListener(natsWrapper.js, natsWrapper.jsm).listen()
        await new PaymentCreatedListener(natsWrapper.js, natsWrapper.jsm).listen()
    } catch (e) {
        console.log(e)
    }
    app.listen(3000, () => {
        console.log("Listening on 3000")
    })
}

start()
