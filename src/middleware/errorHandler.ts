import { ErrorRequestHandler, RequestHandler } from "express";

import { HttpError } from "../utils/httpError";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, `Route not found: ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const statusCode =
    error instanceof HttpError ? error.statusCode : typeof error?.statusCode === "number" ? error.statusCode : 500;
  const message =
    error instanceof Error ? error.message : typeof error?.message === "string" ? error.message : "Internal server error";

  request.log?.error(
    {
      err: error,
      method: request.method,
      path: request.path,
      status: statusCode,
    },
    "Request failed",
  );

  response.status(statusCode).json({
    error: message,
    requestId: request.requestId,
  });
};
