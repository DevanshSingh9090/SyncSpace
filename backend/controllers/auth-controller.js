import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Verification from "../models/verification.js";
import AuditLog from "../models/audit-log.js";
import { sendEmail } from "../libs/send-email.js";
import { AppError } from "../middleware/error-handler.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const VERIFICATION_TOKEN_TTL_MS = 60 * 60 * 1000;   // 1 hour
const RESEND_COOLDOWN_MS        = 60 * 1000;          // 60 seconds
const OTP_TTL_MS                = 10 * 60 * 1000;     // 10 minutes
const RESET_TOKEN_TTL_MS        = 15 * 60 * 1000;    // 15 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getClientMeta = (req) => ({
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

const audit = async (action, { userId = null, email = null, metadata = {}, req }) => {
  try {
    const { ipAddress, userAgent } = getClientMeta(req);
    await AuditLog.create({ userId, email, action, ipAddress, userAgent, metadata });
  } catch (err) {
    console.error("[AuditLog error]", err.message);
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    const existingUser = await User.findOne({ email });

    // Deadlock fix: allow re-registration of unverified accounts
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return next(new AppError("Email address already in use", 400, "EMAIL_IN_USE"));
      }
      await Verification.deleteMany({ userId: existingUser._id });
      await User.findByIdAndDelete(existingUser._id);
      await audit("unverified_user_replaced", { email, metadata: { replacedUserId: existingUser._id }, req });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({ email, password: hashPassword, name });

    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await Verification.create({
      userId: newUser._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailBody = `<p>Welcome to SyncSpace! Click <a href="${verificationLink}">here</a> to verify your email. This link expires in 1 hour.</p>`;
    const isEmailSent = await sendEmail(email, "Verify your email – SyncSpace", emailBody);
    if (!isEmailSent) {
      await User.findByIdAndDelete(newUser._id);
      await Verification.deleteMany({ userId: newUser._id });
      return next(new AppError("Failed to send verification email. Please try again.", 500, "EMAIL_SEND_FAILED"));
    }

    await audit("register", { userId: newUser._id, email, req });
    res.status(201).json({ message: "Verification email sent. Please check your inbox to activate your account." });
  } catch (error) {
    next(error);
  }
};

// ─── Resend Verification Email (Fix #1 & #3) ──────────────────────────────────
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: "If that email exists and is unverified, a new link has been sent." });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "This email is already verified. Please sign in." });
    }

    const existing = await Verification.findOne({ userId: user._id });
    if (existing) {
      const age = Date.now() - existing.createdAt.getTime();
      if (age < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - age) / 1000);
        await audit("verification_resend_cooldown", { userId: user._id, email, metadata: { waitSec }, req });
        return res.status(429).json({
          message: `Please wait ${waitSec} second(s) before requesting a new link.`,
          waitSeconds: waitSec,
        });
      }
      await Verification.findByIdAndDelete(existing._id);
    }

    const verificationToken = jwt.sign(
      { userId: user._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await Verification.create({
      userId: user._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail(email, "Verify your email – SyncSpace", `<p>Click <a href="${verificationLink}">here</a> to verify your email. This link expires in 1 hour.</p>`);

    await audit("verification_resent", { userId: user._id, email, req });
    res.status(200).json({ message: "Verification email resent. Please check your inbox." });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { email, password, otp } = req.body;
    const user = await User.findOne({ email }).select("+password +twoFAOtp +twoFAOtpExpires +twoFALastSent");

    if (!user) {
      await audit("login_failed", { email, metadata: { reason: "user_not_found" }, req });
      return next(new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS"));
    }

    if (!user.isEmailVerified) {
      const existingVerification = await Verification.findOne({ userId: user._id });
      if (existingVerification && existingVerification.expiresAt > new Date()) {
        return res.status(400).json({
          message: "Email not verified. Please check your inbox or request a new verification link.",
          code: "EMAIL_NOT_VERIFIED",
        });
      }
      if (existingVerification) await Verification.findByIdAndDelete(existingVerification._id);
      const verificationToken = jwt.sign(
        { userId: user._id, purpose: "email-verification" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      await Verification.create({
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      });
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendEmail(email, "Verify your email – SyncSpace", `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`);
      await audit("verification_resent", { userId: user._id, email, metadata: { trigger: "login_with_expired_token" }, req });
      return res.status(400).json({
        message: "Your verification link had expired — a new one has been sent to your inbox.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await audit("login_failed", { userId: user._id, email, metadata: { reason: "wrong_password" }, req });
      return next(new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS"));
    }

    if (user.is2FAEnabled) {
      if (!otp) {
        const code = generateOTP();
        user.twoFAOtp = code;
        user.twoFAOtpExpires = new Date(Date.now() + OTP_TTL_MS);
        user.twoFALastSent = new Date();
        await user.save();
        await sendEmail(email, "Your SyncSpace Login Code", `<p>Your verification code is: <strong>${code}</strong>. It expires in 10 minutes.</p>`);
        await audit("login_2fa_sent", { userId: user._id, email, req });
        return res.status(200).json({ requires2FA: true, message: "2FA verification required. Code sent to your email." });
      }

      if (!user.twoFAOtp || user.twoFAOtpExpires < new Date()) {
        await audit("login_2fa_expired", { userId: user._id, email, req });
        return next(new AppError("OTP has expired. Use the resend option to get a new code.", 400, "OTP_EXPIRED"));
      }
      if (user.twoFAOtp !== otp) {
        await audit("login_2fa_failed", { userId: user._id, email, metadata: { reason: "wrong_otp" }, req });
        return next(new AppError("Invalid code. Please try again.", 400, "INVALID_OTP"));
      }
      user.twoFAOtp = undefined;
      user.twoFAOtpExpires = undefined;
      await audit("login_2fa_success", { userId: user._id, email, req });
    }

    const token = jwt.sign({ userId: user._id, purpose: "login" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    user.lastLogin = new Date();
    await user.save();

    await audit("login_success", { userId: user._id, email, req });

    const userData = user.toObject();
    delete userData.password;
    delete userData.twoFAOtp;
    delete userData.twoFAOtpExpires;
    delete userData.twoFALastSent;

    res.status(200).json({ message: "Login successful", token, user: userData });
  } catch (error) {
    next(error);
  }
};

// ─── Resend 2FA OTP (Fix #2) ──────────────────────────────────────────────────
const resend2FAOtp = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password +twoFAOtp +twoFAOtpExpires +twoFALastSent");

    if (!user || !user.is2FAEnabled) {
      return next(new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await audit("login_failed", { userId: user._id, email, metadata: { reason: "wrong_password_on_otp_resend" }, req });
      return next(new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS"));
    }

    if (user.twoFALastSent && Date.now() - user.twoFALastSent.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.twoFALastSent.getTime())) / 1000);
      await audit("otp_resend_cooldown", { userId: user._id, email, metadata: { waitSec }, req });
      return res.status(429).json({
        message: `Please wait ${waitSec} second(s) before requesting a new code.`,
        waitSeconds: waitSec,
      });
    }

    const code = generateOTP();
    user.twoFAOtp = code;
    user.twoFAOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.twoFALastSent = new Date();
    await user.save();

    await sendEmail(email, "Your new SyncSpace Login Code", `<p>Your new verification code is: <strong>${code}</strong>. It expires in 10 minutes.</p>`);
    await audit("otp_resent", { userId: user._id, email, req });

    res.status(200).json({ message: "A new verification code has been sent to your email." });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Verification link has expired. Please request a new one.", 401, "TOKEN_EXPIRED"));
      }
      return next(new AppError("Invalid verification link.", 401, "INVALID_TOKEN"));
    }

    if (!payload || payload.purpose !== "email-verification") {
      return next(new AppError("Invalid verification link.", 401, "INVALID_TOKEN"));
    }

    const { userId } = payload;
    const verification = await Verification.findOne({ userId, token });
    if (!verification) {
      return next(new AppError("Verification link is invalid or has already been used.", 401, "INVALID_TOKEN"));
    }
    if (verification.expiresAt < new Date()) {
      return next(new AppError("Verification link has expired. Please request a new one.", 401, "TOKEN_EXPIRED"));
    }

    const user = await User.findById(userId);
    if (!user) return next(new AppError("Account not found.", 401, "USER_NOT_FOUND"));
    if (user.isEmailVerified) return res.status(400).json({ message: "Email is already verified. Please sign in." });

    user.isEmailVerified = true;
    await user.save();
    await Verification.findByIdAndDelete(verification._id);

    await audit("email_verified", { userId, email: user.email, req });
    res.status(200).json({ message: "Email verified successfully! You can now sign in." });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isEmailVerified) {
      return res.status(200).json({ message: "If that account exists, a reset link has been sent." });
    }

    const existingVerification = await Verification.findOne({ userId: user._id });
    if (existingVerification && existingVerification.expiresAt > new Date()) {
      return res.status(200).json({ message: "If that account exists, a reset link has been sent." });
    }
    if (existingVerification) await Verification.findByIdAndDelete(existingVerification._id);

    const resetPasswordToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    await Verification.create({
      userId: user._id,
      token: resetPasswordToken,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    const isEmailSent = await sendEmail(email, "Reset your password – SyncSpace", `<p>Click <a href="${resetPasswordLink}">here</a> to reset your password. This link expires in 15 minutes and can only be used once.</p>`);
    if (!isEmailSent) return next(new AppError("Failed to send reset email. Please try again.", 500, "EMAIL_SEND_FAILED"));

    await audit("password_reset_requested", { userId: user._id, email, req });
    res.status(200).json({ message: "If that account exists, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password (Fix #7 — single-use token) ───────────────────────────────
const verifyResetPasswordTokenAndResetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Reset link has expired. Please request a new one.", 401, "TOKEN_EXPIRED"));
      }
      return next(new AppError("Invalid reset link.", 401, "INVALID_TOKEN"));
    }

    if (!payload || payload.purpose !== "reset-password") {
      return next(new AppError("Invalid reset link.", 401, "INVALID_TOKEN"));
    }

    const { userId } = payload;

    // findOneAndDelete = atomic single-use enforcement
    const verification = await Verification.findOneAndDelete({ userId, token });
    if (!verification) {
      return next(new AppError("This reset link has already been used or is invalid.", 401, "TOKEN_ALREADY_USED"));
    }
    if (verification.expiresAt < new Date()) {
      return next(new AppError("Reset link has expired. Please request a new one.", 401, "TOKEN_EXPIRED"));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match.", 400, "PASSWORDS_MISMATCH"));
    }

    const user = await User.findById(userId);
    if (!user) return next(new AppError("Account not found.", 401, "USER_NOT_FOUND"));

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await audit("password_reset_success", { userId, email: user.email, req });
    res.status(200).json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    next(error);
  }
};

// ─── 2FA Management ───────────────────────────────────────────────────────────
const enable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+twoFALastSent");
    const code = generateOTP();
    user.twoFAOtp = code;
    user.twoFAOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.twoFALastSent = new Date();
    await user.save();
    await sendEmail(user.email, "Enable Two-Factor Authentication – SyncSpace", `<p>Your 2FA setup code is: <strong>${code}</strong>. It expires in 10 minutes.</p>`);
    res.status(200).json({ message: "Verification code sent to your email" });
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select("+twoFAOtp +twoFAOtpExpires");
    if (!user.twoFAOtp || user.twoFAOtpExpires < new Date()) {
      return next(new AppError("Code expired. Please request a new one.", 400, "OTP_EXPIRED"));
    }
    if (user.twoFAOtp !== otp) {
      return next(new AppError("Invalid code. Please try again.", 400, "INVALID_OTP"));
    }
    user.is2FAEnabled = true;
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    await user.save();
    await audit("2fa_enabled", { userId: user._id, email: user.email, req });
    res.status(200).json({ message: "2FA enabled successfully", is2FAEnabled: true });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.is2FAEnabled = false;
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    user.twoFALastSent = undefined;
    await user.save();
    await audit("2fa_disabled", { userId: user._id, email: user.email, req });
    res.status(200).json({ message: "2FA disabled successfully", is2FAEnabled: false });
  } catch (error) {
    next(error);
  }
};

// ─── Cleanup Unverified Users (Fix #12) ──────────────────────────────────────
export const cleanupUnverifiedUsers = async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleUsers = await User.find({
      isEmailVerified: false,
      createdAt: { $lt: cutoff },
    }).select("_id");

    if (staleUsers.length === 0) return;

    const ids = staleUsers.map((u) => u._id);
    await Verification.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log(`[Cleanup] Removed ${ids.length} stale unverified user(s)`);
  } catch (err) {
    console.error("[Cleanup error]", err.message);
  }
};

export {
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
};
