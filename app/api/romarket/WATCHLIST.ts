export type WatchItem = {
  id: string;
  item: string;
  serverType: "FREYA";
  storeType: "BUY" | "SELL";
  threshold: number;
  enabled: boolean;
  alertChannel: string;
};

export const WATCHLIST: WatchItem[] = [
  {
    id: "ygg-berry-buy",
    item: "Yggdrasil Berry",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 30000,
    enabled: true,
    alertChannel: "yggdrasil_berry",
  },
  {
    id: "poison-bottle-buy",
    item: "Poison Bottle",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 30000,
    enabled: true,
    alertChannel: "poison_bottle",
  },
];
