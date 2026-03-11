import express from "express"
import { signup, login } from "../controllers/userController.js"

const router = express.Router()

router.post("/ra-signup", (req, res) => signup(req, res, "ra"));
router.post("/ra-login", (req, res) => login(req, res, "ra"));

export default router;