import * as cheerio from "cheerio";

export type StoreType = "BUY" | "SELL";
export type ServerType = "FREYA";

export type MarketRow = {
  itemName: string;
  price: number;
  stallName: string;
  seller: string;
  quantity: number;
  storeType: StoreType;
};

export type FetchMarketParams = {
  itemName: string;
  serverType: ServerType;
  storeType: StoreType;
};

export type FetchMarketResult = {
  ok: true;
  url: string;
  searchedItem: string;
  minPrice: number | null;
  total: number;
  results: MarketRow[];
};

function toNumber(value: string | undefined | null): number {
  if (!value) return 0;
  const clean = value.replace(/[^\d]/g, "");
  return clean ? Number(clean) : 0;
}

function cleanText(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function extractByLabel(lines: string[], label: string): string {
  const found = lines.find((line) =>
    line.toLowerCase().startsWith(label.toLowerCase()),
  );

  if (!found) return "";

  return found.slice(label.length).trim();
}

function parseResultBlock(blockText: string): MarketRow | null {
  const lines = blockText
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean);

  if (!lines.length) return null;

  // Esperamos algo parecido a:
  // Yggdrasil Berry
  // 24,000
  // Stall Name ESSA...
  // Seller Neto Potter
  // Type BUY
  // Quantity 2

  const itemName = lines[0] ?? "";
  const priceLine =
    lines.find((line) => /\d[\d,]*/.test(line) && !/^Quantity/i.test(line)) ??
    "";
  const stallName = extractByLabel(lines, "Stall Name");
  const seller = extractByLabel(lines, "Seller");
  const typeRaw = extractByLabel(lines, "Type").toUpperCase();
  const quantityRaw = extractByLabel(lines, "Quantity");

  const price = toNumber(priceLine);
  const quantity = toNumber(quantityRaw);
  const storeType: StoreType = typeRaw === "SELL" ? "SELL" : "BUY";

  if (!itemName || !price) return null;

  return {
    itemName,
    price,
    stallName,
    seller,
    quantity,
    storeType,
  };
}

function uniqueRows(rows: MarketRow[]): MarketRow[] {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = [
      row.itemName,
      row.price,
      row.stallName,
      row.seller,
      row.quantity,
      row.storeType,
    ].join("::");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseFromStructuredBlocks($: cheerio.CheerioAPI): MarketRow[] {
  const rows: MarketRow[] = [];

  // Intento 1:
  // Buscar contenedores que tengan un h3 + texto con Stall Name / Seller / Quantity.
  const candidateBlocks = $("li, div, article, section")
    .filter((_, el) => {
      const text = cleanText($(el).text());
      return (
        text.includes("Stall Name") &&
        text.includes("Seller") &&
        text.includes("Quantity") &&
        /\d[\d,]*/.test(text)
      );
    })
    .toArray();

  for (const el of candidateBlocks) {
    const blockText = $(el).text();
    const parsed = parseResultBlock(blockText);
    if (parsed) rows.push(parsed);
  }

  return uniqueRows(rows);
}

function parseFromHeadingWalk($: cheerio.CheerioAPI): MarketRow[] {
  const rows: MarketRow[] = [];

  // Intento 2:
  // Cada resultado tiene un heading tipo "### Yggdrasil Berry" en el HTML renderizado.
  // Recorremos headings y agarramos el contenedor padre más cercano.
  $("h1, h2, h3, h4").each((_, heading) => {
    const headingText = cleanText($(heading).text());
    if (!headingText) return;

    const parent = $(heading).parent();
    const blockText = cleanText(parent.text());

    if (
      blockText.includes("Stall Name") &&
      blockText.includes("Seller") &&
      blockText.includes("Quantity")
    ) {
      const parsed = parseResultBlock(parent.text());
      if (parsed) rows.push(parsed);
    }
  });

  return uniqueRows(rows);
}

function parseFromWholeBodyFallback($: cheerio.CheerioAPI): MarketRow[] {
  const bodyLines = $("body")
    .text()
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean);

  const rows: MarketRow[] = [];

  for (let i = 0; i < bodyLines.length; i++) {
    // Detecta inicio de bloque por una línea seguida de un precio
    const maybeName = bodyLines[i];
    const maybePrice = bodyLines[i + 1] ?? "";
    const hasStall = /^Stall Name/i.test(bodyLines[i + 2] ?? "");
    const hasSeller = /^Seller/i.test(bodyLines[i + 3] ?? "");
    const hasType = /^Type /i.test(bodyLines[i + 4] ?? "");
    const hasQuantity = /^Quantity/i.test(bodyLines[i + 5] ?? "");

    if (!maybeName || !/\d[\d,]*/.test(maybePrice)) continue;
    if (!hasStall || !hasSeller || !hasType || !hasQuantity) continue;

    const storeTypeRaw = bodyLines[i + 4]
      .replace(/^Type\s+/i, "")
      .trim()
      .toUpperCase();

    rows.push({
      itemName: maybeName,
      price: toNumber(maybePrice),
      stallName: bodyLines[i + 2].replace(/^Stall Name\s*/i, "").trim(),
      seller: bodyLines[i + 3].replace(/^Seller\s*/i, "").trim(),
      quantity: toNumber(bodyLines[i + 5]),
      storeType: storeTypeRaw === "SELL" ? "SELL" : "BUY",
    });
  }

  return uniqueRows(rows);
}

export async function fetchGnjoyMarket({
  itemName,
  serverType,
  storeType,
}: FetchMarketParams): Promise<FetchMarketResult> {
  const url = new URL("https://ro.gnjoylatam.com/en/intro/shop-search/trading");
  url.searchParams.set("searchWord", itemName);
  url.searchParams.set("serverType", serverType);
  url.searchParams.set("storeType", storeType);
  url.searchParams.set("sortType", "LOW_PRICE");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 market-watcher/1.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Marketplace request failed: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  let results = parseFromStructuredBlocks($);

  if (!results.length) {
    results = parseFromHeadingWalk($);
  }

  if (!results.length) {
    results = parseFromWholeBodyFallback($);
  }

  // Filtrar solo el item buscado y el tipo correcto
  const normalizedSearch = cleanText(itemName).toLowerCase();

  results = results.filter((row) => {
    return (
      cleanText(row.itemName).toLowerCase() === normalizedSearch &&
      row.storeType === storeType
    );
  });

  results.sort((a, b) => a.price - b.price);

  return {
    ok: true,
    url: url.toString(),
    searchedItem: itemName,
    minPrice: results.length ? results[0].price : null,
    total: results.length,
    results,
  };
}
