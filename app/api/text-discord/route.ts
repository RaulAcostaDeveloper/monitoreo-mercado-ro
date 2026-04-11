export async function GET() {
  const webhook = process.env.DISCORD_WEBHOOK_TEST;

  if (!webhook) {
    return Response.json(
      { ok: false, error: "No existe DISCORD_WEBHOOK_TEST" },
      { status: 500 },
    );
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: "✅ Prueba desde Vercel/Next.js",
    }),
  });

  const text = await res.text();

  return Response.json({
    ok: res.ok,
    status: res.status,
    discordResponse: text,
  });
}
