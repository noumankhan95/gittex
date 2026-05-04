import { Router } from "express";
import jwt from "jsonwebtoken"
import { currentUser } from "../middleware/current-user";
import { requireAuth } from "../middleware/require-auth";
const router = Router();

router.get("/api/users/current-user", currentUser, requireAuth, (req, res) => {

    res.send({ currentUser: req.currentUser || null })
})
export { router as CurrentUserRouter };