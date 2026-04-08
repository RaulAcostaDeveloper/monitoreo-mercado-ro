import { load } from "cheerio";

import { MarketOffer } from "../lib/ro-market";
import { cleanText } from "./cleanText";
import { parsePrice } from "./parsePrice";

export function parseOffersFromDocument(html: string): MarketOffer[] {
  const $ = load(html);

  const offers: MarketOffer[] = [];

  $("li, div, article, section").each((_, el) => {
    const text = cleanText($(el).text());

    const hasCoreFields =
      text.includes("Seller") &&
      text.includes("Quantity") &&
      text.includes("Type BUY");

    if (!hasCoreFields) return;

    // Nombre: intenta sacar el heading dentro del bloque
    const heading =
      cleanText($(el).find("h1, h2, h3, h4, strong").first().text()) || null;

    // Precio: toma la primera línea/número grande razonable del bloque
    const priceMatch = text.match(
      /(?:^|\s)(\d{1,3}(?:,\d{3})+|\d{4,})(?:\s|$)/,
    );
    const price = priceMatch ? parsePrice(priceMatch[1]) : null;

    const sellerMatch = text.match(
      /Seller\s*[:.]?\s*(.+?)(?=\s+Type\s+\w+\s+Quantity|\s+Quantity|\s*$)/i,
    );
    const stallMatch = text.match(
      /Stall Name\s*[:.•]?\s*(.+?)(?=\s+Seller|\s+Type\s+\w+|\s+Quantity|\s*$)/i,
    );
    const quantityMatch = text.match(/Quantity\s*[:.]?\s*(\d+)/i);

    if (!heading || price == null) return;

    offers.push({
      name: heading,
      price,
      quantity: quantityMatch ? Number(quantityMatch[1]) : null,
      seller: sellerMatch ? cleanText(sellerMatch[1]) : null,
      stallName: stallMatch ? cleanText(stallMatch[1]) : null,
    });
  });

  // Deduplicación básica por combinación de campos
  const unique = new Map<string, MarketOffer>();
  for (const offer of offers) {
    const key = [
      offer.name,
      offer.price,
      offer.quantity ?? "",
      offer.seller ?? "",
      offer.stallName ?? "",
    ].join("|");

    if (!unique.has(key)) unique.set(key, offer);
  }

  return [...unique.values()].sort((a, b) => a.price - b.price);
}
