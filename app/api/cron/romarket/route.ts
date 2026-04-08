import type { NextRequest } from "next/server";
import { runWatchlistCheck } from "../../romarket/lib/check-watchlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // En local puedes dejarlo sin secret si quieres probar rápido
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { checkedAt, results, errors } = await runWatchlistCheck({
    notify: true,
  });

  const notified = results.filter((r) => r.shouldNotify);

  return Response.json({
    ok: true,
    checkedAt,
    notifiedCount: notified.length,
    alerts: notified.map((r) => ({
      item: r.item,
      serverType: r.serverType,
      storeType: r.storeType,
      threshold: r.threshold,
      minPrice: r.minPrice,
      matchingOffers: r.matchingOffers,
      sourceUrl: r.sourceUrl,
    })),
    errors,
  });
}
