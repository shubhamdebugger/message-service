import express from "express";
import {markAsSeen, getMessageStats, getUserStats} from "../controllers/msgLogsController.js";      
import { authorize } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/v1/mark-seen", authorize("user"), markAsSeen);
router.get("/v1/messages/:messageId", getMessageStats);
router.get("/v1/users/:userId", getUserStats);

export default router;