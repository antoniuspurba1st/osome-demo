import { NextFunction, Request, RequestHandler, Response } from "express";
import pino from "pino";

import { env } from "../config/env";
import { resolveRequestId } from "../utils/requestId";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
});

const getRequestPath = (request: Request) => request.originalUrl || request.url || request.path;

export const requestContextMiddleware: RequestHandler = (request, response, next) => {
  const requestId = resolveRequestId(request.headers["x-request-id"], request.headers["x-correlation-id"]);

  request.requestId = requestId;
  request.requestStartedAt = Date.now();
  request.log = logger.child({
    requestId,
  });

  response.setHeader("x-request-id", requestId);

  next();
};

export const requestLoggingMiddleware = (request: Request, response: Response, next: NextFunction) => {
  response.on("finish", () => {
    const duration = Date.now() - request.requestStartedAt;

    request.log.info({
      method: request.method,
      path: getRequestPath(request),
      status: response.statusCode,
      duration,
    });
  });

  next();
};
