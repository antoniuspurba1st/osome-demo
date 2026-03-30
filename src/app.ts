import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { getHealthHandler } from "./handlers/health";
import { getReadyHandler } from "./handlers/ready";
import { createUserHandler, listUsersHandler } from "./handlers/users";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestContextMiddleware, requestLoggingMiddleware } from "./middleware/logger";
import { HttpError } from "./utils/httpError";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_request, _response, next) => {
        next(new HttpError(429, "Too many requests"));
      },
    }),
  );
  app.use(requestLoggingMiddleware);

  app.get("/health", getHealthHandler);
  app.get("/ready", getReadyHandler);
  app.get("/users", listUsersHandler);
  app.post("/users", createUserHandler);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();

export const getListenConfig = () => ({
  port: env.PORT,
});
