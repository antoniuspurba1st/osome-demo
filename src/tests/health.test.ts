import { app } from "../app";

const request = require("supertest");

describe("GET /health", () => {
  it("returns service health and a request id", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(response.headers["x-request-id"]).toBe(response.body.requestId);
  });
});
