import { Redis } from "@upstash/redis";

export type AlertState = {
  lastStatus: "above" | "below";
  lastAlertHash: string | null;
  updatedAt: string;
};

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
  }

  return new Redis({ url, token });
}

export async function getAlertState(key: string): Promise<AlertState | null> {
  const redis = getRedis();
  return redis.get<AlertState>(key);
}

export async function setAlertState(key: string, value: AlertState) {
  const redis = getRedis();
  await redis.set(key, value);
}
