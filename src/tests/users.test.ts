import { app } from "../app";
import * as userRepository from "../db/userRepository";

const request = require("supertest");

jest.mock("../db/userRepository");

const mockedInsertUser = jest.mocked(userRepository.insertUser);
const mockedListUsers = jest.mocked(userRepository.listUsers);

describe("Users endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user", async () => {
    mockedInsertUser.mockResolvedValue({
      id: 1,
      name: "John",
      email: "john@mail.com",
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
    expect(mockedInsertUser).toHaveBeenCalledWith("John", "john@mail.com");
  });

  it("lists users", async () => {
    mockedListUsers.mockResolvedValue([
      {
        id: 1,
        name: "John",
        email: "john@mail.com",
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
    expect(mockedInsertUser).not.toHaveBeenCalled();
  });
});
