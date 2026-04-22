export type WatchItem = {
  id: string;
  search: string;
  item: string;
  serverType: "FREYA";
  storeType: "BUY" | "SELL";
  threshold: number;
  enabled: boolean;
  alertChannel: string;
  aliases?: string[];
};

export const WATCHLIST: WatchItem[] = [
  {
    id: "ygg-berry-buy",
    item: "Yggdrasil Berry",
    search: "Yggdrasil Berry",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 25000,
    enabled: true,
    alertChannel: "yggdrasil_berry",
  },
  {
    id: "poison-bottle-buy",
    item: "Poison Bottle",
    search: "Poison Bottle",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 20000,
    enabled: true,
    alertChannel: "poison_bottle",
  },
  {
    id: "advanced-field-manual",
    item: "Advanced Field Manual",
    search: "Advanced Field Manual",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 2000000,
    enabled: true,
    alertChannel: "advanced_field_manual",
  },
  {
    id: "blacksmith-blessing",
    item: "Blacksmith Blessing",
    search: "Blacksmith Blessing",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 1800000,
    enabled: true,
    alertChannel: "blacksmith_blessing",
  },
  {
    id: "strawberry-single",
    item: "Strawberry",
    search: "Strawberry",
    serverType: "FREYA",
    storeType: "BUY",
    threshold: 1100,
    enabled: true,
    alertChannel: "strawberry_single",
  },
];
