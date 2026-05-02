import express from "express";
import { json } from "body-parser";
import { SignupRouter } from "./routes/signup";
import { SigninRouter } from "./routes/signin";
import { SignoutRouter } from "./routes/signout";
import { CurrentUserRouter } from "./routes/current-user";
import { errorHandler } from "./middleware/error-handler";
const app = express();
app.use(json());
app.use(SigninRouter)
app.use(SignupRouter)
app.use(SignoutRouter)
app.use(CurrentUserRouter)
app.use(errorHandler)
app.listen(3000, () => {
    console.log("Listening on 3000")
})