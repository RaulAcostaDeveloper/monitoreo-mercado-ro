import { NextRequest, NextResponse } from "next/server";
import {
  fetchGnjoyMarket,
  type ServerType,
  type StoreType,
} from "../lib/gnjoy-market";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const itemName = searchParams.get("itemName") ?? "Yggdrasil Berry";
    const serverType = (searchParams.get("serverType") ??
      "FREYA") as ServerType;
    const storeType = (searchParams.get("storeType") ?? "BUY") as StoreType;

    const data = await fetchGnjoyMarket({
      itemName,
      serverType,
      storeType,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
