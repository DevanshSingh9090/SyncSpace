import mongoose, { Schema } from "mongoose";

const workspaceInviteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  token: { type: String, required: true },
  role: { type: String, enum: ["admin", "member", "viewer"], default: "member" },
  expiresAt: { type: Date, required: true },
});

const WorkspaceInvite = mongoose.model("WorkspaceInvite", workspaceInviteSchema);
export default WorkspaceInvite;
