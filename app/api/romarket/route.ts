import { runWatchlistCheck } from "./lib/check-watchlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { checkedAt, results, errors } = await runWatchlistCheck({
    notify: false,
  });

  return Response.json({
    ok: true,
    checkedAt,
    alerts: results
      .filter((r) => r.shouldAlert)
      .map((r) => ({
        item: r.item,
        serverType: r.serverType,
        storeType: r.storeType,
        threshold: r.threshold,
        minPrice: r.minPrice,
        totalOffers: r.totalOffers,
        matchingOffers: r.matchingOffers,
        sourceUrl: r.sourceUrl,
        alertChannel: r.alertChannel,
        shouldNotify: r.shouldNotify,
      })),
    errors,
  });
}
