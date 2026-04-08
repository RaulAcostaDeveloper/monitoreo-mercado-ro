// app/api/romarket/check/route.ts
import { fetchMarketHtml } from "../lib/ro-market";
import { WATCHLIST } from "../types";
import { parseOffersFromDocument } from "../utils/parseOffersFromDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getMinPrice(
  item: string,
  serverType: string,
  storeType: string,
) {
  const url = new URL("https://ro.gnjoylatam.com/en/intro/shop-search/trading");
  url.searchParams.set("storeType", storeType);
  url.searchParams.set("serverType", serverType);
  url.searchParams.set("searchWord", item);
  url.searchParams.set("sortType", "LOW_PRICE");

  const html = await fetchMarketHtml(url.toString());
  const offers = parseOffersFromDocument(html);

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
      const data = await getMinPrice(
        watch.item,
        watch.serverType,
        watch.storeType,
      );
      const shouldAlert =
        data.minPrice != null && data.minPrice <= watch.threshold;

      results.push({
        ...watch,
        ...data,
        shouldAlert,
      });

      // luego aquí mandas notify()
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
