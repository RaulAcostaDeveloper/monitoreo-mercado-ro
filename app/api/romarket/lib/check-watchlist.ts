import crypto from "node:crypto";
import { WATCHLIST, type WatchItem } from "../WATCHLIST";
import { parseOffersFromDocument } from "../utils/parseOffersFromDocument";
import { notifyDiscord } from "./discord";
import { fetchMarketHtml, type MarketOffer } from "./ro-market";
import { getAlertState, setAlertState } from "./state";

type CheckResult = {
  item: string;
  serverType: string;
  storeType: "BUY" | "SELL";
  threshold: number;
  minPrice: number | null;
  totalOffers: number;
  matchingOffers: MarketOffer[];
  sourceUrl: string;
  shouldAlert: boolean;
  shouldNotify: boolean;
};

type CheckError = {
  item: string;
  serverType: string;
  storeType: "BUY" | "SELL";
  threshold: number;
  error: string;
};

async function getMarketData(
  item: string,
  serverType: string,
  storeType: "BUY" | "SELL",
) {
  const url = new URL("https://ro.gnjoylatam.com/en/intro/shop-search/trading");
  url.searchParams.set("storeType", storeType);
  url.searchParams.set("serverType", serverType);
  url.searchParams.set("searchWord", item);
  url.searchParams.set("sortType", "LOW_PRICE");

  const html = await fetchMarketHtml(url.toString());
  const offers = parseOffersFromDocument(html, storeType);

  return {
    sourceUrl: url.toString(),
    totalOffers: offers.length,
    minPrice: offers[0]?.price ?? null,
    offers,
  };
}

function buildStateKey(watch: WatchItem) {
  return `romarket:state:${watch.id}`;
}

function buildAlertHash(offers: MarketOffer[]) {
  const stablePayload = offers.map((offer) => ({
    name: offer.name,
    price: offer.price,
    quantity: offer.quantity,
    seller: offer.seller,
    stallName: offer.stallName,
  }));

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stablePayload))
    .digest("hex");
}

export async function runWatchlistCheck({ notify = false } = {}) {
  const results: CheckResult[] = [];
  const errors: CheckError[] = [];

  for (const watch of WATCHLIST.filter((x) => x.enabled)) {
    try {
      const data = await getMarketData(
        watch.item,
        watch.serverType,
        watch.storeType,
      );

      const matchingOffers = data.offers.filter(
        (offer) => offer.price <= watch.threshold,
      );

      const shouldAlert = matchingOffers.length > 0;
      const currentHash = shouldAlert ? buildAlertHash(matchingOffers) : null;
      const stateKey = buildStateKey(watch);
      const prevState = await getAlertState(stateKey);

      const shouldNotify =
        shouldAlert &&
        (!prevState ||
          prevState.lastStatus === "above" ||
          prevState.lastAlertHash !== currentHash);

      if (notify && shouldNotify) {
        await notifyDiscord({
          item: watch.item,
          serverType: watch.serverType,
          storeType: watch.storeType,
          threshold: watch.threshold,
          minPrice: data.minPrice,
          matchingOffers,
          sourceUrl: data.sourceUrl,
        });
      }

      await setAlertState(stateKey, {
        lastStatus: shouldAlert ? "below" : "above",
        lastAlertHash: currentHash,
        updatedAt: new Date().toISOString(),
      });

      results.push({
        item: watch.item,
        serverType: watch.serverType,
        storeType: watch.storeType,
        threshold: watch.threshold,
        minPrice: data.minPrice,
        totalOffers: data.totalOffers,
        matchingOffers,
        sourceUrl: data.sourceUrl,
        shouldAlert,
        shouldNotify,
      });
    } catch (error) {
      errors.push({
        item: watch.item,
        serverType: watch.serverType,
        storeType: watch.storeType,
        threshold: watch.threshold,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    results,
    errors,
  };
}
