// app/api/romarket/check/route.ts
import { fetchMarketHtml } from "../lib/ro-market";
import { WATCHLIST } from "../types";
import { parseOffersFromDocument } from "../utils/parseOffersFromDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getMarketData(
  item: string,
  serverType: string,
  storeType: "BUY" | "SELL",
) {
  const url = new URL("https://ro.gnjoylatam.com/en/intro/shop-search/trading");
  url.searchParams.set("storeType", storeType);
  url.searchParams.set("serverType", serverType);
  url.searchParams.set("searchWord", item);
  url.searchParams.set("sortType", "LOW_PRICE");

  const html = await fetchMarketHtml(url.toString());
  const offers = parseOffersFromDocument(html, storeType);

  return {
    sourceUrl: url.toString(),
    totalOffers: offers.length,
    minPrice: offers[0]?.price ?? null,
    offers,
  };
}

export async function GET() {
  const results = [];

  for (const watch of WATCHLIST.filter((x) => x.enabled)) {
    try {
      const data = await getMarketData(
        watch.item,
        watch.serverType,
        watch.storeType,
      );

      const matchingOffers = data.offers.filter(
        (offer) => offer.price <= watch.threshold,
      );

      const shouldAlert = matchingOffers.length > 0;

      results.push({
        ...watch,
        ...data,
        matchingOffers,
        shouldAlert,
      });

      // if (shouldAlert) {
      //   await notifyDiscord({ watch, matchingOffers, minPrice: data.minPrice });
      // }
    } catch (error) {
      results.push({
        ...watch,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    results,
  });
}
