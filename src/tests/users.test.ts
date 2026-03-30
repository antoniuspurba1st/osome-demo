import { app } from "../app";
import * as userRepository from "../db/userRepository";
import * as auditLogger from "../utils/auditLogger";
import * as backgroundJobs from "../utils/backgroundJobs";

const request = require("supertest");

jest.mock("../db/userRepository");
jest.mock("../utils/auditLogger");
jest.mock("../utils/backgroundJobs");

const mockedCreateUserWithIdempotency = jest.mocked(userRepository.createUserWithIdempotency);
const mockedFindUserById = jest.mocked(userRepository.findUserById);
const mockedListUsers = jest.mocked(userRepository.listUsers);
const mockedUpdateUserStatus = jest.mocked(userRepository.updateUserStatus);
const mockedWriteAuditLogSafe = jest.mocked(auditLogger.writeAuditLogSafe);
const mockedEnqueueWelcomeEmail = jest.mocked(backgroundJobs.enqueueWelcomeEmail);

describe("Users endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedWriteAuditLogSafe.mockResolvedValue(undefined);
  });

  it("creates a user", async () => {
    mockedCreateUserWithIdempotency.mockResolvedValue({
      responseBody: {
        id: 1,
        name: "John",
        email: "john@mail.com",
      },
      statusCode: 201,
      wasReplayed: false,
      user: {
        id: 1,
        name: "John",
        email: "john@mail.com",
        status: "pending",
      },
    });

    const response = await request(app).post("/users").send({
      name: "John",
      email: "john@mail.com",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      name: "John",
      email: "john@mail.com",
    });
    expect(mockedCreateUserWithIdempotency).toHaveBeenCalledWith("John", "john@mail.com", undefined);
    expect(mockedEnqueueWelcomeEmail).toHaveBeenCalledWith({
      userId: 1,
      email: "john@mail.com",
      requestId: expect.any(String),
    });
    expect(mockedWriteAuditLogSafe).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "user",
        entityId: 1,
        action: "user_created",
        requestId: expect.any(String),
      }),
    );
  });

  it("lists users", async () => {
    mockedListUsers.mockResolvedValue([
      {
        id: 1,
        name: "John",
        email: "john@mail.com",
        status: "pending",
      },
    ]);

    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        name: "John",
        email: "john@mail.com",
      },
    ]);
  });

  it("returns 400 when validation fails", async () => {
    const response = await request(app).post("/users").send({
      name: "",
      email: "invalid-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(mockedCreateUserWithIdempotency).not.toHaveBeenCalled();
  });

  it("returns stored response when idempotency key is reused", async () => {
    mockedCreateUserWithIdempotency.mockResolvedValue({
      responseBody: {
        id: 1,
        name: "John",
        email: "john@mail.com",
      },
      statusCode: 201,
      wasReplayed: true,
      user: {
        id: 1,
        name: "John",
        email: "john@mail.com",
        status: "pending",
      },
    });

    const response = await request(app)
      .post("/users")
      .set("Idempotency-Key", "retry-key-1")
      .send({
        name: "John",
        email: "john@mail.com",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      name: "John",
      email: "john@mail.com",
    });
    expect(mockedCreateUserWithIdempotency).toHaveBeenCalledWith("John", "john@mail.com", "retry-key-1");
    expect(mockedEnqueueWelcomeEmail).not.toHaveBeenCalled();
    expect(mockedWriteAuditLogSafe).not.toHaveBeenCalled();
  });

  it("creates a new user when a new idempotency key is provided", async () => {
    mockedCreateUserWithIdempotency.mockResolvedValue({
      responseBody: {
        id: 2,
        name: "Jane",
        email: "jane@mail.com",
      },
      statusCode: 201,
      wasReplayed: false,
      user: {
        id: 2,
        name: "Jane",
        email: "jane@mail.com",
        status: "pending",
      },
    });

    const response = await request(app)
      .post("/users")
      .set("Idempotency-Key", "retry-key-2")
      .send({
        name: "Jane",
        email: "jane@mail.com",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 2,
      name: "Jane",
      email: "jane@mail.com",
    });
    expect(mockedEnqueueWelcomeEmail).toHaveBeenCalledWith({
      userId: 2,
      email: "jane@mail.com",
      requestId: expect.any(String),
    });
  });

  it("updates status with a valid transition", async () => {
    mockedFindUserById.mockResolvedValue({
      id: 1,
      name: "John",
      email: "john@mail.com",
      status: "pending",
    });
    mockedUpdateUserStatus.mockResolvedValue({
      id: 1,
      status: "active",
    });

    const response = await request(app).patch("/users/1/status").send({
      status: "active",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      status: "active",
    });
    expect(mockedUpdateUserStatus).toHaveBeenCalledWith(1, "active");
    expect(mockedWriteAuditLogSafe).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "user",
        entityId: 1,
        action: "status_changed",
      }),
    );
  });

  it("returns 400 for an invalid status transition", async () => {
    mockedFindUserById.mockResolvedValue({
      id: 1,
      name: "John",
      email: "john@mail.com",
      status: "inactive",
    });

    const response = await request(app).patch("/users/1/status").send({
      status: "pending",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid status transition from inactive to pending");
    expect(mockedUpdateUserStatus).not.toHaveBeenCalled();
  });

  it("returns 404 when updating status for a missing user", async () => {
    mockedFindUserById.mockResolvedValue(null);

    const response = await request(app).patch("/users/999/status").send({
      status: "active",
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
    expect(mockedUpdateUserStatus).not.toHaveBeenCalled();
  });

  it("returns 400 when status validation fails", async () => {
    const response = await request(app).patch("/users/1/status").send({
      status: "paused",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
    expect(mockedFindUserById).not.toHaveBeenCalled();
  });
});
