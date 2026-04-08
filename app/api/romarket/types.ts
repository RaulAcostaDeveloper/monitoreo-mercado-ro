export type WatchItem = {
  item: string;
  serverType: "FREYA";
  storeType: "BUY" | "SELL";
  threshold: number;
  enabled: boolean;
};

export const WATCHLIST: WatchItem[] = [
  {
    item: "Yggdrasil Berry",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 34000,
    enabled: true,
  },
];
