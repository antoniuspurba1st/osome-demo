import { UserStatus } from "../db/userRepository";

const validTransitions: Record<UserStatus, UserStatus[]> = {
  pending: ["active"],
  active: ["inactive"],
  inactive: [],
};

export const canTransitionUserStatus = (currentStatus: UserStatus, nextStatus: UserStatus) =>
  validTransitions[currentStatus].includes(nextStatus);
