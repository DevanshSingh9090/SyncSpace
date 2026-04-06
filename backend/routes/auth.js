import express from "express";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  emailSchema,
  resetPasswordSchema,
  resend2FASchema,
} from "../libs/validate-schema.js";
import {
  registerUser,
  resendVerificationEmail,
  loginUser,
  resend2FAOtp,
  verifyEmail,
  resetPasswordRequest,
  verifyResetPasswordTokenAndResetPassword,
  enable2FA,
  verify2FA,
  disable2FA,
} from "../controllers/auth-controller.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.post("/register", validateRequest({ body: registerSchema }), registerUser);
router.post("/login", validateRequest({ body: loginSchema }), loginUser);
router.post("/verify-email", validateRequest({ body: verifyEmailSchema }), verifyEmail);
router.post("/resend-verification", validateRequest({ body: emailSchema }), resendVerificationEmail);   // Fix #1 & #3
router.post("/2fa/resend", validateRequest({ body: resend2FASchema }), resend2FAOtp);                   // Fix #2
router.post("/forgot-password", validateRequest({ body: emailSchema }), resetPasswordRequest);
router.post("/reset-password", validateRequest({ body: resetPasswordSchema }), verifyResetPasswordTokenAndResetPassword);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post("/2fa/enable", authMiddleware, enable2FA);
router.post("/2fa/verify", authMiddleware, validateRequest({ body: z.object({ otp: z.string().length(6) }) }), verify2FA);
router.post("/2fa/disable", authMiddleware, disable2FA);

export default router;
