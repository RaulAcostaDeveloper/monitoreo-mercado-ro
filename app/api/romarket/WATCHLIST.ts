export type WatchItem = {
  id: string;
  item: string;
  serverType: "FREYA";
  storeType: "BUY" | "SELL";
  threshold: number;
  enabled: boolean;
};

export const WATCHLIST: WatchItem[] = [
  {
    id: "ygg-berry-buy",
    item: "Yggdrasil Berry",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 30000,
    enabled: true,
  },
  {
    id: "poison-bottle-buy",
    item: "Poison Bottle",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 30000,
    enabled: true,
  },
];
