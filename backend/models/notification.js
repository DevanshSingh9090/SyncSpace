import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["task_assigned", "comment_added", "task_status_changed", "workspace_invite", "project_created", "mention"],
      required: true,
    },
    message: { type: String, required: true },
    resourceType: { type: String, enum: ["Task", "Project", "Workspace", "Comment"] },
    resourceId: { type: Schema.Types.ObjectId },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
