import express from "express";
import { getProfile, uploadUserAvatar, updateProfile, changePassword, getWorkspaceMembers } from "../controllers/user.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", getProfile);
router.post("/avatar", uploadUserAvatar);
router.patch("/profile", updateProfile);
router.patch("/change-password", changePassword);
router.get("/workspace/:workspaceId/members", getWorkspaceMembers);

export default router;
