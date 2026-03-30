import { Logger } from "pino";

import { AuditLogMetadata, insertAuditLog } from "../db/auditLogRepository";

interface AuditLogParams {
  logger: Logger;
  entityType: string;
  entityId: number;
  action: string;
  metadata: AuditLogMetadata;
  requestId: string;
}

export const writeAuditLogSafe = async ({
  logger,
  entityType,
  entityId,
  action,
  metadata,
  requestId,
}: AuditLogParams) => {
  try {
    await insertAuditLog({
      entityType,
      entityId,
      action,
      metadata,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        entityType,
        entityId,
        action,
        requestId,
      },
      "Audit log write failed",
    );
  }
};
