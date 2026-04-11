import { MarketOffer } from "./ro-market";

type NotifyPayload = {
  item: string;
  serverType: string;
  storeType: "BUY" | "SELL";
  threshold: number;
  minPrice: number | null;
  matchingOffers: MarketOffer[];
  sourceUrl: string;
  alertChannel: string;
};

type NotifyErrorPayload = {
  title: string;
  message: string;
};

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatOffer(offer: MarketOffer) {
  const parts = [
    `Price: ${formatNumber(offer.price)}`,
    offer.quantity != null ? `Qty: ${offer.quantity}` : null,
    offer.seller ? `Seller: ${offer.seller}` : null,
    offer.stallName ? `Stall: ${offer.stallName}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

export async function notifyDiscord(payload: NotifyPayload) {
  const webhookUrl = process.env[payload.alertChannel];

  if (!webhookUrl) {
    throw new Error(
      `Missing Discord webhook env var for alertChannel="${payload.alertChannel}"`,
    );
  }

  const topOffers = payload.matchingOffers.slice(0, 5);

  const body = {
    content: `🔔 ${payload.item} (${payload.serverType}/${payload.storeType}) is at or below ${formatNumber(payload.threshold)}`,
    embeds: [
      {
        title: `${payload.item} - market alert`,
        url: payload.sourceUrl,
        description: [
          `Threshold: ${formatNumber(payload.threshold)}`,
          `Lowest found: ${payload.minPrice != null ? formatNumber(payload.minPrice) : "N/A"}`,
          `Matches: ${payload.matchingOffers.length}`,
          `Channel: ${payload.alertChannel}`,
        ].join("\n"),
        fields: topOffers.map((offer, index) => ({
          name: `Offer ${index + 1}`,
          value: formatOffer(offer),
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: {
      parse: [],
    },
  };

  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${text}`);
  }
}

export async function notifyDiscordError(payload: NotifyErrorPayload) {
  const webhookUrl = process.env.romarket_errors;

  if (!webhookUrl) {
    throw new Error('Missing Discord webhook env var for "romarket_errors"');
  }

  const body = {
    content: `⚠️ ${payload.title}`,
    embeds: [
      {
        title: payload.title,
        description: payload.message,
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: {
      parse: [],
    },
  };

  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord error webhook failed: ${res.status} ${text}`);
  }
}
