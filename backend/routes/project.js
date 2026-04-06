import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "../libs/validate-schema.js";
import { createProject, getProjectDetails, getProjectTasks, updateProject, deleteProject, updateProjectMembers } from "../controllers/project.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.post("/workspaces/:workspaceId", validateRequest({ params: z.object({ workspaceId: z.string() }), body: projectSchema }), createProject);
router.get("/:projectId", validateRequest({ params: z.object({ projectId: z.string() }) }), getProjectDetails);
router.get("/:projectId/tasks", validateRequest({ params: z.object({ projectId: z.string() }) }), getProjectTasks);
router.put("/:projectId", validateRequest({ params: z.object({ projectId: z.string() }) }), updateProject);
router.put("/:projectId/members", validateRequest({ params: z.object({ projectId: z.string() }) }), updateProjectMembers);
router.delete("/:projectId", validateRequest({ params: z.object({ projectId: z.string() }) }), deleteProject);
export default router;
