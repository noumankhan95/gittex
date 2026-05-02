import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator"
import { RequestValidationError } from "../errors/request-validation-error";
const router = Router();

router.post("/api/users/signup", [body("email").isEmail().withMessage("Email must be valid"), body("password").trim().isLength({ min: 5, max: 20 })], (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new RequestValidationError(errors.array())
    }

    res.send("User created")
})
export { router as SignupRouter };