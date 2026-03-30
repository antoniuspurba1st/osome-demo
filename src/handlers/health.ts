import { RequestHandler } from "express";

export const getHealthHandler: RequestHandler = (request, response) => {
  response.status(200).json({
    status: "ok",
    requestId: request.requestId,
  });
};
