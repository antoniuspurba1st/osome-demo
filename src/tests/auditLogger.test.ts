import { logger } from "../middleware/logger";
import * as auditLogRepository from "../db/auditLogRepository";
import { writeAuditLogSafe } from "../utils/auditLogger";

jest.mock("../db/auditLogRepository");

const mockedInsertAuditLog = jest.mocked(auditLogRepository.insertAuditLog);

describe("writeAuditLogSafe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not throw when audit log persistence fails", async () => {
    mockedInsertAuditLog.mockRejectedValue(new Error("audit write failed"));

    await expect(
      writeAuditLogSafe({
        logger,
        entityType: "user",
        entityId: 1,
        action: "user_created",
        metadata: {
          status: "pending",
        },
        requestId: "req-1",
      }),
    ).resolves.toBeUndefined();
  });
});
