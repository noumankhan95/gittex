import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator"
import { RequestValidationError } from "@nmstickets/common";
import { User } from "../models/user-schema";
import { BadRequestError } from "@nmstickets/common";
import jwt from "jsonwebtoken"
import { validateRequest } from "@nmstickets/common";
const router = Router();

router.post("/api/users/signup", [body("email").isEmail().withMessage("Email must be valid"), body("password").trim().isLength({ min: 5, max: 20 })], validateRequest, async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;

    const exisitingUser = await User.findOne({ email })
    if (exisitingUser) {
        throw new BadRequestError("Email Already in Use")
    }
    const user = User.build({ email, password })
    await user.save();

    const userJwt = jwt.sign({
        id: user._id,
        email: user.email
    }, process.env.JWT_KEY!)
    req.session = {
        jwt: userJwt
    }
    res.status(201).send(user)
})
export { router as SignupRouter };