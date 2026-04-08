interface WatchList {
  id: string;
  itemName: string;
  serverType: string;
  storeType: string;
  threshold: number;
  cooldownMinutes: number;
  enabled: boolean;
}

export const watchlist: WatchList[] = [
  {
    id: "ygg-berry-buy",
    itemName: "Yggdrasil Berry",
    serverType: "FREYA" as const,
    storeType: "BUY" as const,
    threshold: 24000,
    cooldownMinutes: 60,
    enabled: true,
  },
];
