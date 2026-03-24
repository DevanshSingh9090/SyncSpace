import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Verification from "../models/verification.js";
import { sendEmail } from "../libs/send-email.js";
import aj from "../libs/arcjet.js";

// ─── Helper: generate 6-digit OTP ────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Arcjet protection
    const decision = await aj.protect(req, { email });
    if (decision.isDenied()) {
      return res.status(403).json({ message: "Invalid email address or request denied" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email address already in use" });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({ email, password: hashPassword, name });

    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await Verification.create({ userId: newUser._id, token: verificationToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`;
    const isEmailSent = await sendEmail(email, "Verify your email", emailBody);
    if (!isEmailSent) return res.status(500).json({ message: "Failed to send verification email" });

    res.status(201).json({ message: "Verification email sent. Please check your email to verify your account." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const user = await User.findOne({ email }).select("+password +twoFAOtp +twoFAOtpExpires");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isEmailVerified) {
      const existingVerification = await Verification.findOne({ userId: user._id });
      if (existingVerification && existingVerification.expiresAt > new Date()) {
        return res.status(400).json({ message: "Email not verified. Please check your email for the verification link." });
      } else {
        if (existingVerification) await Verification.findByIdAndDelete(existingVerification._id);
        const verificationToken = jwt.sign({ userId: user._id, purpose: "email-verification" }, process.env.JWT_SECRET, { expiresIn: "1h" });
        await Verification.create({ userId: user._id, token: verificationToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await sendEmail(email, "Verify your email", `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`);
        return res.status(201).json({ message: "Verification email sent. Please check your email to verify your account." });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid email or password" });

    // 2FA check
    if (user.is2FAEnabled) {
      if (!otp) {
        // Send OTP and ask for it
        const code = generateOTP();
        user.twoFAOtp = code;
        user.twoFAOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendEmail(email, "Your TaskHub Login Code", `<p>Your verification code is: <strong>${code}</strong>. It expires in 10 minutes.</p>`);
        return res.status(200).json({ requires2FA: true, message: "2FA verification required. Code sent to your email." });
      }
      // Verify OTP
      if (!user.twoFAOtp || user.twoFAOtpExpires < new Date()) return res.status(400).json({ message: "OTP expired. Please try logging in again." });
      if (user.twoFAOtp !== otp) return res.status(400).json({ message: "Invalid code. Please try again." });
      user.twoFAOtp = undefined;
      user.twoFAOtpExpires = undefined;
    }

    const token = jwt.sign({ userId: user._id, purpose: "login" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    user.lastLogin = new Date();
    await user.save();
    const userData = user.toObject();
    delete userData.password;
    delete userData.twoFAOtp;
    delete userData.twoFAOtpExpires;
    res.status(200).json({ message: "Login successful", token, user: userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.purpose !== "email-verification") return res.status(401).json({ message: "Unauthorized" });
    const { userId } = payload;
    const verification = await Verification.findOne({ userId, token });
    if (!verification) return res.status(401).json({ message: "Unauthorized" });
    if (verification.expiresAt < new Date()) return res.status(401).json({ message: "Token expired" });
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified" });
    user.isEmailVerified = true;
    await user.save();
    await Verification.findByIdAndDelete(verification._id);
    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isEmailVerified) return res.status(400).json({ message: "Please verify your email first" });
    const existingVerification = await Verification.findOne({ userId: user._id });
    if (existingVerification && existingVerification.expiresAt > new Date()) return res.status(400).json({ message: "Reset password request already sent" });
    if (existingVerification) await Verification.findByIdAndDelete(existingVerification._id);
    const resetPasswordToken = jwt.sign({ userId: user._id, purpose: "reset-password" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    await Verification.create({ userId: user._id, token: resetPasswordToken, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    const isEmailSent = await sendEmail(email, "Reset your password", `<p>Click <a href="${resetPasswordLink}">here</a> to reset your password</p>`);
    if (!isEmailSent) return res.status(500).json({ message: "Failed to send reset password email" });
    res.status(200).json({ message: "Reset password email sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyResetPasswordTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.purpose !== "reset-password") return res.status(401).json({ message: "Unauthorized" });
    const { userId } = payload;
    const verification = await Verification.findOne({ userId, token });
    if (!verification) return res.status(401).json({ message: "Unauthorized" });
    if (verification.expiresAt < new Date()) return res.status(401).json({ message: "Token expired" });
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await Verification.findByIdAndDelete(verification._id);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── 2FA ─────────────────────────────────────────────────────────────────────
const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const code = generateOTP();
    user.twoFAOtp = code;
    user.twoFAOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmail(user.email, "Enable Two-Factor Authentication", `<p>Your 2FA code is: <strong>${code}</strong>. Enter this code to enable 2FA on your account. It expires in 10 minutes.</p>`);
    res.status(200).json({ message: "Verification code sent to your email" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const verify2FA = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select("+twoFAOtp +twoFAOtpExpires");
    if (!user.twoFAOtp || user.twoFAOtpExpires < new Date()) return res.status(400).json({ message: "Code expired. Please request a new one." });
    if (user.twoFAOtp !== otp) return res.status(400).json({ message: "Invalid code" });
    user.is2FAEnabled = true;
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    await user.save();
    res.status(200).json({ message: "2FA enabled successfully", is2FAEnabled: true });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

const disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.is2FAEnabled = false;
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    await user.save();
    res.status(200).json({ message: "2FA disabled successfully", is2FAEnabled: false });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

export { registerUser, loginUser, verifyEmail, resetPasswordRequest, verifyResetPasswordTokenAndResetPassword, enable2FA, verify2FA, disable2FA };
