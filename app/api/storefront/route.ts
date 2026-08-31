import { getStorefrontData } from "@/lib/store";

export async function GET() {
  try {
    return Response.json(await getStorefrontData(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load menu." }, { status: 500 });
  }
}
