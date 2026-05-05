import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest } from "@nmstickets/common";
import { User } from "../models/user-schema";
import { BadRequestError } from "@nmstickets/common";
import { Password } from "../services/password";
import jwt from "jsonwebtoken"

const router = Router();

router.post("/api/users/signin", [body("email").isEmail().withMessage("Email Must be valid"), body("password").trim().notEmpty().withMessage("You must provide a password")], validateRequest, async (req: Request, res: Response) => {
    const exisitingUser = await User.findOne({ email: req.body.email })
    if (!exisitingUser) {
        throw new BadRequestError("Invalid Credentials")
    }
    const passwordsMatch = await Password.compare(exisitingUser.password, req.body.password);
    if (!passwordsMatch) {
        throw new BadRequestError("Invalid Credentials")
    }
    const userJwt = jwt.sign({
        id: exisitingUser._id,
        email: exisitingUser.email
    }, process.env.JWT_KEY!)
    req.session = {
        jwt: userJwt
    }
    res.status(200).send(exisitingUser)
})
export { router as SigninRouter };