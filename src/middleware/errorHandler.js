export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "A record with the same unique value already exists."
    });
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      message: "A referenced record does not exist."
    });
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error"
  });
}
