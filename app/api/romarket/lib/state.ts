import { Redis } from "@upstash/redis";

export type AlertState = {
  lastStatus: "above" | "below";
  lastAlertHash: string | null;
  updatedAt: string;
};

function getRedis() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error("Missing Upstash Redis env vars");
  }

  return Redis.fromEnv();
}

export async function getAlertState(key: string): Promise<AlertState | null> {
  const redis = getRedis();
  return redis.get<AlertState>(key);
}

export async function setAlertState(key: string, value: AlertState) {
  const redis = getRedis();
  await redis.set(key, value);
}
