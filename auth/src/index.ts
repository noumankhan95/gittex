import express from "express";
import { json } from "body-parser";
import { SignupRouter } from "./routes/signup";
import { SigninRouter } from "./routes/signin";
import { SignoutRouter } from "./routes/signout";
import { CurrentUserRouter } from "./routes/current-user";
import { errorHandler } from "./middleware/error-handler";
import { NotFoundError } from "./errors/not-found";
import mongoose from "mongoose"
import cookieSession from "cookie-session";
const app = express();
app.set("proxy", true)
app.use(cookieSession({
    secure: true,

}))
app.use(json());
app.use(SigninRouter)
app.use(SignupRouter)
app.use(SignoutRouter)
app.use(CurrentUserRouter)
app.get("*", () => {
    throw new NotFoundError();
})
app.use(errorHandler)
const start = async () => {
    try {
        await mongoose.connect("mongodb://auth-mongo-srv:27017/auth")
    } catch (e) {
        console.log(e)
    }
    app.listen(3000, () => {
        console.log("Listening on 3000")
    })
}

start()
