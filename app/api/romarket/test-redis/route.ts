import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return Response.json(
      {
        ok: false,
        error: "Missing KV_REST_API_URL or KV_REST_API_TOKEN",
      },
      { status: 500 },
    );
  }

  const redis = new Redis({ url, token });

  const key = `romarket:test:${Date.now()}`;
  const payload = {
    ok: true,
    checkedAt: new Date().toISOString(),
  };

  await redis.set(key, payload);
  await redis.expire(key, 60);

  const value = await redis.get<typeof payload>(key);

  return Response.json({
    ok: true,
    key,
    value,
    connected: !!value,
  });
}
