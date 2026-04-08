import { load } from "cheerio";
import { MarketOffer } from "../lib/ro-market";
import { cleanText } from "./cleanText";
import { parsePrice } from "./parsePrice";
import { normalizeMaybeText } from "./normalizeMaybeText";

export function parseOffersFromDocument(
  html: string,
  expectedStoreType: "BUY" | "SELL",
): MarketOffer[] {
  const $ = load(html);
  const offers: MarketOffer[] = [];
  const seen = new Set<string>();

  $("li").each((_, el) => {
    const text = cleanText($(el).text());

    if (!text.includes(`Type ${expectedStoreType}`)) return;
    if (!text.includes("Quantity")) return;
    if (!text.includes("Seller")) return;

    const name =
      normalizeMaybeText($(el).find("h1, h2, h3, h4, strong").first().text()) ??
      null;

    const priceMatch = text.match(
      /(?:^|\s)(\d{1,3}(?:,\d{3})+|\d{4,})(?:\s|$)/,
    );
    const price = priceMatch ? parsePrice(priceMatch[1]) : null;

    const sellerMatch = text.match(
      /Seller\s*[:.•]?\s*(.+?)(?=\s+Type\s+\w+|\s+Quantity|\s*$)/i,
    );

    const stallMatch = text.match(
      /Stall Name\s*[:.•]?\s*(.+?)(?=\s+Seller|\s+Type\s+\w+|\s+Quantity|\s*$)/i,
    );

    const quantityMatch = text.match(/Quantity\s*[:.]?\s*(\d+)/i);

    if (!name || price == null || price <= 0) return;

    const offer: MarketOffer = {
      name,
      price,
      quantity: quantityMatch ? Number(quantityMatch[1]) : null,
      seller: normalizeMaybeText(sellerMatch?.[1] ?? null),
      stallName: normalizeMaybeText(stallMatch?.[1] ?? null),
    };

    const key = [
      offer.name,
      offer.price,
      offer.quantity ?? "",
      offer.seller ?? "",
      offer.stallName ?? "",
    ].join("|");

    if (!seen.has(key)) {
      seen.add(key);
      offers.push(offer);
    }
  });

  return offers.sort((a, b) => a.price - b.price);
}
