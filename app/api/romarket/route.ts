import { runWatchlistCheck } from "./lib/check-watchlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request) {
  const secret = process.env.ROMARKET_CRON_SECRET;
  const incoming = req.headers.get("x-romarket-secret");

  return !!secret && incoming === secret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { checkedAt, results, errors } = await runWatchlistCheck();

    return Response.json({
      ok: errors.length === 0,
      checkedAt,
      checked: results.length,
      notified: results.filter((r) => r.shouldNotify).length,
      errors,
    });
  } catch (error) {
    console.error("[ROMARKET_ROUTE_ERROR]", error);

    return Response.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
