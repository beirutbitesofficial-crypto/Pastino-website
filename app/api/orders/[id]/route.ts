import { ensureSchema, requireAdmin } from "@/lib/store";

const allowed = new Set(["new","accepted","preparing","ready","completed","cancelled"]);
export async function PATCH(request: Request, context: { params: Promise<{ id:string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return Response.json({ error:auth.error }, { status:auth.status });
  try {
    const { id } = await context.params; const orderId = Number(id); const body = await request.json() as { status?:string };
    if (!Number.isInteger(orderId) || !allowed.has(body.status||"")) return Response.json({ error:"Invalid order or status." }, { status:400 });
    const db = await ensureSchema();
    await db.prepare("UPDATE online_orders SET status=?, updated_at=? WHERE id=?").bind(body.status,new Date().toISOString(),orderId).run();
    return Response.json({ ok:true });
  } catch (error) { return Response.json({ error:error instanceof Error?error.message:"Unable to update order." }, { status:500 }); }
}
