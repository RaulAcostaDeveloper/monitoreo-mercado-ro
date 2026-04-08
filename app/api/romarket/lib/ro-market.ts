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
