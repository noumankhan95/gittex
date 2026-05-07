import express from "express";
import { json } from "body-parser";

import { errorHandler } from "@nmstickets/common";
import { NotFoundError } from "@nmstickets/common";
import cookieSession from "cookie-session";
const app = express();
app.set("trust proxy", true)
app.use(cookieSession({
    secure: true,
    signed: false
}))
app.use(json());

app.use(() => {
    throw new NotFoundError();
})
app.use(errorHandler)

export { app }