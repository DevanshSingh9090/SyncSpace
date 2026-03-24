import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"],
      default: "Planning",
    },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["manager", "contributor", "viewer"], default: "contributor" },
      },
    ],
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    tags: [{ type: String }],
    startDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
