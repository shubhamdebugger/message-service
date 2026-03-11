import express from "express"
import { signup, login } from "../controllers/userController.js"

const router = express.Router()

router.post("/signup",(req, res) => signup(req, res, "user"));
router.post("/login", (req, res) => login(req, res, "user"));

export default router;