import express from "express";
import { json } from "body-parser";

import { errorHandler } from "@nmstickets/common";
import { NotFoundError } from "@nmstickets/common";
import cookieSession from "cookie-session";
import { CreateTicketRouter } from "./routes/create-ticket";
import { ShowTicketRouter } from "./routes/show-ticket";
import { AllTicketsRouter } from "./routes/all-ticket";
const app = express();
app.set("trust proxy", true)
app.use(cookieSession({
    secure: process.env.NODE_ENV !== "test",
    signed: false
}))
app.use(json());
app.use(CreateTicketRouter)
app.use(ShowTicketRouter)
app.use(AllTicketsRouter)
app.use(() => {
    throw new NotFoundError();
})
app.use(errorHandler)

export { app }