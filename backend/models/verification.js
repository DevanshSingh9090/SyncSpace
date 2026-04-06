import mongoose, { Schema } from "mongoose";

const verificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }  // adds createdAt — required for resend cooldown checks
);

// TTL index: MongoDB auto-deletes expired records
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Verification = mongoose.model("Verification", verificationSchema);
export default Verification;
