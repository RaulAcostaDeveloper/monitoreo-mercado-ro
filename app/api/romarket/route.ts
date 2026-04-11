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

  const result = await runWatchlistCheck({ notify: true });

  return Response.json({
    ok: result.errors.length === 0,
    checkedAt: result.checkedAt,
    sent: result.results.filter((x) => x.shouldNotify).length,
    errors: result.errors,
  });
}
