import { Server } from "http";

import { app, getListenConfig } from "./app";
import { pool } from "./db/pool";
import { logger } from "./middleware/logger";

const { port } = getListenConfig();

export const startServer = () => {
  const server = app.listen(port, () => {
    logger.info({ port }, "Local server listening");
  });

  return server;
};

export const shutdownServer = async (server: Pick<Server, "close">, signal: string) => {
  logger.info({ signal }, "Shutdown signal received");

  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await pool.end();
  logger.info({ signal }, "Server shutdown complete");
};

export const registerShutdownHandlers = (server: Pick<Server, "close">) => {
  const handleSignal = async (signal: string) => {
    try {
      await shutdownServer(server, signal);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error, signal }, "Server shutdown failed");
      process.exit(1);
    }
  };

  process.once("SIGINT", () => {
    void handleSignal("SIGINT");
  });

  process.once("SIGTERM", () => {
    void handleSignal("SIGTERM");
  });
};

if (require.main === module) {
  const server = startServer();
  registerShutdownHandlers(server);
}
