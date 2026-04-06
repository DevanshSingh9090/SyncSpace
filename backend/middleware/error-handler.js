// ─── AppError ─────────────────────────────────────────────────────────────────
// Use this for all known/expected errors. Throw it from any controller and the
// errorHandler middleware below will format it consistently.
//
//   throw new AppError("Email not found", 404, "USER_NOT_FOUND");
//   next(new AppError("Token expired", 401, "TOKEN_EXPIRED"));

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
    this.isOperational = true;
  }
}

// ─── Central Error Handler ────────────────────────────────────────────────────
// Must be registered AFTER all routes with app.use(errorHandler).
// Produces a consistent JSON shape:
//   { status: "fail" | "error", code: "SOME_CODE", message: "Human message" }

export const errorHandler = (err, req, res, next) => {
  // ── Mongoose validation errors ──
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: "fail",
      code: "VALIDATION_ERROR",
      message: messages.join(", "),
    });
  }

  // ── Mongoose duplicate key ──
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      status: "fail",
      code: "DUPLICATE_KEY",
      message: `${field} is already in use`,
    });
  }

  // ── JWT errors ──
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ status: "fail", code: "INVALID_TOKEN", message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ status: "fail", code: "TOKEN_EXPIRED", message: "Token has expired" });
  }

  // ── Zod / express-validator body errors (forwarded via next(err)) ──
  if (err.status === 400 && err.errors) {
    return res.status(400).json({
      status: "fail",
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      errors: err.errors,
    });
  }

  // ── Operational / known AppErrors ──
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? "error" : "fail",
      code: err.code,
      message: err.message,
    });
  }

  // ── Unknown / programming errors — never leak internals ──
  console.error("[Unhandled Error]", err);
  res.status(500).json({
    status: "error",
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred. Please try again later.",
  });
};
