import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import workspaceReducer from "./slices/workspaceSlice.js";
import projectReducer from "./slices/projectSlice.js";
import taskReducer from "./slices/taskSlice.js";
import notificationReducer from "./slices/notificationSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    project: projectReducer,
    task: taskReducer,
    notification: notificationReducer,
  },
});
