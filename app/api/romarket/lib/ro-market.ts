// lib/ro-market.ts

export type MarketOffer = {
  name: string;
  price: number;
  quantity: number | null;
  seller: string | null;
  stallName: string | null;
};

export async function fetchMarketHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 MonitoreoMercadoRO/1.0",
      "accept-language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch market page: ${res.status}`);
  }

  return res.text();
}

export function logRelevantHtml(html: string) {
  const startMarkers = ["Search Results", "Yggdrasil Berry", "Type BUY"];
  const endMarkers = ["Privacy Policy", "© Gravity"];

  let start = -1;
  for (const marker of startMarkers) {
    const idx = html.indexOf(marker);
    if (idx !== -1 && (start === -1 || idx < start)) start = idx;
  }

  let end = html.length;
  for (const marker of endMarkers) {
    const idx = html.indexOf(marker);
    if (idx !== -1 && idx > start && idx < end) end = idx;
  }

  const snippet =
    start !== -1
      ? html.slice(Math.max(0, start - 1500), Math.min(html.length, end + 500))
      : html.slice(0, 5000);

  console.log("=== MARKET HTML SNIPPET START ===");
  console.log(snippet);
  console.log("=== MARKET HTML SNIPPET END ===");
}
