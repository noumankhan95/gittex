import express from "express";
import { json } from "body-parser";
import { SignupRouter } from "./routes/signup";
import { SigninRouter } from "./routes/signin";
import { SignoutRouter } from "./routes/signout";
import { CurrentUserRouter } from "./routes/current-user";
import { errorHandler } from "./middleware/error-handler";
import { NotFoundError } from "./errors/not-found";
import cookieSession from "cookie-session";
const app = express();
app.set("trust proxy", true)
app.use(cookieSession({
    secure: true,
    signed: false
}))
app.use(json());
app.use(SigninRouter)
app.use(SignupRouter)
app.use(SignoutRouter)
app.use(CurrentUserRouter)
app.use(() => {
    throw new NotFoundError();
})
app.use(errorHandler)

export { app }