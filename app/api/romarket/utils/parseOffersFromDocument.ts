import { load } from "cheerio";
import { MarketOffer } from "../lib/ro-market";
import { cleanText } from "./cleanText";
import { parsePrice } from "./parsePrice";
import { normalizeMaybeText } from "./normalizeMaybeText";

function extractField(cardText: string, label: string, stopWords: string[]) {
  const stop = stopWords.join("|");
  const regex = new RegExp(
    `${label}\\s*[:.•]?\\s*(.+?)(?=\\s*(?:${stop})\\b|$)`,
    "i",
  );

  const value = cardText.match(regex)?.[1] ?? null;
  return normalizeMaybeText(value);
}

export function parseOffersFromDocument(
  html: string,
  expectedStoreType: "BUY" | "SELL",
): MarketOffer[] {
  const $ = load(html);
  const offers: MarketOffer[] = [];
  const seen = new Set<string>();

  $('div[class^="card_shop_card_top__"]').each((_, el) => {
    const $top = $(el);

    const name = normalizeMaybeText(
      $top.find('h3[class^="card_item_name__"]').first().text(),
    );

    const priceText = $top.find('p[class^="card_item_price__"]').first().text();
    const price = parsePrice(priceText);

    if (!name || price == null || price <= 0) return;

    let $card = $top.parent();
    let cardText = cleanText($card.text());

    if (
      !/Quantity/i.test(cardText) ||
      !new RegExp(`Type\\s*${expectedStoreType}`, "i").test(cardText)
    ) {
      $card = $card.parent();
      cardText = cleanText($card.text());
    }

    if (
      !/Quantity/i.test(cardText) ||
      !new RegExp(`Type\\s*${expectedStoreType}`, "i").test(cardText)
    ) {
      return;
    }

    const quantityMatch = cardText.match(/Quantity\s*[:.•]?\s*(\d+)/i);
    const quantity = quantityMatch ? Number(quantityMatch[1]) : null;

    const seller = extractField(cardText, "Seller", ["Type", "Quantity"]);
    const rawStallName = extractField(cardText, "Stall Name", [
      "Seller",
      "Type",
      "Quantity",
    ]);

    const stallName = rawStallName === "0" ? null : rawStallName;

    const offer: MarketOffer = {
      name,
      price,
      quantity,
      seller,
      stallName,
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
