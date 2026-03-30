import { randomUUID } from "crypto";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeHeader = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const generateRequestId = () => randomUUID();

export const resolveRequestId = (...candidates: Array<string | string[] | undefined>) => {
  for (const candidate of candidates) {
    const normalized = normalizeHeader(candidate);

    if (normalized && uuidPattern.test(normalized)) {
      return normalized;
    }
  }

  return generateRequestId();
};
