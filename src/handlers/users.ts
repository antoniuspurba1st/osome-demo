import { RequestHandler } from "express";
import Joi from "joi";

import { insertUser, listUsers } from "../db/userRepository";
import { HttpError } from "../utils/httpError";

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
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

    const user = await insertUser(value.name, value.email);

    response.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const listUsersHandler: RequestHandler = async (_request, response, next) => {
  try {
    const users = await listUsers();
    response.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
