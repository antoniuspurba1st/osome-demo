import { logger } from "../middleware/logger";
import { enqueueWelcomeEmail } from "../utils/backgroundJobs";

describe("enqueueWelcomeEmail", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("schedules logging asynchronously", async () => {
    const logSpy = jest.spyOn(logger, "info").mockImplementation(() => logger);

    enqueueWelcomeEmail({
      userId: 1,
      email: "john@mail.com",
      requestId: "req-1",
    });

    expect(logSpy).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => {
      setImmediate(() => resolve());
    });

    expect(logSpy).toHaveBeenCalledWith(
      {
        userId: 1,
        email: "john@mail.com",
        requestId: "req-1",
      },
      "Sending welcome email to user",
    );
  });
});
