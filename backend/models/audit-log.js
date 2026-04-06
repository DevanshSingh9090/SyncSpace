import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: null },
    action: {
      type: String,
      required: true,
      enum: [
        "register",
        "login_success",
        "login_failed",
        "login_2fa_sent",
        "login_2fa_success",
        "login_2fa_failed",
        "login_2fa_expired",
        "email_verified",
        "verification_resent",
        "verification_resend_cooldown",
        "otp_resent",
        "otp_resend_cooldown",
        "password_reset_requested",
        "password_reset_success",
        "2fa_enabled",
        "2fa_disabled",
        "unverified_user_replaced",
      ],
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// TTL index — auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ email: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
