// app/api/romarket/route.ts

import { fetchMarketHtml, logRelevantHtml } from "./lib/ro-market";
import { inspectCandidateNodes } from "./utils/inspectCandidateNodes";
import { parseOffersFromDocument } from "./utils/parseOffersFromDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const item = searchParams.get("item") || "Yggdrasil Berry";
  const serverType = searchParams.get("serverType") || "FREYA";
  const storeType = searchParams.get("storeType") || "BUY";
  const debug = searchParams.get("debug") === "1";

  const url = new URL("https://ro.gnjoylatam.com/en/intro/shop-search/trading");
  url.searchParams.set("storeType", storeType);
  url.searchParams.set("serverType", serverType);
  url.searchParams.set("searchWord", item);
  url.searchParams.set("sortType", "LOW_PRICE");

  const html = await fetchMarketHtml(url.toString());

  if (debug) {
    logRelevantHtml(html);
    inspectCandidateNodes(html);
  }

  const offers = parseOffersFromDocument(html);

  return Response.json({
    item,
    totalOffers: offers.length,
    minPrice: offers[0]?.price ?? null,
    offers,
    sourceUrl: url.toString(),
  });
}
