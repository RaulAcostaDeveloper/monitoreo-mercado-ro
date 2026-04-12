import { WatchItem } from "../WATCHLIST";
import { normalizeItemName } from "./normalizeItemName";

export const isOfferMatchingWatchItem = (
  watch: WatchItem,
  offerName: string,
) => {
  const normalizedOffer = normalizeItemName(offerName);

  const candidates = [watch.item, ...(watch.aliases ?? [])].map(
    normalizeItemName,
  );

  return candidates.includes(normalizedOffer);
};
