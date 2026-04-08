// app/api/romarket/route.ts

import { fetchMarketHtml } from "./lib/ro-market";
import { parseOffersFromDocument } from "./utils/parseOffersFromDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const item = searchParams.get("item") || "Yggdrasil Berry";
  const serverType = searchParams.get("serverType") || "FREYA";
  const storeType = (searchParams.get("storeType") || "BUY") as "BUY" | "SELL";
  const debug = searchParams.get("debug") === "1";

  const url = new URL("https://ro.gnjoylatam.com/en/intro/shop-search/trading");
  url.searchParams.set("storeType", storeType);
  url.searchParams.set("serverType", serverType);
  url.searchParams.set("searchWord", item);
  url.searchParams.set("sortType", "LOW_PRICE");

  const html = await fetchMarketHtml(url.toString());
  const offers = parseOffersFromDocument(html, "BUY");

  if (debug) {
    return Response.json({
      item,
      sourceUrl: url.toString(),
      htmlLength: html.length,
      hasSearchResultsText: html.includes("Search Results"),
      hasItemName: html.includes(item),
      hasTypeBuy: html.includes(`Type ${storeType}`),
      hasQuantity: html.includes("Quantity"),
      hasSeller: html.includes("Seller"),
      snippet: html.slice(
        Math.max(0, html.indexOf(item) - 300),
        Math.min(html.length, html.indexOf(item) + 1500),
      ),
      totalOffers: offers.length,
      minPrice: offers[0]?.price ?? null,
      offers,
    });
  }

  return Response.json({
    item,
    totalOffers: offers.length,
    minPrice: offers[0]?.price ?? null,
    offers,
    sourceUrl: url.toString(),
  });
}
