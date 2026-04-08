import { Redis } from "@upstash/redis";

export type AlertState = {
  lastStatus: "above" | "below";
  lastAlertHash: string | null;
  updatedAt: string;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

export async function getAlertState(key: string): Promise<AlertState | null> {
  if (!redis) return null;
  return redis.get<AlertState>(key);
}

export async function setAlertState(key: string, value: AlertState) {
  if (!redis) return;
  await redis.set(key, value);
}
