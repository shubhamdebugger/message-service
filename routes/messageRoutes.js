import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import { authorize } from "../middleware/authMiddleware.js";
const router = Router();

router.post("/send-message",authorize("ra"), sendMessage);
router.get("/get-message", getMessages)

export default router;
