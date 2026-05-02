import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator"
const router = Router();

router.post("/api/users/signup", [body("email").isEmail().withMessage("Email must be valid"), body("password").trim().isLength({ min: 5, max: 20 })], (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array())
    }

    res.send("User created")
})
export { router as SignupRouter };