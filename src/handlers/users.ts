import { RequestHandler } from "express";
import Joi from "joi";

import { createUserWithIdempotency, findUserById, listUsers, updateUserStatus, UserStatus } from "../db/userRepository";
import { HttpError } from "../utils/httpError";
import { writeAuditLogSafe } from "../utils/auditLogger";
import { enqueueWelcomeEmail } from "../utils/backgroundJobs";
import { canTransitionUserStatus } from "../utils/userWorkflow";

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
});

const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "active", "inactive").required(),
});

export const createUserHandler: RequestHandler = async (request, response, next) => {
  try {
    const { error, value } = createUserSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(new HttpError(400, error.details.map((detail) => detail.message).join(", ")));
    }

    const idempotencyKeyHeader = request.header("Idempotency-Key");
    const idempotencyKey = typeof idempotencyKeyHeader === "string" && idempotencyKeyHeader.trim()
      ? idempotencyKeyHeader.trim()
      : undefined;
    const result = await createUserWithIdempotency(value.name, value.email, idempotencyKey);

    response.status(result.statusCode).json(result.responseBody);

    if (!result.wasReplayed) {
      response.once("finish", () => {
        enqueueWelcomeEmail({
          userId: result.user.id,
          email: result.user.email,
          requestId: request.requestId,
        });

        void writeAuditLogSafe({
          logger: request.log,
          entityType: "user",
          entityId: result.user.id,
          action: "user_created",
          metadata: {
            email: result.user.email,
            status: result.user.status,
          },
          requestId: request.requestId,
        });
      });
    }
  } catch (error) {
    next(error);
  }
};

export const listUsersHandler: RequestHandler = async (_request, response, next) => {
  try {
    const users = await listUsers();
    response.status(200).json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
    );
  } catch (error) {
    next(error);
  }
};

export const updateUserStatusHandler: RequestHandler = async (request, response, next) => {
  try {
    const userId = Number(request.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return next(new HttpError(400, "Invalid user id"));
    }

    const { error, value } = updateUserStatusSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(new HttpError(400, error.details.map((detail) => detail.message).join(", ")));
    }

    const user = await findUserById(userId);

    if (!user) {
      return next(new HttpError(404, "User not found"));
    }

    const newStatus = value.status as UserStatus;

    if (!canTransitionUserStatus(user.status, newStatus)) {
      return next(new HttpError(400, `Invalid status transition from ${user.status} to ${newStatus}`));
    }

    const updatedUser = await updateUserStatus(userId, newStatus);

    if (!updatedUser) {
      return next(new HttpError(404, "User not found"));
    }

    request.log.info({
      userId,
      previousStatus: user.status,
      newStatus,
      requestId: request.requestId,
    });

    response.status(200).json({
      id: updatedUser.id,
      status: updatedUser.status,
    });

    response.once("finish", () => {
      void writeAuditLogSafe({
        logger: request.log,
        entityType: "user",
        entityId: userId,
        action: "status_changed",
        metadata: {
          previousStatus: user.status,
          newStatus,
        },
        requestId: request.requestId,
      });
    });
  } catch (error) {
    next(error);
  }
};
