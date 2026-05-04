import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator"
import { RequestValidationError } from "../errors/request-validation-error";
import { User } from "../models/user-schema";
import { BadRequestError } from "../errors/bad-request-error";
import jwt from "jsonwebtoken"
import { validateRequest } from "../middleware/validate-request";
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