import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { cleanupUnverifiedUsers } from "./controllers/auth-controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.get("/", (req, res) => res.status(200).json({ message: "Welcome to SyncSpace API" }));
app.use("/api-v1", routes);

// 404 handler (must come after all routes)
app.use((req, res) => {
  res.status(404).json({ status: "fail", code: "NOT_FOUND", message: "Route not found" });
});

// Central error handler (Fix #15 — must be last)
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Fix #12 — Cleanup unverified users on startup, then every 6 hours
      cleanupUnverifiedUsers();
      setInterval(cleanupUnverifiedUsers, 6 * 60 * 60 * 1000);
    });
  })
  .catch((err) => console.log(err));
