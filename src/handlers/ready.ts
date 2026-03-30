import { RequestHandler } from "express";

import { checkDatabaseConnection } from "../db/pool";

export const getReadyHandler: RequestHandler = async (request, response, next) => {
  try {
    await checkDatabaseConnection();

    response.status(200).json({
      status: "ready",
      requestId: request.requestId,
    });
  } catch (error) {
    request.log.error(
      {
        err: error,
      },
      "Readiness check failed",
    );

    response.status(503).json({
      error: "Database unavailable",
      requestId: request.requestId,
    });
  }
};
