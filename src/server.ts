import { app, getListenConfig } from "./app";
import { logger } from "./middleware/logger";

const { port } = getListenConfig();

app.listen(port, () => {
  logger.info({ port }, "Local server listening");
});
