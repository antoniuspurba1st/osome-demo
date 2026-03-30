import { pool } from "../db/pool";
import { registerShutdownHandlers, shutdownServer } from "../server";

jest.mock("../db/pool", () => ({
  pool: {
    end: jest.fn(),
  },
}));

describe("server shutdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("closes the server and database pool", async () => {
    const server = {
      close: jest.fn(function close(callback?: (error?: Error) => void) {
        callback?.();
        return this;
      }),
    };

    await shutdownServer(server, "SIGTERM");

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(pool.end).toHaveBeenCalledTimes(1);
  });

  it("registers SIGINT and SIGTERM handlers", () => {
    const onceSpy = jest.spyOn(process, "once").mockImplementation(() => process);
    const server = {
      close: jest.fn(),
    };

    registerShutdownHandlers(server);

    expect(onceSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(onceSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));

    onceSpy.mockRestore();
  });
});
