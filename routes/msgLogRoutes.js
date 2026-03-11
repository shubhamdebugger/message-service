import express from "express";
import {markAsSeen, getMessageStats, getUserStats} from "../controllers/msgLogsController.js";      
import { authorize } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/mark-seen", authorize("user"), markAsSeen);
router.get("/message-stats/:messageId", getMessageStats);
router.get("/user-stats/:userId", getUserStats);

export default router;