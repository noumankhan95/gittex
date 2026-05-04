import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator"
import { RequestValidationError } from "../errors/request-validation-error";
import { User } from "../models/user-schema";
import { BadRequestError } from "../errors/bad-request-error";
const router = Router();

router.post("/api/users/signup", [body("email").isEmail().withMessage("Email must be valid"), body("password").trim().isLength({ min: 5, max: 20 })], async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new RequestValidationError(errors.array())
    }
    const exisitingUser = await User.findOne({ email })
    if (exisitingUser) {
        throw new BadRequestError("Email Already in Use")
    }
    const user = User.build({ email, password })
    await user.save();
    res.status(201).send(user)
})
export { router as SignupRouter };