import { logger } from "../middleware/logger";

interface WelcomeEmailJob {
  userId: number;
  email: string;
  requestId: string;
}

export const enqueueWelcomeEmail = ({ userId, email, requestId }: WelcomeEmailJob) => {
  setImmediate(() => {
    logger.info(
      {
        userId,
        email,
        requestId,
      },
      "Sending welcome email to user",
    );
  });
};
