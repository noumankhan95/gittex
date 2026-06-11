import express from "express";
import { json } from "body-parser";

import { currentUser, errorHandler } from "@nmstickets/common";
import { NotFoundError } from "@nmstickets/common";
import cookieSession from "cookie-session";
import { createChargeRouter } from "./routes/create-charge";
const app = express();
app.set("trust proxy", true)
app.use(cookieSession({
    secure: process.env.NODE_ENV !== "test",
    signed: false
}))
app.use(json());
app.use(currentUser)
app.use(createChargeRouter)
app.use(() => {
    throw new NotFoundError();
})
app.use(errorHandler)

export { app }