export interface WatchItem {
  id: string;
  name: string;
  serverType: "FREYA";
  storeType: "BUY" | "SELL";
  threshold: number;
  enabled: boolean;
}

export interface MarketSnapshot {
  itemName: string;
  minPrice: number | null;
  foundAt: string;
  sourceUrl: string;
  offers: Array<{
    price: number;
    quantity: number;
    seller?: string;
    stallName?: string;
  }>;
}
