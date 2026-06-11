import express from "express";
import { json } from "body-parser";

import { currentUser, errorHandler } from "@nmstickets/common";
import { NotFoundError } from "@nmstickets/common";
import cookieSession from "cookie-session";
import { CreateOrderRouter } from "./routes/create-order";
import { deleteOrderRouter } from "./routes/delete-order";
import { indexOrderRouter } from "./routes/index-order";
import { showOrderRouter } from "./routes/show-order";

const app = express();
app.set("trust proxy", true)
app.use(cookieSession({
    secure: process.env.NODE_ENV !== "test",
    signed: false
}))
app.use(json());
app.use(currentUser)
app.use(CreateOrderRouter)
app.use(deleteOrderRouter)
app.use(indexOrderRouter)
app.use(showOrderRouter)
app.use(() => {
    throw new NotFoundError();
})
app.use(errorHandler)

export { app }