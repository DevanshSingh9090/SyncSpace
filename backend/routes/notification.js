import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers/notification.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getNotifications);
router.patch("/:notificationId/read", validateRequest({ params: z.object({ notificationId: z.string() }) }), markAsRead);
router.patch("/mark-all-read", markAllAsRead);
router.delete("/:notificationId", validateRequest({ params: z.object({ notificationId: z.string() }) }), deleteNotification);
export default router;
