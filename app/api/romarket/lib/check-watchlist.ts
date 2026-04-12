import crypto from "node:crypto";
import { WATCHLIST, type WatchItem } from "../WATCHLIST";
import { parseOffersFromDocument } from "../utils/parseOffersFromDocument";
import { notifyDiscord, notifyDiscordError } from "./discord";
import { fetchMarketHtml, type MarketOffer } from "./ro-market";
import { getAlertState, setAlertState } from "./state";
import { isOfferMatchingWatchItem } from "../utils/isOfferMatchingWatchItem";

type CheckResult = {
  item: string;
  serverType: string;
  storeType: "BUY" | "SELL";
  threshold: number;
  minPrice: number | null;
  totalOffers: number;
  matchingOffers: MarketOffer[];
  sourceUrl: string;
  alertChannel: string;
  shouldAlert: boolean;
  shouldNotify: boolean;
};

type CheckError = {
  item: string;
  serverType: string;
  storeType: "BUY" | "SELL";
  threshold: number;
  alertChannel: string;
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

function validateWatchlistEnv() {
  for (const watch of WATCHLIST.filter((x) => x.enabled)) {
    if (!process.env[watch.alertChannel]) {
      throw new Error(
        `Missing Discord webhook env var for alertChannel="${watch.alertChannel}"`,
      );
    }
  }
}

export async function runWatchlistCheck() {
  validateWatchlistEnv();

  const results: CheckResult[] = [];
  const errors: CheckError[] = [];

  for (const watch of WATCHLIST.filter((x) => x.enabled)) {
    try {
      const data = await getMarketData(
        watch.item,
        watch.serverType,
        watch.storeType,
      );

      const itemOffers = data.offers.filter((offer) =>
        isOfferMatchingWatchItem(watch, offer.name),
      );

      const matchingOffers = itemOffers.filter(
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

      if (shouldNotify) {
        await notifyDiscord({
          item: watch.item,
          serverType: watch.serverType,
          storeType: watch.storeType,
          threshold: watch.threshold,
          minPrice: data.minPrice,
          matchingOffers,
          sourceUrl: data.sourceUrl,
          alertChannel: watch.alertChannel,
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
        alertChannel: watch.alertChannel,
        shouldAlert,
        shouldNotify,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      errors.push({
        item: watch.item,
        serverType: watch.serverType,
        storeType: watch.storeType,
        threshold: watch.threshold,
        alertChannel: watch.alertChannel,
        error: message,
      });

      try {
        await notifyDiscordError({
          title: "RO Market watchlist failed",
          message: [
            `Item: ${watch.item}`,
            `Server: ${watch.serverType}`,
            `StoreType: ${watch.storeType}`,
            `Threshold: ${watch.threshold}`,
            `Channel: ${watch.alertChannel}`,
            `Error: ${message}`,
          ].join("\n"),
        });
      } catch (notifyError) {
        const notifyMessage =
          notifyError instanceof Error ? notifyError.message : "Unknown error";

        errors.push({
          item: watch.item,
          serverType: watch.serverType,
          storeType: watch.storeType,
          threshold: watch.threshold,
          alertChannel: watch.alertChannel,
          error: `Failed to send error notification: ${notifyMessage}`,
        });
      }
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    results,
    errors,
  };
}
