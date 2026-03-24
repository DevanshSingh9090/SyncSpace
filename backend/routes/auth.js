import express from "express";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import { registerSchema, loginSchema, verifyEmailSchema, emailSchema, resetPasswordSchema } from "../libs/validate-schema.js";
import { registerUser, loginUser, verifyEmail, resetPasswordRequest, verifyResetPasswordTokenAndResetPassword, enable2FA, verify2FA, disable2FA } from "../controllers/auth-controller.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();
router.post("/register", validateRequest({ body: registerSchema }), registerUser);
router.post("/login", validateRequest({ body: loginSchema }), loginUser);
router.post("/verify-email", validateRequest({ body: verifyEmailSchema }), verifyEmail);
router.post("/forgot-password", validateRequest({ body: emailSchema }), resetPasswordRequest);
router.post("/reset-password", validateRequest({ body: resetPasswordSchema }), verifyResetPasswordTokenAndResetPassword);

// 2FA routes (protected)
router.post("/2fa/enable", authMiddleware, enable2FA);
router.post("/2fa/verify", authMiddleware, validateRequest({ body: z.object({ otp: z.string().length(6) }) }), verify2FA);
router.post("/2fa/disable", authMiddleware, disable2FA);

export default router;
