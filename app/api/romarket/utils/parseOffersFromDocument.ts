import { load } from "cheerio";
import { MarketOffer } from "../lib/ro-market";
import { cleanText } from "./cleanText";
import { parsePrice } from "./parsePrice";
import { normalizeMaybeText } from "./normalizeMaybeText";

const getLines = (text: string) =>
  text.split(/\r?\n/).map(cleanText).filter(Boolean);

export function parseOffersFromDocument(
  html: string,
  expectedStoreType: "BUY" | "SELL",
): MarketOffer[] {
  const $ = load(html);
  const offers: MarketOffer[] = [];
  const seen = new Set<string>();

  $("li").each((_, el) => {
    const $el = $(el);

    const rawText = $el.text();
    const lines = getLines(rawText);

    if (lines.length === 0) return;

    const joined = lines.join(" | ");

    const hasExpectedType = new RegExp(
      `\\bType\\s*${expectedStoreType}\\b`,
      "i",
    ).test(joined);

    const hasQuantity = /\bQuantity\b/i.test(joined);
    const hasSeller = /\bSeller\b/i.test(joined);

    if (!hasExpectedType || !hasQuantity || !hasSeller) return;

    const heading =
      normalizeMaybeText($el.find("h1, h2, h3, h4, strong").first().text()) ??
      null;

    const priceLine =
      lines.find((line) => /^\d[\d,]*$/.test(line)) ??
      lines.find((line) => /\b\d{1,3}(?:,\d{3})+\b/.test(line)) ??
      null;

    const price =
      priceLine != null
        ? parsePrice(priceLine)
        : (() => {
            const fallback = joined.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/);
            return fallback ? parsePrice(fallback[1]) : null;
          })();

    const sellerLine = lines.find((line) => /^Seller\b/i.test(line)) ?? null;
    const stallLine = lines.find((line) => /^Stall Name\b/i.test(line)) ?? null;
    const quantityLine =
      lines.find((line) => /^Quantity\b/i.test(line)) ?? null;

    const seller = normalizeMaybeText(
      sellerLine?.replace(/^Seller\s*[:.•]?\s*/i, "") ?? null,
    );

    const stallName = normalizeMaybeText(
      stallLine?.replace(/^Stall Name\s*[:.•]?\s*/i, "") ?? null,
    );

    const quantity = quantityLine
      ? Number(quantityLine.replace(/[^\d]/g, "")) || null
      : null;

    const name =
      heading ??
      normalizeMaybeText(
        lines.find(
          (line) =>
            !/^(Seller|Stall Name|Type|Quantity)\b/i.test(line) &&
            !/^\d[\d,]*$/.test(line),
        ) ?? null,
      );

    if (!name || price == null || price <= 0) return;

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
